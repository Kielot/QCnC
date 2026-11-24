"""Stage 1: Test controller (orchestrator).

Runs stages 2-8 in order, once per trial. It owns the run state, the trial ID,
and the failure policy. Stages never call each other.
"""
from __future__ import annotations

import logging
import time
import uuid
from dataclasses import dataclass
from typing import Callable, Optional

from .models import (
    Outcome, Severity, StageError, State, TrialRecord,
)
from .stages import (
    CalibrationStage, CaptureStage, GroundingStage, MotionExecutor,
    SanityGate, ToolpathStage, TrialLogger,
)

log = logging.getLogger("qcnc.controller")


@dataclass
class ControllerConfig:
    max_grounding_attempts: int = 2      # total tries (1 = no retry)
    recapture_on_retry: bool = True      # take a fresh screenshot per attempt
    # Unexpected (non-StageError) exceptions. Hardware stages always abort.
    software_error_severity: Severity = Severity.SKIP


class TestController:
    __test__ = False  # stop pytest from collecting this as a test class

    def __init__(
        self,
        capture: CaptureStage,
        grounding: GroundingStage,
        gate: SanityGate,
        calibration: CalibrationStage,
        toolpath: ToolpathStage,
        motion: MotionExecutor,
        trial_logger: TrialLogger,
        config: Optional[ControllerConfig] = None,
        on_state_change: Optional[Callable[[str, State], None]] = None,
    ):
        self._capture = capture
        self._grounding = grounding
        self._gate = gate
        self._calibration = calibration
        self._toolpath = toolpath
        self._motion = motion
        self._logger = trial_logger
        self.config = config or ControllerConfig()
        self._on_state_change = on_state_change
        self._state = State.IDLE
        self._counter = 0

    @property
    def state(self) -> State:
        return self._state

    # ---- public API -------------------------------------------------------

    def run_trial(self, instruction: str) -> TrialRecord:
        trial_id = self._new_trial_id()
        rec = TrialRecord(trial_id=trial_id, instruction=instruction)
        t_start = time.perf_counter()
        try:
            self._run_pipeline(rec, instruction, t_start)
            rec.outcome = Outcome.SUCCESS
            self._set_state(trial_id, State.DONE)
        except StageError as e:
            self._handle_failure(rec, e)
        except Exception as e:  # a bug in a stage; never let it escape mid-motion
            stage = rec.error_stage or self._state.value
            hardware = self._state in (State.MOVING, State.PRESSING)
            sev = Severity.ABORT if hardware else self.config.software_error_severity
            log.exception("[%s] unexpected error in %s", trial_id, stage)
            self._handle_failure(rec, StageError(stage, f"{type(e).__name__}: {e}", sev))
        finally:
            rec.final_state = self._state
            if rec.execution_time_s is None:
                rec.execution_time_s = time.perf_counter() - t_start
            self._safe_log(rec)
        return rec

    def run_batch(self, instructions: list[str]) -> list[TrialRecord]:
        """Run trials in order; stop the whole batch on ABORTED."""
        results: list[TrialRecord] = []
        for instr in instructions:
            rec = self.run_trial(instr)
            results.append(rec)
            if rec.outcome is Outcome.ABORTED:
                log.error("Batch aborted at trial %s", rec.trial_id)
                break
        return results

    # ---- pipeline ---------------------------------------------------------

    def _run_pipeline(self, rec: TrialRecord, instruction: str, t_start: float) -> None:
        tid = rec.trial_id
        screenshot = None
        grounding = None

        # Stages 2-4 with retry. Retries re-enter from capture by default so the
        # model sees the current screen, not a stale one.
        for attempt in range(1, self.config.max_grounding_attempts + 1):
            rec.grounding_attempts = attempt
            try:
                if screenshot is None or self.config.recapture_on_retry:
                    self._set_state(tid, State.CAPTURING)
                    screenshot = self._timed(rec, "capture", self._capture.capture, tid)
                    rec.screenshot_path = screenshot.path

                self._set_state(tid, State.GROUNDING)
                grounding = self._timed(rec, "grounding", self._grounding.ground,
                                        tid, instruction, screenshot)
                rec.grounding = grounding
                self._timed(rec, "sanity_gate", self._gate.check, tid, instruction, grounding)
                break
            except StageError as e:
                last = attempt == self.config.max_grounding_attempts
                if e.severity is Severity.RETRY and not last:
                    log.warning("[%s] attempt %d failed (%s), retrying", tid, attempt, e)
                    continue
                if e.severity is Severity.RETRY:  # out of attempts
                    raise StageError(e.stage, f"{e.message} (after {attempt} attempts)", Severity.SKIP)
                raise

        # Stages 5-6: pure computation, nothing moves yet.
        self._set_state(tid, State.PLANNING)
        target = self._timed(rec, "calibration", self._calibration.to_physical,
                             tid, grounding.centroid_norm)
        rec.target_mm = target
        toolpath = self._timed(rec, "toolpath", self._toolpath.build, tid, target)
        rec.gcode = toolpath.move_gcode + toolpath.press_gcode

        # Stage 7: motion. Failures here always abort and trigger safe_stop.
        self._set_state(tid, State.MOVING)
        self._timed(rec, "move", self._motion.move, tid, toolpath, hardware=True)
        self._set_state(tid, State.PRESSING)
        self._timed(rec, "press", self._motion.press, tid, toolpath, hardware=True)

        # Thesis definition: screenshot processing start -> press complete.
        rec.execution_time_s = time.perf_counter() - t_start

    # ---- helpers ----------------------------------------------------------

    def _timed(self, rec: TrialRecord, name: str, fn, *args, hardware: bool = False):
        rec.error_stage = name
        t0 = time.perf_counter()
        try:
            return fn(*args)
        except StageError as e:
            if hardware:
                e.severity = Severity.ABORT  # controller overrides: hardware faults stop the run
            raise
        finally:
            rec.stage_times_s[name] = rec.stage_times_s.get(name, 0.0) + (time.perf_counter() - t0)

    def _handle_failure(self, rec: TrialRecord, err: StageError) -> None:
        rec.error_stage = err.stage
        rec.error_message = err.message
        self._set_state(rec.trial_id, State.ERROR)
        if self._state_was_hardware(err.stage):
            self._motion.safe_stop(rec.trial_id)
        rec.outcome = Outcome.ABORTED if err.severity is Severity.ABORT else Outcome.SKIPPED
        log.error("[%s] %s -> %s", rec.trial_id, err, rec.outcome.value)

    @staticmethod
    def _state_was_hardware(stage: str) -> bool:
        return stage in ("move", "press")

    def _set_state(self, trial_id: str, new: State) -> None:
        self._state = new
        log.debug("[%s] state -> %s", trial_id, new.value)
        if self._on_state_change:
            try:
                self._on_state_change(trial_id, new)
            except Exception:
                log.exception("on_state_change callback failed")

    def _safe_log(self, rec: TrialRecord) -> None:
        try:
            self._logger.log(rec)
        except Exception:
            log.exception("[%s] trial logger failed", rec.trial_id)

    def _new_trial_id(self) -> str:
        self._counter += 1
        return f"T{time.strftime('%Y%m%d-%H%M%S')}-{self._counter:03d}-{uuid.uuid4().hex[:4]}"
