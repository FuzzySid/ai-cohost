"""Pure, deterministic cross-channel consistency rules over local seed data."""

import json
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
RATE_DRIFT_THRESHOLD_PCT = 15
SYNC_DELAY_WARN_HOURS = 6
SYNC_DELAY_HIGH_HOURS = 24


def _load(name: str) -> list[dict]:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def detect_conflicts() -> list[dict]:
    bookings = _load("calendar_bookings.json")
    pricing = _load("pricing.json")
    conflicts: list[dict] = []

    by_listing: dict[str, list[dict]] = {}
    for booking in bookings:
        by_listing.setdefault(booking["listing_id"], []).append(booking)
    for listing_id, listing_bookings in by_listing.items():
        for i, first in enumerate(listing_bookings):
            for second in listing_bookings[i + 1:]:
                if first["channel"] == second["channel"]:
                    continue
                if first["check_in"] < second["check_out"] and second["check_in"] < first["check_out"]:
                    conflicts.append({
                        "id": f"CF-{listing_id}-{first['id']}-{second['id']}",
                        "listing_id": listing_id,
                        "type": "double_booking",
                        "channels": [first["channel"], second["channel"]],
                        "dates": [max(first["check_in"], second["check_in"]), min(first["check_out"], second["check_out"])],
                        "severity": "high",
                        "bookings": [first, second],
                    })

    by_listing_date: dict[tuple[str, str], list[dict]] = {}
    for price in pricing:
        by_listing_date.setdefault((price["listing_id"], price["date"]), []).append(price)
    for (listing_id, date), date_prices in by_listing_date.items():
        for i, first in enumerate(date_prices):
            for second in date_prices[i + 1:]:
                if first["channel"] == second["channel"]:
                    continue
                low, high = sorted([first["nightly_rate_eur"], second["nightly_rate_eur"]])
                if low and (high - low) / low * 100 > RATE_DRIFT_THRESHOLD_PCT:
                    rate_rows = [first, second]
                    conflicts.append({
                        "id": f"PR-{listing_id}-{date}-{first['channel']}-{second['channel']}",
                        "listing_id": listing_id,
                        "type": "rate_disparity",
                        "channels": [first["channel"], second["channel"]],
                        "dates": [date, date],
                        "severity": "medium",
                        "nightly_rate_difference_eur": round(high - low, 2),
                        "nightly_rates": [
                            {"channel": row["channel"], "nightly_rate_eur": row["nightly_rate_eur"]}
                            for row in rate_rows
                        ],
                    })

    now = datetime.now(timezone.utc)
    for booking in bookings:
        synced_at = booking.get("last_synced_at")
        if not synced_at:
            continue
        synced = datetime.fromisoformat(synced_at.replace("Z", "+00:00"))
        if synced.tzinfo is None:
            synced = synced.replace(tzinfo=timezone.utc)
        hours_stale = (now - synced.astimezone(timezone.utc)).total_seconds() / 3600
        if hours_stale > SYNC_DELAY_HIGH_HOURS:
            severity = "medium"
        elif hours_stale > SYNC_DELAY_WARN_HOURS:
            severity = "low"
        else:
            continue
        conflicts.append({
            "id": f"SY-{booking['listing_id']}-{booking['channel']}",
            "listing_id": booking["listing_id"],
            "type": "calendar_sync_delay",
            "channels": [booking["channel"]],
            "dates": [booking["check_in"], booking["check_out"]],
            "severity": severity,
            "last_synced_at": synced.isoformat(),
            "hours_stale": round(hours_stale, 1),
        })
    return conflicts
