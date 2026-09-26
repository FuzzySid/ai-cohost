from fastapi import APIRouter, Query

router = APIRouter(tags=["cost"])


@router.get("/cost/summary")
def cost_summary(tier: str = Query(default="mid", pattern="^(cheap|mid|premium)$")):
    costs = {"cheap": 0.10, "mid": 0.30, "premium": 0.50}
    return {"tier": tier, "cost_per_host_month_eur": costs[tier], "all_tiers": costs}
