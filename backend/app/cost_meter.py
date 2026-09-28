import json
from datetime import datetime, timezone
from pathlib import Path

_LOG_PATH = Path(__file__).resolve().parent.parent / "data" / "cost_log.json"


def log_call(model: str, tokens_in: int, tokens_out: int, call_type: str) -> None:
    """Append token usage and its workflow type to the local cost log."""
    _LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    records = json.loads(_LOG_PATH.read_text()) if _LOG_PATH.exists() else []
    records.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": model,
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "call_type": call_type,
    })
    _LOG_PATH.write_text(json.dumps(records, indent=2) + "\n")
