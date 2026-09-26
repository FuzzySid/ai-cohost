from fastapi import APIRouter

router = APIRouter(tags=["conflicts"])


@router.get("/conflicts")
def get_conflicts():
    return [
        {"listing_id": "lst_003", "type": "double_booking", "channels": ["Airbnb", "Vrbo"], "dates": ["2026-10-14", "2026-10-18"], "severity": "high"},
        {"listing_id": "lst_002", "type": "rate_disparity", "channels": ["Airbnb", "Vrbo"], "dates": ["2026-11-14", "2026-11-18"], "severity": "medium", "nightly_rate_difference_eur": 28},
        {"listing_id": "lst_001", "type": "calendar_sync_delay", "channels": ["Booking.com", "Airbnb"], "dates": ["2026-10-24", "2026-10-25"], "severity": "low"},
    ]
