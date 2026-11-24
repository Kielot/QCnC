import unittest

from qcnc import ControllerConfig, Outcome, State, TestController
from qcnc.mocks import (BoundsGate, LinearCalibration, MockCapture, MockGrounding,
                        MockMotion, SimpleToolpath)


class ListLogger:
    def __init__(self): self.records = []
    def log(self, r): self.records.append(r)


def build(grounding=None, motion=None, calibration=None, max_attempts=2):
    lg = ListLogger()
    mot = motion or MockMotion()
    ctl = TestController(MockCapture(), grounding or MockGrounding(), BoundsGate(),
                         calibration or LinearCalibration(), SimpleToolpath(), mot, lg,
                         ControllerConfig(max_grounding_attempts=max_attempts))
    return ctl, mot, lg


class ControllerTests(unittest.TestCase):
    def test_happy_path(self):
        ctl, mot, lg = build()
        rec = ctl.run_trial("press the Save button")
        self.assertEqual(rec.outcome, Outcome.SUCCESS)
        self.assertEqual(ctl.state, State.DONE)
        self.assertTrue(any(l.startswith("G1 Z") for l in mot.sent))
        self.assertEqual(len(lg.records), 1)
        self.assertIsNotNone(rec.execution_time_s)

    def test_grounding_retry_then_success(self):
        ctl, _, _ = build(grounding=MockGrounding(fail_times=1))
        rec = ctl.run_trial("press Save")
        self.assertEqual(rec.outcome, Outcome.SUCCESS)
        self.assertEqual(rec.grounding_attempts, 2)

    def test_grounding_exhausted_skips_without_moving(self):
        ctl, mot, _ = build(grounding=MockGrounding(fail_times=5))
        rec = ctl.run_trial("press Save")
        self.assertEqual(rec.outcome, Outcome.SKIPPED)
        self.assertEqual(mot.sent, [])

    def test_outside_workspace_skips(self):
        ctl, mot, _ = build(grounding=MockGrounding(centroid=(0.99, 0.99)),
                            calibration=LinearCalibration(max_x=100, max_y=100))
        self.assertEqual(ctl.run_trial("press Save").outcome, Outcome.SKIPPED)
        self.assertEqual(mot.sent, [])

    def test_motion_failure_aborts_and_safe_stops(self):
        ctl, mot, _ = build(motion=MockMotion(fail_on="press"))
        rec = ctl.run_trial("press Save")
        self.assertEqual(rec.outcome, Outcome.ABORTED)
        self.assertTrue(mot.safe_stopped)
        self.assertEqual(ctl.state, State.ERROR)

    def test_batch_stops_on_abort(self):
        ctl, _, lg = build(motion=MockMotion(fail_on="move"))
        results = ctl.run_batch(["a", "b", "c"])
        self.assertEqual(len(results), 1)

    def test_unique_trial_ids(self):
        ctl, _, _ = build()
        ids = {ctl.run_trial("x").trial_id for _ in range(5)}
        self.assertEqual(len(ids), 5)


if __name__ == "__main__":
    unittest.main()
