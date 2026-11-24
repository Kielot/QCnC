"""Shared data types for the QCnC pipeline.

Every stage only knows its own input and output types defined here.
Only the controller knows the full flow.
"""
from __future__ import annotations

import enum
from dataclasses import dataclass, field
from typing import Optional


class State(enum.Enum):
    IDLE = "IDLE"
    CAPTURING = "CAPTURING"
    GROUNDING = "GROUNDING"   # grounding + sanity gate
    PLANNING = "PLANNING"     # calibration + toolpath (pure computation, no motion)
    MOVING = "MOVING"
    PRESSING = "PRESSING"
    DONE = "DONE"
    ERROR = "ERROR"


class Outcome(enum.Enum):
    SUCCESS = "SUCCESS"   # actuator executed the press (hit verification is separate)
    SKIPPED = "SKIPPED"   # this trial failed, run can continue
    ABORTED = "ABORTED"   # stop the whole run (hardware/safety)


class Severity(enum.Enum):
    """What a stage recommends when it fails. The controller makes the final call."""
    RETRY = "retry"   # worth another attempt (target not found, gate rejected result)
    SKIP = "skip"     # this trial cannot succeed (e.g. target outside CNC workspace)
    ABORT = "abort"   # stop everything (serial lost, limit switch, alarm)


class StageError(Exception):
    def __init__(self, stage: str, message: str, severity: Severity = Severity.ABORT):
        super().__init__(f"[{stage}] {message}")
        self.stage = stage
        self.message = message
        self.severity = severity


# ---- stage payloads -------------------------------------------------------

@dataclass(frozen=True)
class Screenshot:
    path: str
    width_px: int
    height_px: int


@dataclass(frozen=True)
class GroundingResult:
    # Normalized to 0..1 relative to the screenshot (convert Qwen3-VL's native
    # output to this inside the grounding stage, so downstream stages never care).
    bbox_norm: tuple[float, float, float, float]      # x1, y1, x2, y2
    centroid_norm: tuple[float, float]                # x, y
    raw_response: str = ""


@dataclass(frozen=True)
class PhysicalPoint:
    x_mm: float
    y_mm: float


@dataclass(frozen=True)
class Toolpath:
    target: PhysicalPoint
    move_gcode: list[str]    # travel to above the target
    press_gcode: list[str]   # lower, dwell, retract


# ---- trial record ---------------------------------------------------------

@dataclass
class TrialRecord:
    trial_id: str
    instruction: str
    outcome: Optional[Outcome] = None
    final_state: Optional[State] = None
    error_stage: Optional[str] = None
    error_message: Optional[str] = None
    grounding_attempts: int = 0
    screenshot_path: Optional[str] = None
    grounding: Optional[GroundingResult] = None
    target_mm: Optional[PhysicalPoint] = None
    gcode: list[str] = field(default_factory=list)
    stage_times_s: dict[str, float] = field(default_factory=dict)
    # Thesis metric: screenshot processing start -> press complete.
    execution_time_s: Optional[float] = None
    # Filled in by the researcher afterwards (did the actuator hit the right button?).
    press_verified: Optional[bool] = None
    notes: str = ""
