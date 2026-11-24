"""Mock stages so the controller can be run and tested with no hardware or model."""
from __future__ import annotations

from .models import (
    GroundingResult, PhysicalPoint, Screenshot, Severity, StageError, Toolpath,
)


class MockCapture:
    def capture(self, trial_id):
        return Screenshot(path=f"/tmp/{trial_id}.png", width_px=1920, height_px=1080)


class MockGrounding:
    """Fails `fail_times` times (as 'not found'), then returns a centered button."""
    def __init__(self, fail_times: int = 0, centroid=(0.5, 0.5)):
        self.fail_times = fail_times
        self.centroid = centroid
        self.calls = 0

    def ground(self, trial_id, instruction, screenshot):
        self.calls += 1
        if self.calls <= self.fail_times:
            raise StageError("grounding", "target not found", Severity.RETRY)
        cx, cy = self.centroid
        return GroundingResult((cx - .05, cy - .03, cx + .05, cy + .03), (cx, cy), "mock")


class BoundsGate:
    """Real, simple sanity gate: centroid must lie inside the screenshot."""
    def check(self, trial_id, instruction, grounding):
        x, y = grounding.centroid_norm
        if not (0.0 <= x <= 1.0 and 0.0 <= y <= 1.0):
            raise StageError("sanity_gate", f"centroid out of bounds: {x:.3f},{y:.3f}", Severity.RETRY)


class LinearCalibration:
    """Placeholder: scales normalized coords to a screen area in mm."""
    def __init__(self, width_mm=527.0, height_mm=296.0, max_x=600.0, max_y=400.0):
        self.w, self.h, self.max_x, self.max_y = width_mm, height_mm, max_x, max_y

    def to_physical(self, trial_id, centroid_norm):
        p = PhysicalPoint(centroid_norm[0] * self.w, centroid_norm[1] * self.h)
        if not (0 <= p.x_mm <= self.max_x and 0 <= p.y_mm <= self.max_y):
            raise StageError("calibration", "target outside CNC workspace", Severity.SKIP)
        return p


class SimpleToolpath:
    def __init__(self, z_up=5.0, z_press=-1.0, feed=3000, dwell_ms=150):
        self.z_up, self.z_press, self.feed, self.dwell_ms = z_up, z_press, feed, dwell_ms

    def build(self, trial_id, target):
        move = ["G21", "G90", f"G0 Z{self.z_up}", f"G0 X{target.x_mm:.2f} Y{target.y_mm:.2f}"]
        press = [f"G1 Z{self.z_press} F{self.feed}", f"G4 P{self.dwell_ms / 1000:.2f}", f"G0 Z{self.z_up}"]
        return Toolpath(target, move, press)


class MockMotion:
    def __init__(self, fail_on: str | None = None):
        self.fail_on = fail_on   # "move" or "press"
        self.sent: list[str] = []
        self.safe_stopped = False

    def move(self, trial_id, toolpath):
        if self.fail_on == "move":
            raise StageError("move", "GRBL alarm", Severity.ABORT)
        self.sent += toolpath.move_gcode

    def press(self, trial_id, toolpath):
        if self.fail_on == "press":
            raise StageError("press", "serial timeout", Severity.ABORT)
        self.sent += toolpath.press_gcode

    def safe_stop(self, trial_id):
        self.safe_stopped = True
