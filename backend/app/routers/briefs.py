from fastapi import APIRouter

from app.agents.weekly_brief import generate_weekly_brief

router = APIRouter(tags=["briefs"])


@router.get("/brief/weekly")
def weekly_brief():
    return generate_weekly_brief()
