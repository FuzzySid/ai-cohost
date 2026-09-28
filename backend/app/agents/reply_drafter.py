"""Grounded guest-reply drafting with a pre-model human-review safeguard."""

import json
import logging

from app import cost_meter
from app.llm_client import call_model

logger = logging.getLogger(__name__)

NEEDS_HUMAN_KEYWORDS = [
    # English
    "refund", "reimburse", "compensation", "cancel", "cancellation",
    "lawsuit", "legal", "injur", "unsafe", "emergency", "police",
    "discriminat", "assault", "theft", "stolen",
    # Spanish
    "reembolso", "indemnización", "indemnizacion", "cancelación", "cancelacion",
    "demanda", "lesión", "lesion", "inseguro", "emergencia", "policía", "policia",
    "discriminación", "discriminacion", "agresión", "agresion", "robo",
    # French
    "remboursement", "indemnisation", "annulation", "procès", "proces", "juridique",
    "bless", "dangereux", "urgence", "police", "discrimination", "agression", "volé", "vole",
    # German
    "rückerstattung", "rueckerstattung", "entschädigung", "entschaedigung", "stornierung",
    "klage", "rechtlich", "verletz", "unsicher", "notfall", "polizei", "diskriminierung",
    "übergriff", "uebergriff", "diebstahl", "gestohlen",
    # Italian
    "rimborso", "risarcimento", "cancellazione", "causa legale", "lesion", "insicuro",
    "emergenza", "polizia", "discriminazione", "aggressione", "furto", "rubato",
]


def draft_reply(thread: dict, listing: dict) -> dict:
    last_message = next(
        (message for message in reversed(thread["messages"]) if message["sender"] == "guest"),
        thread["messages"][-1],
    )
    message_text = last_message["text"]
    normalized_text = message_text.casefold()
    matched_keyword = next((keyword for keyword in NEEDS_HUMAN_KEYWORDS if keyword in normalized_text), None)
    if matched_keyword:
        logger.warning("Sensitive topic matched for thread %s; skipping model call", thread["thread_id"])
        return {
            "draft_reply": None,
            "detected_language": last_message.get("language", "unknown"),
            "confidence": "needs_human",
            "reason_if_needs_human": "Message mentions a sensitive topic (refund, safety, or legal); a host must reply directly.",
        }

    system_prompt = f"""You are drafting a reply on behalf of a vacation rental host for the listing {json.dumps(listing, ensure_ascii=False)}.
Reply in the same language the guest used, detected from their message text. Do not switch languages based on any earlier host messages.
Only state facts present in this listing data. If the guest asks something this data does not cover, say the host will confirm shortly rather than guessing.
Be warm, concise, and answer the guest's latest message. Do not invent a guest name, host name, booking detail, or amenity.
Respond ONLY with JSON: {{"draft_reply": "...", "detected_language": "xx"}}"""

    thread_text = "\n".join(
        f"{message['sender']}: {message['text']}"
        for message in thread["messages"]
    )
    result = call_model(tier="mid", system_prompt=system_prompt, user_prompt=thread_text)
    cost_meter.log_call(result.model, result.tokens_in, result.tokens_out, call_type="reply_draft")

    response_text = result.text.strip()
    if response_text.startswith("```"):
        response_text = response_text.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        parsed = json.loads(response_text)
    except json.JSONDecodeError:
        logger.exception("Reply model returned invalid JSON for thread %s", thread["thread_id"])
        raise ValueError("Reply model returned an invalid structured response") from None

    draft = parsed.get("draft_reply")
    language = parsed.get("detected_language")
    if not isinstance(draft, str) or not draft.strip() or not isinstance(language, str) or not language.strip():
        raise ValueError("Reply model response is missing the draft or detected language")
    return {
        "draft_reply": draft.strip(),
        "detected_language": language.strip().lower(),
        "confidence": "high",
        "reason_if_needs_human": None,
    }
