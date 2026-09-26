from fastapi import APIRouter

router = APIRouter(tags=["briefs"])


@router.get("/brief/weekly")
def weekly_brief():
    return {
        "digest_id": "BR-883920",
        "period": "Sept 21 to 27, 2026",
        "headline_stat": {"label": "Immediate availability gap", "value": "3 nights open next week", "detail": "Oct 2–5 at Casa Marbella Garden Studio", "potential_revenue_eur": 426, "occupancy_percent": 82},
        "flagged_issues": [
            {"type": "review", "title": "5-Star Review Received", "detail": "Guest Marion left a 5-star review highlighting fast check-in; recommended reply drafted.", "channel": "Airbnb"},
            {"type": "inquiry", "title": "Unanswered High-Value Inquiry", "detail": "Inquiry from Vrbo (Jens M., 6 guests, €1,180 total) requires approval.", "status": "Expiring in 4h"},
            {"type": "turnover", "title": "Turnover Schedules Locked", "detail": "All October turnovers confirmed with Maria via WhatsApp bridge.", "status": "Service Verified"},
        ],
        "suggested_action": {"title": "Weekend Gap Fill", "priority": "High", "detail": "Turn on a 1-night minimum stay for the Oct 3–4 opening on Airbnb. Historical demand suggests it will book within 6 hours at full rate (+€142).", "action": "Apply to Airbnb Calendar"},
    }
