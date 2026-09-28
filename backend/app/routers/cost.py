import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Query

from app.pricing_config import DEFAULT_AVG_TOKENS, MODEL_TO_TIER, TIER_PRICING_EUR

router = APIRouter(tags=["cost"])
LOG_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "cost_log.json"


def _avg_tokens_by_call_type(records: list[dict[str, Any]]) -> dict[str, dict[str, float]]:
    by_type: dict[str, list[dict[str, Any]]] = {}
    for record in records:
        call_type = record.get("call_type", "reply_draft")
        if call_type in DEFAULT_AVG_TOKENS:
            by_type.setdefault(call_type, []).append(record)

    averages = {}
    for call_type, defaults in DEFAULT_AVG_TOKENS.items():
        rows = by_type.get(call_type, [])
        if rows:
            averages[call_type] = {
                "in": sum(float(row.get("tokens_in", 0)) for row in rows) / len(rows),
                "out": sum(float(row.get("tokens_out", 0)) for row in rows) / len(rows),
                "monthly_volume": defaults["monthly_volume"],
            }
        else:
            averages[call_type] = defaults
    return averages


def _project_monthly_cost(tier: str, avg_tokens: dict[str, dict[str, float]]) -> float:
    price = TIER_PRICING_EUR[tier]
    total = sum(
        (
            stats["in"] / 1_000_000 * price["input"]
            + stats["out"] / 1_000_000 * price["output"]
        ) * stats["monthly_volume"]
        for stats in avg_tokens.values()
    )
    return round(total, 2)


def _tier_for_model(model: str) -> str:
    if model in TIER_PRICING_EUR:
        return model
    return MODEL_TO_TIER.get(model, "mid")


def _parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed.astimezone(timezone.utc)


@router.get("/cost/summary")
def cost_summary(tier: str = Query(default="mid", pattern="^(cheap|mid|premium)$")):
    records = json.loads(LOG_PATH.read_text(encoding="utf-8")) if LOG_PATH.exists() else []
    avg_tokens = _avg_tokens_by_call_type(records)
    all_tiers = {name: _project_monthly_cost(name, avg_tokens) for name in TIER_PRICING_EUR}

    recent = sorted(records, key=lambda row: _parse_timestamp(row["timestamp"]), reverse=True)[:10]
    recent_calls = []
    for record in recent:
        call_tier = _tier_for_model(record.get("model", ""))
        price = TIER_PRICING_EUR[call_tier]
        cost = (
            float(record.get("tokens_in", 0)) / 1_000_000 * price["input"]
            + float(record.get("tokens_out", 0)) / 1_000_000 * price["output"]
        )
        recent_calls.append({
            "timestamp": record["timestamp"],
            "tier": call_tier,
            "tokens_in": record.get("tokens_in", 0),
            "tokens_out": record.get("tokens_out", 0),
            "cost_eur": round(cost, 4),
        })

    return {
        "tier": tier,
        "cost_per_host_month_eur": all_tiers[tier],
        "all_tiers": all_tiers,
        "recent_calls": recent_calls,
    }
