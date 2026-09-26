from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["replies"])


class DraftRequest(BaseModel):
    message: str = "Bonjour Elena, est-ce que le check-in anticipé vers 13h est possible ?"
    listing_id: str = "lst_001"


@router.post("/replies/draft")
def draft_reply(_request: DraftRequest):
    return {
        "draft_reply": "Bonjour Marion ! Oui, tout à fait. L'équipe de ménage termine à 12h30, l'appartement sera donc parfaitement prêt pour vous à 13h00. Votre code de serrure connectée s'activera automatiquement dès 13h. Bon voyage en train ! — Elena",
        "detected_language": "fr",
        "confidence": "high",
        "reason_if_needs_human": None,
    }
