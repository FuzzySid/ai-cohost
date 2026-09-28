"""Tier-level token prices and assumed monthly usage for cost projections."""

from app.llm_client import TIER_MODELS

# EUR per million tokens. Illustrative rates; adjust to match configured provider pricing.
TIER_PRICING_EUR = {
    "cheap": {"input": 1.0, "output": 5.0},
    "mid": {"input": 3.0, "output": 15.0},
    "premium": {"input": 5.0, "output": 25.0},
}

MODEL_TO_TIER = {model: tier for tier, model in TIER_MODELS.items()}

DEFAULT_AVG_TOKENS = {
    "reply_draft": {"in": 800, "out": 120, "monthly_volume": 65},
    "weekly_brief": {"in": 600, "out": 300, "monthly_volume": 4.3},
}
