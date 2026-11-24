"""Stage 8: JSONL trial logger. One line per trial, easy to load into pandas."""
from __future__ import annotations

import dataclasses
import enum
import json
from pathlib import Path

from .models import TrialRecord


def _default(o):
    if isinstance(o, enum.Enum):
        return o.value
    return str(o)


class JsonlTrialLogger:
    def __init__(self, path: str = "trials.jsonl"):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)

    def log(self, record: TrialRecord) -> None:
        line = json.dumps(dataclasses.asdict(record), default=_default)
        with self.path.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
