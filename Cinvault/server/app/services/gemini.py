import httpx

from app.config import get_settings

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


def _extract_text(payload: dict) -> str | None:
    candidates = payload.get("candidates") or []
    for candidate in candidates:
        parts = candidate.get("content", {}).get("parts", [])
        text = "\n".join(part.get("text", "") for part in parts if part.get("text"))
        if text.strip():
            return text.strip()
    return None


async def ask_gemini(message: str, context: str | None = None) -> str | None:
    settings = get_settings()
    if not settings.gemini_api_key:
        return None

    system_prompt = (
        "You are VaultBot, the CineVault movie assistant. "
        "Help with movies, TV shows, anime, recommendations, streaming availability, "
        "Blu-ray availability, Blu-ray deals, price alerts, user library questions, "
        "and using the CineVault app. "
        "Use the provided CineVault context as your source of truth. "
        "If the context includes 'Recommendation candidates that can be used directly in the answer', "
        "choose useful titles from that block and recommend them. "
        "Do not invent exact prices, streaming services, user library entries, or alerts. "
        "If the context does not include a requested fact, say CineVault does not have it yet "
        "and suggest the closest useful next step. Keep answers concise and practical."
    )

    user_prompt = f"{context or 'No CineVault context was available.'}\n\nUser question: {message}"
    url = f"{GEMINI_BASE_URL}/models/{settings.gemini_model}:generateContent"

    body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": 0.35,
            "maxOutputTokens": 1200,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                url,
                headers={"x-goog-api-key": settings.gemini_api_key},
                json=body,
            )
            response.raise_for_status()
            return _extract_text(response.json())
    except httpx.HTTPError:
        return None
