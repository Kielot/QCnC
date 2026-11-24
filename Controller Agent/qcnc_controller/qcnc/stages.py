"""Stage interfaces (what the controller expects from stages 2-8).

Implement each with a class that has these methods. Raise StageError with a
Severity to tell the controller how serious the failure is. Every call receives
trial_id so logs from every stage can be traced to one trial.
"""
from __future__ import annotations

from typing import Protocol

from .models import GroundingResult, PhysicalPoint, Screenshot, Toolpath, TrialRecord


class CaptureStage(Protocol):
    def capture(self, trial_id: str) -> Screenshot: ...


class GroundingStage(Protocol):
    def ground(self, trial_id: str, instruction: str, screenshot: Screenshot) -> GroundingResult: ...


class SanityGate(Protocol):
    def check(self, trial_id: str, instruction: str, grounding: GroundingResult) -> None:
        """Return normally if OK; raise StageError(severity=RETRY) if not."""


class CalibrationStage(Protocol):
    def to_physical(self, trial_id: str, centroid_norm: tuple[float, float]) -> PhysicalPoint:
        """Raise StageError(severity=SKIP) if the point is outside the CNC workspace."""


class ToolpathStage(Protocol):
    def build(self, trial_id: str, target: PhysicalPoint) -> Toolpath: ...


class MotionExecutor(Protocol):
    def move(self, trial_id: str, toolpath: Toolpath) -> None: ...
    def press(self, trial_id: str, toolpath: Toolpath) -> None: ...
    def safe_stop(self, trial_id: str) -> None:
        """Best-effort: lift the actuator off the screen. Must never raise."""


class TrialLogger(Protocol):
    def log(self, record: TrialRecord) -> None: ...
