"""Compute a data-grounded weekly portfolio brief and ask the model only for prose."""

import json
import logging
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from app import cost_meter
from app.agents.conflict_detector import detect_conflicts
from app.llm_client import call_model

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
REVIEW_RISK_KEYWORDS = ("noisy", "dirty", "broken", "cancelled", "refund")
logger = logging.getLogger(__name__)


def _load(name: str) -> list[dict[str, Any]]:
    return json.loads((DATA_DIR / name).read_text(encoding="utf-8"))


def _date(value: str) -> date:
    return date.fromisoformat(value[:10])


def _message_time(message: dict[str, Any]) -> datetime | None:
    """Use the latest guest message timestamp, with old seed schemas supported."""
    guest_messages = [item for item in message.get("messages", []) if item.get("sender") == "guest"]
    value = guest_messages[-1].get("ts") if guest_messages else message.get("received_at", message.get("updated_at"))
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)


def _compute_stats() -> dict[str, Any]:
    bookings = _load("calendar_bookings.json")
    pricing = _load("pricing.json")
    reviews = _load("reviews.json")
    messages = _load("guest_messages.json")
    listings = _load("listings.json")
    today = datetime.now(timezone.utc).date()

    booked_nights: dict[str, set[date]] = {}
    for booking in bookings:
        check_in, check_out = _date(booking["check_in"]), _date(booking["check_out"])
        nights = booked_nights.setdefault(booking["listing_id"], set())
        current = check_in
        while current < check_out:
            nights.add(current)
            current += timedelta(days=1)

    window = [today + timedelta(days=offset) for offset in range(30)]
    gaps: list[dict[str, Any]] = []
    occupied_slots = 0
    for listing in listings:
        booked = booked_nights.get(listing["id"], set())
        occupied_slots += sum(night in booked for night in window)
        current_gap: list[date] = []
        listing_gaps: list[list[date]] = []
        for night in window:
            if night not in booked:
                current_gap.append(night)
            elif current_gap:
                listing_gaps.append(current_gap)
                current_gap = []
        if current_gap:
            listing_gaps.append(current_gap)
        if listing_gaps:
            longest = max(listing_gaps, key=len)
            gaps.append({
                "listing_id": listing["id"],
                "listing_name": listing["name"],
                "start": longest[0].isoformat(),
                "end": (longest[-1] + timedelta(days=1)).isoformat(),
                "nights": len(longest),
            })

    biggest_gap = max(gaps, key=lambda gap: gap["nights"], default=None)
    listing_rates: dict[str, list[float]] = {}
    portfolio_rates: list[float] = []
    for row in pricing:
        rate = float(row["nightly_rate_eur"])
        listing_rates.setdefault(row["listing_id"], []).append(rate)
        portfolio_rates.append(rate)
    average_rate = (
        sum(listing_rates.get(biggest_gap["listing_id"], [])) / len(listing_rates[biggest_gap["listing_id"]])
        if biggest_gap and listing_rates.get(biggest_gap["listing_id"])
        else sum(portfolio_rates) / len(portfolio_rates) if portfolio_rates else 0
    )
    projected_revenue = round(biggest_gap["nights"] * average_rate) if biggest_gap else 0

    total_slots = 30 * len(listings)
    occupancy_percent = round(occupied_slots / total_slots * 100) if total_slots else 0
    trend = []
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        occupied = sum(day in booked_nights.get(listing["id"], set()) for listing in listings)
        trend.append({"date": day.isoformat(), "percent": round(occupied / len(listings) * 100) if listings else 0})

    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    unanswered = []
    for message in messages:
        if message.get("status") not in {"needs_action", "unanswered"}:
            continue
        timestamp = _message_time(message)
        if timestamp and timestamp < cutoff:
            guest_message = next((item for item in reversed(message.get("messages", [])) if item.get("sender") == "guest"), {})
            unanswered.append({
                "thread_id": message.get("thread_id"),
                "listing_id": message.get("listing_id"),
                "listing_name": message.get("listing_name"),
                "guest": message.get("guest"),
                "channel": message.get("channel"),
                "received_at": timestamp.isoformat(),
                "message": guest_message.get("text", ""),
            })
    unanswered.sort(key=lambda item: item["received_at"])

    risky_reviews = [
        {key: review.get(key) for key in ("id", "listing_id", "guest", "channel", "rating", "text", "received_at")}
        for review in reviews
        if any(keyword in review.get("text", "").casefold() for keyword in REVIEW_RISK_KEYWORDS)
    ]
    conflicts = detect_conflicts()

    return {
        "as_of": today.isoformat(),
        "biggest_gap": biggest_gap,
        "potential_revenue_eur": projected_revenue,
        "occupancy_percent": occupancy_percent,
        "trend": trend,
        "unanswered": unanswered[:1],
        "risky_reviews": risky_reviews[:1],
        "top_conflict": conflicts[0] if conflicts else None,
    }


def _parse_model_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning("Weekly brief model returned invalid JSON; using computed copy instead")
        return {}
    if not isinstance(result, dict):
        logger.warning("Weekly brief model returned non-object JSON; using computed copy instead")
        return {}
    return result


def generate_weekly_brief() -> dict[str, Any]:
    stats = _compute_stats()
    system_prompt = """You write concise prose for a vacation-rental host's weekly brief.
The supplied JSON contains all allowed facts and all computed numbers. Never calculate, infer, or add a number, date, guest, property, channel, event, or claim that is not explicitly present in the supplied facts. Describe only the supplied non-null issue records. Include one flagged issue for each non-null unanswered, risky_reviews, and top_conflict input, with at most three total. For an empty/null category, omit it. Use the guest's actual message/review/conflict type to describe the issue. If there are no issues, return an empty flagged_issues array and recommend checking availability.
Respond ONLY with JSON shaped as: {"headline_detail": string, "flagged_issues": [{"type": "unanswered_inquiry"|"review_risk"|"conflict", "title": string, "detail": string}], "suggested_action_title": string, "suggested_action_detail": string}. Use these exact type values for matching source records. Keep each field to one concise sentence, under 120 words total. The headline detail and suggested action must refer only to supplied facts; do not add operational recommendations that require unsupported information."""
    result = call_model(tier="mid", system_prompt=system_prompt, user_prompt=json.dumps(stats, ensure_ascii=False, default=str), max_tokens=800)
    cost_meter.log_call(result.model, result.tokens_in, result.tokens_out, call_type="weekly_brief")
    written = _parse_model_json(result.text)

    raw_issues = written.get("flagged_issues", [])
    generated_by_type = {
        issue.get("type"): issue
        for issue in raw_issues if isinstance(raw_issues, list) and isinstance(issue, dict)
    }
    issue_sources = (
        ("unanswered_inquiry", stats["unanswered"][0] if stats["unanswered"] else None),
        ("review_risk", stats["risky_reviews"][0] if stats["risky_reviews"] else None),
        ("conflict", stats["top_conflict"]),
    )
    issues = []
    for issue_type, source in issue_sources:
        if source is None:
            continue
        generated = generated_by_type.get(issue_type, {})
        if issue_type == "unanswered_inquiry":
            fallback_title, fallback_detail = "Unanswered guest inquiry", f"{source['guest']} on {source['channel']} is waiting for a reply: {source['message']}"
            channel, status = source["channel"], "Needs reply"
        elif issue_type == "review_risk":
            fallback_title, fallback_detail = "Guest review needs attention", f"{source['guest']} left a {source['rating']}-star review: {source['text']}"
            channel, status = source["channel"], f"{source['rating']}/5 stars"
        else:
            fallback_title, fallback_detail = source["type"].replace("_", " ").title(), f"{source['type'].replace('_', ' ')} on {', '.join(source['channels'])} for {source['listing_id']} ({' to '.join(source['dates'])})."
            channel, status = ", ".join(source["channels"]), f"{source['severity'].title()} severity"
        title = generated.get("title")
        detail = generated.get("detail")
        issues.append({
            "type": issue_type,
            "title": title.strip() if isinstance(title, str) and title.strip() else fallback_title,
            "detail": detail.strip() if isinstance(detail, str) and detail.strip() else fallback_detail,
            "channel": channel,
            "status": status,
        })

    gap = stats["biggest_gap"]
    if gap:
        headline_label = "Occupancy gap"
        headline_value = f"{gap['nights']} nights open next month"
        default_headline_detail = f"The largest opening is {gap['nights']} nights at {gap['listing_name']}, starting {gap['start']}."
        default_action_title = "Review the largest availability gap"
        default_action_detail = f"Check the {gap['nights']}-night opening at {gap['listing_name']} beginning {gap['start']}."
    else:
        headline_label = "Fully booked"
        headline_value = "No gaps in the next 30 days"
        default_headline_detail = "Every listing is booked throughout the next 30 days."
        default_action_title = "Keep your calendar current"
        default_action_detail = "Review upcoming reservations and keep availability synchronized across channels."

    return {
        "digest_id": f"BR-{datetime.now(timezone.utc).strftime('%y%m%d%H%M%S%f')}",
        "period": f"{stats['trend'][0]['date']} to {stats['trend'][-1]['date']}",
        "headline_stat": {
            "label": headline_label,
            "value": headline_value,
            "detail": written.get("headline_detail") if isinstance(written.get("headline_detail"), str) and written["headline_detail"].strip() else default_headline_detail,
            "potential_revenue_eur": stats["potential_revenue_eur"],
            "occupancy_percent": stats["occupancy_percent"],
        },
        "occupancy_trend": stats["trend"],
        "flagged_issues": issues,
        "suggested_action": {
            "title": written.get("suggested_action_title") if isinstance(written.get("suggested_action_title"), str) and written["suggested_action_title"].strip() else default_action_title,
            "priority": "High" if gap else "Low",
            "detail": written.get("suggested_action_detail") if isinstance(written.get("suggested_action_detail"), str) and written["suggested_action_detail"].strip() else default_action_detail,
            "action": "Review Calendar",
        },
    }
