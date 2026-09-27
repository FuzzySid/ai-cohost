import json
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from app.agents.conflict_detector import detect_conflicts

router = APIRouter(tags=["conflicts"])
REVIEWED_PATH = Path(__file__).resolve().parents[2] / "data" / "reviewed_conflicts.json"
LISTINGS_PATH = Path(__file__).resolve().parents[2] / "data" / "listings.json"


def _read_reviewed() -> list[str]:
    try:
        return json.loads(REVIEWED_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []


def _write_reviewed(ids: list[str]) -> None:
    temporary_path = REVIEWED_PATH.with_suffix(".json.tmp")
    temporary_path.write_text(json.dumps(ids, indent=2) + "\n", encoding="utf-8")
    temporary_path.replace(REVIEWED_PATH)


@router.get("/conflicts")
def get_conflicts(include_reviewed: bool = Query(default=False)):
    reviewed_ids = set(_read_reviewed())
    conflicts = detect_conflicts()
    listings = {listing["id"]: listing for listing in json.loads(LISTINGS_PATH.read_text(encoding="utf-8"))}
    enriched = []
    for conflict in conflicts:
        is_reviewed = conflict["id"] in reviewed_ids
        if is_reviewed and not include_reviewed:
            continue
        listing = listings.get(conflict["listing_id"], {})
        enriched.append({
            **conflict,
            "reviewed": is_reviewed,
            "listing": {"name": listing.get("name", conflict["listing_id"]), "unit": listing.get("unit", "")},
        })
    return enriched


@router.post("/conflicts/{conflict_id}/review")
def review_conflict(conflict_id: str):
    conflicts = detect_conflicts()
    if not any(conflict["id"] == conflict_id for conflict in conflicts):
        raise HTTPException(status_code=404, detail="Conflict not found")
    reviewed_ids = _read_reviewed()
    if conflict_id not in reviewed_ids:
        reviewed_ids.append(conflict_id)
        _write_reviewed(reviewed_ids)
    return {"id": conflict_id, "reviewed": True}
