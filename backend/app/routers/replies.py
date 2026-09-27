import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.agents.reply_drafter import draft_reply as run_reply_drafter

router = APIRouter(tags=["replies"])
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
THREADS_PATH = DATA_DIR / "guest_messages.json"
LISTINGS_PATH = DATA_DIR / "listings.json"


class DraftRequest(BaseModel):
    thread_id: str


class SendRequest(BaseModel):
    thread_id: str
    message: str = Field(min_length=1)


def _read_json(path: Path) -> list[dict]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=500, detail=f"Could not read {path.name}") from exc


def _write_threads(threads: list[dict]) -> None:
    temporary_path = THREADS_PATH.with_suffix(".json.tmp")
    temporary_path.write_text(json.dumps(threads, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary_path.replace(THREADS_PATH)


def _get_thread(thread_id: str, threads: list[dict] | None = None) -> dict:
    for thread in threads if threads is not None else _read_json(THREADS_PATH):
        if thread["thread_id"] == thread_id:
            return thread
    raise HTTPException(status_code=404, detail="Thread not found")


def _get_listing(listing_id: str, listings: list[dict] | None = None) -> dict:
    for listing in listings if listings is not None else _read_json(LISTINGS_PATH):
        if listing["id"] == listing_id:
            return listing
    raise HTTPException(status_code=404, detail="Listing not found")


def _last_guest_message(thread: dict) -> dict:
    for message in reversed(thread["messages"]):
        if message["sender"] == "guest":
            return message
    return thread["messages"][-1]


@router.get("/replies/threads")
def list_threads():
    threads = _read_json(THREADS_PATH)
    listings = {listing["id"]: listing for listing in _read_json(LISTINGS_PATH)}
    summaries = []
    for thread in threads:
        last_message = _last_guest_message(thread)
        listing = listings.get(thread["listing_id"])
        if listing is None:
            raise HTTPException(status_code=404, detail=f"Listing not found for thread {thread['thread_id']}")
        summaries.append({
            "thread_id": thread["thread_id"],
            "guest": thread["guest"],
            "listing_id": thread["listing_id"],
            "listing_name": listing["name"],
            "unit": listing["unit"],
            "channel": thread["channel"],
            "last_message": last_message["text"],
            "language": last_message.get("language", "unknown"),
            "updated_at": thread.get("updated_at", last_message.get("ts", "")),
            "status": thread.get("status", "needs_action"),
        })
    return summaries


@router.get("/replies/threads/{thread_id}")
def get_thread(thread_id: str):
    thread = _get_thread(thread_id)
    listing = _get_listing(thread["listing_id"])
    return {
        "thread_id": thread["thread_id"],
        "guest": thread["guest"],
        "listing_id": thread["listing_id"],
        "listing_name": listing["name"],
        "unit": listing["unit"],
        "channel": thread["channel"],
        "language": thread.get("language", "unknown"),
        "status": thread.get("status", "needs_action"),
        "messages": thread["messages"],
    }


@router.post("/replies/draft")
def draft_thread_reply(request: DraftRequest):
    thread = _get_thread(request.thread_id)
    listing = _get_listing(thread["listing_id"])
    try:
        return run_reply_drafter(thread, listing)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.post("/replies/send")
def send_thread_reply(request: SendRequest):
    threads = _read_json(THREADS_PATH)
    thread = _get_thread(request.thread_id, threads)
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    language = _last_guest_message(thread).get("language", "unknown")
    thread["messages"].append({"sender": "host", "language": language, "text": request.message.strip(), "ts": now})
    thread["status"] = "sent"
    thread["updated_at"] = now
    _write_threads(threads)
    return {"thread_id": thread["thread_id"], "status": "sent"}
