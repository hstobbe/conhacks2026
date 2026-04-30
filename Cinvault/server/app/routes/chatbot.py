import re
from typing import Any

from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import get_settings
from app.database import get_database
from app.models.schemas import ChatRequest, ChatResponse
from app.services.anime import current_season_anime, get_anime_details, search_anime, top_anime
from app.services.chat_context import build_chat_context
from app.services.gemini import ask_gemini
from app.services.mock_data import MOVIES, search_movies as mock_search_movies
from app.services.prices import get_current_deals
from app.services.streaming import get_combined_streaming_availability
from app.services.tmdb import search_movies as tmdb_search_movies
from app.services.tv import get_tv_details, popular_tv, search_tv
from app.utils.object_id import serialize_doc

router = APIRouter(prefix="/chatbot", tags=["chatbot"])
optional_bearer = HTTPBearer(auto_error=False)


async def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_bearer),
) -> dict[str, Any] | None:
    if not credentials:
        return None

    settings = get_settings()
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except JWTError:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    db = get_database()
    user = await db.users.find_one({"_id": user_id})
    return serialize_doc(user)


def _clean_lookup_query(message: str) -> str:
    cleaned = message.lower()
    for phrase in (
        "where can i stream",
        "where should i stream",
        "where do i stream",
        "where can i watch",
        "where should i watch",
        "where to watch",
        "can i stream",
        "can i watch",
        "is streaming",
        "streaming",
        "available",
        "availability",
        "watch all of",
        "watch",
        "all of",
        "where can i",
        "where should i",
        "where is",
        "find",
        "show me",
        "movie",
        "tv show",
        "anime",
    ):
        cleaned = cleaned.replace(phrase, " ")
    cleaned = re.sub(r"[^a-z0-9:'&+*\-\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or message


@router.post("", response_model=ChatResponse)
async def chatbot(
    payload: ChatRequest,
    current_user: dict[str, Any] | None = Depends(get_optional_user),
) -> ChatResponse:
    context = await build_chat_context(payload.message, current_user=current_user)
    gemini_reply = await ask_gemini(payload.message, context=context)
    if gemini_reply:
        return ChatResponse(
            reply=gemini_reply,
            suggestions=["Find streaming availability", "Show Blu-ray deals", "Recommend movies, TV, or anime"],
        )

    message = payload.message.lower()
    availability_question = (
        "where" in message and "watch" in message
    ) or any(term in message for term in ("stream", "streaming", "available", "availability"))

    if "deal" in message or "price" in message:
        db = get_database()
        deals = await get_current_deals(db)
        best_deal = sorted(deals, key=lambda item: item["price"])[0]
        return ChatResponse(
            reply=f"The best current deal is {best_deal['title']} on {best_deal['format']} at {best_deal['retailer']} for ${best_deal['price']}.",
            suggestions=["Show me 4K deals", "Track a price alert", "Open library"],
        )

    if availability_question:
        query = _clean_lookup_query(payload.message)

        try:
            tv_matches = await search_tv(query)
        except Exception:
            tv_matches = []
        if tv_matches:
            show = tv_matches[0]
            try:
                details = await get_tv_details(int(show["tmdbId"]))
            except Exception:
                details = show
            providers = details.get("streamingAvailability", [])
            if providers:
                services = ", ".join(
                    f"{item.get('service')} ({item.get('type')}, {item.get('region')})"
                    for item in providers[:8]
                )
                return ChatResponse(
                    reply=f"{details.get('title', show.get('title'))} is listed on {services}.",
                    suggestions=["Search another title", "Show TV recommendations", "Find Blu-ray deals"],
                )

        try:
            anime_matches = await search_anime(query, limit=5)
        except Exception:
            anime_matches = []
        if anime_matches:
            anime = anime_matches[0]
            try:
                details = await get_anime_details(int(anime["malId"]))
            except Exception:
                details = anime
            streaming_links = details.get("streaming", [])
            if streaming_links:
                services = ", ".join(
                    f"{item.get('name')} ({item.get('url')})"
                    for item in streaming_links[:6]
                    if item.get("name")
                )
                return ChatResponse(
                    reply=f"{details.get('title', anime.get('title'))} has streaming links from Jikan for {services}.",
                    suggestions=["Search another anime", "Show anime recommendations", "Find streaming availability"],
                )

        try:
            matches = await tmdb_search_movies(query)
        except Exception:
            matches = []
        mock_matches = mock_search_movies(query)
        movie = matches[0] if matches else (mock_matches[0] if mock_matches else MOVIES[0])
        movie_id = movie.get("tmdbId")
        availability = []
        if movie_id:
            try:
                availability = await get_combined_streaming_availability(int(movie_id))
            except Exception:
                availability = []
        if availability:
            services = ", ".join(
                f"{item.get('service')} ({item.get('type')}, {item.get('region')})"
                for item in availability[:8]
            )
            source_note = " Sources: " + ", ".join(
                sorted({source for item in availability for source in item.get("sources", [item.get("source", "Unknown")])})
            )
            return ChatResponse(
                reply=f"{movie['title']} is listed on {services}.{source_note}",
                suggestions=["Search another movie", "Show trending movies", "Find Blu-ray price"],
            )

        services = ", ".join(movie.get("streaming", [])) or "no known services"
        return ChatResponse(
            reply=f"{movie['title']} is currently listed on {services} in CineVault availability data.",
            suggestions=["Search another movie", "Show trending movies", "Find Blu-ray price"],
        )

    if "recommend" in message or "watch" in message:
        if "anime" in message:
            anime_results = []
            for lookup in (
                lambda: search_anime(payload.message, limit=5),
                lambda: current_season_anime(limit=5),
                lambda: top_anime(limit=5),
            ):
                try:
                    anime_results = await lookup()
                except Exception:
                    anime_results = []
                if anime_results:
                    break
            if not anime_results:
                return ChatResponse(
                    reply="I could not reach the anime catalog right now. Try searching again in a moment, or ask for movie or TV recommendations.",
                    suggestions=["Search anime", "Show movies", "Show TV"],
                )
            titles = ", ".join(item["title"] for item in anime_results[:3])
            return ChatResponse(
                reply=f"For anime, I would start with {titles}. Tell me a genre or mood and I can narrow it down.",
                suggestions=["Show current season anime", "Find action anime", "Search anime"],
            )

        if "tv" in message or "show" in message or "series" in message:
            tv_results = []
            for lookup in (lambda: search_tv(payload.message), popular_tv):
                try:
                    tv_results = await lookup()
                except Exception:
                    tv_results = []
                if tv_results:
                    break
            if not tv_results:
                return ChatResponse(
                    reply="I could not reach the TV catalog right now. Try searching again in a moment, or ask for movie or anime recommendations.",
                    suggestions=["Search TV", "Show movies", "Show anime"],
                )
            titles = ", ".join(item["title"] for item in tv_results[:3])
            return ChatResponse(
                reply=f"For TV, I would start with {titles}. Add shows to your library and recommendations will get more personal.",
                suggestions=["Show popular TV", "Find streaming availability", "Search another show"],
            )

        picks = sorted(MOVIES, key=lambda item: item["rating"], reverse=True)[:3]
        titles = ", ".join(movie["title"] for movie in picks)
        return ChatResponse(
            reply=f"Based on high ratings, I would start with {titles}. Add a few ratings to your library and recommendations will get more personal.",
            suggestions=["Add to library", "Show Sci-Fi picks", "Show trending now"],
        )

    return ChatResponse(
        reply="I can help with recommendations, streaming availability, Blu-ray deals, and price alerts.",
        suggestions=["Recommend a movie", "Find the best deal", "Where can I stream Dune?"],
    )
