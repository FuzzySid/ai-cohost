"""Provider adapter for tiered text generation."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass
class LLMResult:
    text: str
    tokens_in: int
    tokens_out: int
    model: str


TIER_MODELS = {
    "cheap": os.getenv("LLM_MODEL_CHEAP", "claude-haiku-4-5-20251001"),
    "mid": os.getenv("LLM_MODEL_MID", "claude-sonnet-5"),
    "premium": os.getenv("LLM_MODEL_PREMIUM", "claude-opus-5"),
}


def call_model(tier: str, system_prompt: str, user_prompt: str) -> LLMResult:
    """Call the configured LLM provider and normalize its response and usage."""
    if tier not in TIER_MODELS:
        raise ValueError(f"Unknown model tier: {tier}")

    provider = os.getenv("LLM_PROVIDER", "anthropic").lower()
    model = TIER_MODELS[tier]
    if provider == "anthropic":
        if not os.getenv("ANTHROPIC_API_KEY"):
            raise RuntimeError("LLM credentials are not configured. Set ANTHROPIC_API_KEY in the backend environment.")
        from anthropic import Anthropic

        client = Anthropic()
        response = client.messages.create(
            model=model,
            max_tokens=400,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        text_blocks = [block.text for block in response.content if getattr(block, "type", None) == "text"]
        return LLMResult(
            text="\n".join(text_blocks),
            tokens_in=response.usage.input_tokens,
            tokens_out=response.usage.output_tokens,
            model=model,
        )

    raise NotImplementedError(
        f"Provider '{provider}' is not wired yet; add a provider adapter returning LLMResult."
    )
