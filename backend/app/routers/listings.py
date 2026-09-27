import json
from pathlib import Path

from fastapi import APIRouter

router = APIRouter(tags=["listings"])
LISTINGS_PATH = Path(__file__).resolve().parents[2] / "data" / "listings.json"


@router.get("/listings/count")
def listing_count():
    listings = json.loads(LISTINGS_PATH.read_text(encoding="utf-8"))
    return {"count": len(listings)}
