import asyncio
import re
from collections import Counter
from typing import Any

from app.database import get_database
from app.services.anime import current_season_anime, get_anime_details, search_anime, top_anime
from app.services.homepage import build_rich_homepage
from app.services.prices import get_current_deals
from app.services.streaming import get_combined_streaming_availability
from app.services.tmdb import get_movie_details, search_movies
from app.services.tv import get_tv_details, popular_tv, search_tv
from app.utils.object_id import serialize_docs


def _text(value: Any, fallback: str = "Unknown") -> str:
    if value is None or value == "":
        return fallback
    return str(value)


def _compact_overview(value: str | None, limit: int = 180) -> str:
    if not value:
        return ""
    cleaned = " ".join(value.split())
    return cleaned if len(cleaned) <= limit else f"{cleaned[:limit].rstrip()}..."


def _summarize_media_item(item: dict, media_type: str) -> str:
    title = item.get("title") or item.get("name") or item.get("originalTitle") or "Untitled"
    year = (
        (item.get("releaseDate") or item.get("firstAirDate") or "")[:4]
        or item.get("year")
        or "unknown year"
    )
    rating = item.get("rating") or item.get("score") or "unrated"
    genres = item.get("genres") or []
    if isinstance(genres, list) and genres and isinstance(genres[0], dict):
        genres = [genre.get("name") for genre in genres if genre.get("name")]
    genre_text = f"; genres: {', '.join(genres[:4])}" if genres else ""
    overview = item.get("overview") or item.get("synopsis")
    summary = f"- {title} ({year}) [{media_type}], rating/score: {rating}{genre_text}"
    compact_overview = _compact_overview(overview)
    if compact_overview:
        summary += f"; {compact_overview}"
    return summary


def _summarize_row(row: dict, limit: int = 8) -> str:
    items = row.get("items", [])[:limit]
    titles = [
        f"{item.get('title') or item.get('name') or item.get('originalTitle') or 'Untitled'}"
        for item in items
    ]
    return f"- {row.get('title', 'Recommendations')}: {', '.join(titles)}"


def _matching_deals(deals: list[dict], movie_id: int | None = None, title: str | None = None) -> list[dict]:
    if movie_id is not None:
        matches = [deal for deal in deals if deal.get("movieId") == movie_id]
        if matches:
            return matches

    if title:
        normalized_title = title.lower()
        return [
            deal for deal in deals
            if normalized_title in deal.get("title", "").lower()
            or deal.get("title", "").lower() in normalized_title
        ]

    return []


def _summarize_deal(deal: dict) -> str:
    return (
        f"- {deal.get('title', 'Unknown title')}: {deal.get('format', 'Blu-ray')} at "
        f"{deal.get('retailer', 'Unknown retailer')} for ${deal.get('price')}"
    )


def _clean_lookup_query(message: str) -> str:
    cleaned = message.lower()
    replacements = (
        "where should i watch",
        "where can i watch",
        "where to watch",
        "where should i stream",
        "where can i stream",
        "where do i stream",
        "what should i watch",
        "should i watch",
        "can i watch",
        "can i stream",
        "is streaming",
        "streaming availability for",
        "availability for",
        "streaming",
        "available",
        "availability",
        "watch all of",
        "watch",
        "stream",
        "all of",
        "episodes of",
        "season of",
        "movie",
        "tv show",
        "series",
        "anime",
        "please",
    )
    for phrase in replacements:
        cleaned = cleaned.replace(phrase, " ")
    cleaned = re.sub(r"[^a-z0-9:'&+*\-\s]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or message


def _summarize_provider(item: dict) -> str:
    return (
        f"{item.get('service', 'Unknown service')} "
        f"({item.get('type', 'unknown')}, {item.get('region', 'US')}, "
        f"sources: {', '.join(item.get('sources', [item.get('source', 'Unknown')]))})"
    )


def _summarize_anime_streaming(details: dict) -> str:
    links = details.get("streaming") or []
    if not links:
        return "no Jikan streaming links found"
    return ", ".join(
        f"{link.get('name', 'Unknown service')} ({link.get('url', 'no URL')})"
        for link in links[:8]
    )


async def _safe(coro, fallback):
    try:
        return await coro
    except Exception:
        return fallback


async def _user_context(current_user: dict | None) -> list[str]:
    if not current_user:
        return ["User profile: anonymous visitor. No personal library or alert data is available."]

    db = get_database()
    library, alerts = await asyncio.gather(
        db.library.find({"userId": current_user["id"]}).sort("updatedAt", -1).to_list(length=30),
        db.price_alerts.find({"userId": current_user["id"]}).sort("createdAt", -1).to_list(length=30),
    )
    library_items = serialize_docs(library)
    alert_items = serialize_docs(alerts)
    lines = [f"User profile: {current_user.get('name', 'CineVault user')} ({current_user.get('email', 'no email')})."]

    if library_items:
        statuses = Counter(item.get("status", "unknown") for item in library_items)
        favorite_genres = Counter(
            genre
            for item in library_items
            for genre in item.get("genres", [])
            if genre
        )
        lines.append(
            "Library summary: "
            f"{len(library_items)} saved items; statuses: "
            f"{', '.join(f'{status}={count}' for status, count in statuses.items())}."
        )
        if favorite_genres:
            lines.append(
                "Library genre signals: "
                + ", ".join(f"{genre} ({count})" for genre, count in favorite_genres.most_common(6))
            )
        lines.append("Recent library items:")
        lines.extend(
            f"- {item.get('title', 'Untitled')} ({_text(item.get('releaseDate', '')[:4] if item.get('releaseDate') else None)}), "
            f"status: {item.get('status', 'unknown')}, user rating: {_text(item.get('userRating'), 'not rated')}, "
            f"notes: {_text(item.get('notes'), 'none')}"
            for item in library_items[:12]
        )
    else:
        lines.append("Library summary: no saved items yet.")

    if alert_items:
        lines.append("Active and recent price alerts:")
        lines.extend(
            f"- {alert.get('title', 'Unknown title')}: target ${alert.get('targetPrice')} "
            f"for {alert.get('format', 'Blu-ray')} at {alert.get('retailer', 'Any retailer')}; "
            f"active={alert.get('isActive', True)}"
            for alert in alert_items[:12]
        )
    else:
        lines.append("Price alerts: none configured.")

    return lines


async def build_chat_context(message: str, current_user: dict | None = None) -> str:
    db = get_database()
    normalized_message = message.lower()
    lookup_query = _clean_lookup_query(message)
    is_availability_question = (
        "where" in normalized_message and "watch" in normalized_message
    ) or any(term in normalized_message for term in ("stream", "streaming", "available", "availability"))
    is_recommendation_question = any(
        term in normalized_message
        for term in ("recommend", "suggest", "what should i watch")
    ) or ("watch" in normalized_message and not is_availability_question)
    movie_matches, tv_matches, anime_matches, homepage, top_anime_rows, season_anime_rows, tv_rows, current_deals = await asyncio.gather(
        _safe(search_movies(lookup_query), []),
        _safe(search_tv(lookup_query), []),
        _safe(search_anime(lookup_query, limit=8), []),
        _safe(build_rich_homepage(), {}),
        _safe(top_anime(limit=8), []),
        _safe(current_season_anime(limit=8), []),
        _safe(popular_tv(), []),
        _safe(get_current_deals(db), []),
    )

    sections: list[str] = [
        "CineVault available data for this answer.",
        "Use this context as authoritative. If the context does not contain a fact, say that CineVault does not have it yet.",
        f"Original user question: {message}",
        f"Cleaned API lookup query: {lookup_query}",
    ]

    sections.extend(await _user_context(current_user))

    if is_recommendation_question:
        sections.append("Recommendation candidates that can be used directly in the answer:")
        if "anime" in normalized_message:
            anime_candidates = [*season_anime_rows[:6], *top_anime_rows[:4], *anime_matches[:4]]
            if anime_candidates:
                sections.append("Answer anime recommendation questions by suggesting these anime titles:")
                sections.extend(_summarize_media_item(item, "anime") for item in anime_candidates[:8])
            else:
                sections.append("- No anime recommendation candidates are currently available.")
        elif "tv" in normalized_message or "show" in normalized_message or "series" in normalized_message:
            tv_candidates = [*tv_matches[:4], *tv_rows[:6]]
            if tv_candidates:
                sections.append("Answer TV recommendation questions by suggesting these TV titles:")
                sections.extend(_summarize_media_item(item, "tv") for item in tv_candidates[:8])
            else:
                sections.append("- No TV recommendation candidates are currently available.")
        else:
            movie_rows = homepage.get("movieRows", []) if homepage else []
            movie_candidates = [*movie_matches[:4]]
            for row in movie_rows[:3]:
                movie_candidates.extend(row.get("items", [])[:3])
            if movie_candidates:
                sections.append("Answer movie recommendation questions by suggesting these movie titles:")
                sections.extend(_summarize_media_item(item, "movie") for item in movie_candidates[:8])
            else:
                sections.append("- No movie recommendation candidates are currently available.")

    sections.append("Relevant movie search results:")
    if movie_matches:
        sections.extend(_summarize_media_item(item, "movie") for item in movie_matches[:6])
    else:
        sections.append("- No movie matches found for this exact question.")

    sections.append("Relevant TV search results:")
    if tv_matches:
        sections.extend(_summarize_media_item(item, "tv") for item in tv_matches[:6])
    else:
        sections.append("- No TV matches found for this exact question.")

    sections.append("Relevant anime search results:")
    if anime_matches:
        sections.extend(_summarize_media_item(item, "anime") for item in anime_matches[:6])
    else:
        sections.append("- No anime matches found for this exact question.")

    if tv_matches:
        sections.append("Detailed TV context for the strongest matches:")
        for show in tv_matches[:2]:
            show_id = show.get("tmdbId")
            if show_id is None:
                continue
            details = await _safe(get_tv_details(int(show_id)), None)
            detail_source = details or show
            title = detail_source.get("title") or show.get("title") or "Unknown title"
            providers = detail_source.get("streamingAvailability") or []
            sections.append(
                f"- {title}: status={_text(detail_source.get('status'))}; "
                f"seasons={_text(detail_source.get('numberOfSeasons'))}; "
                f"episodes={_text(detail_source.get('numberOfEpisodes'))}; "
                f"genres={', '.join((detail_source.get('genres') or [])[:5]) or 'unknown'}"
            )
            if providers:
                sections.append(
                    "  TV streaming/availability: "
                    + ", ".join(_summarize_provider(item) for item in providers[:10])
                )
            else:
                sections.append("  TV streaming/availability: no TMDb providers found.")

    if anime_matches:
        sections.append("Detailed anime context for the strongest matches:")
        for anime in anime_matches[:2]:
            anime_id = anime.get("malId")
            if anime_id is None:
                continue
            details = await _safe(get_anime_details(int(anime_id)), None)
            detail_source = details or anime
            title = detail_source.get("title") or anime.get("title") or "Unknown title"
            sections.append(
                f"- {title}: type={_text(detail_source.get('type'))}; "
                f"episodes={_text(detail_source.get('episodes'))}; "
                f"status={_text(detail_source.get('status'))}; "
                f"genres={', '.join((detail_source.get('genres') or [])[:5]) or 'unknown'}; "
                f"streaming links={_summarize_anime_streaming(detail_source)}"
            )

    if movie_matches:
        sections.append("Detailed movie context for the strongest matches:")
        for movie in movie_matches[:2]:
            movie_id = movie.get("tmdbId")
            if movie_id is None:
                continue
            details, streaming = await asyncio.gather(
                _safe(get_movie_details(int(movie_id)), None),
                _safe(get_combined_streaming_availability(int(movie_id)), []),
            )
            title = movie.get("title") or (details or {}).get("title") or "Unknown title"
            detail_source = details or movie
            release_info = detail_source.get("releaseInfo") or {}
            sections.append(
                f"- {title}: runtime={_text(detail_source.get('runtime'))}; "
                f"genres={', '.join((detail_source.get('genres') or [])[:5]) or 'unknown'}; "
                f"physical release={_text(release_info.get('physicalReleaseDate'))}; "
                f"Blu-ray available={detail_source.get('blurayAvailable', bool(release_info.get('hasPhysicalRelease')))}"
            )
            if streaming:
                sections.append(
                    "  Streaming/availability: "
                    + ", ".join(
                        f"{item.get('service')} ({item.get('type')}, {item.get('region')}, sources: {', '.join(item.get('sources', [item.get('source', 'Unknown')]))})"
                        for item in streaming[:10]
                    )
                )
            else:
                sections.append("  Streaming/availability: no providers found.")
            deals = _matching_deals(current_deals, movie_id=int(movie_id), title=title)
            if deals:
                sections.append("  Blu-ray deals: " + "; ".join(_summarize_deal(deal)[2:] for deal in deals[:4]))
            else:
                sections.append("  Blu-ray deals: no current deal records in CineVault.")

    sections.append("Current Blu-ray deal catalog:")
    if current_deals:
        sections.extend(_summarize_deal(deal) for deal in current_deals[:20])
    else:
        sections.append("- No cached Blu-ray deals are currently available.")

    if homepage:
        sections.append("Homepage recommendation rows:")
        for row in [
            *homepage.get("movieRows", []),
            *homepage.get("tvRows", []),
            *homepage.get("animeRows", []),
        ]:
            sections.append(_summarize_row(row))

    if top_anime_rows:
        sections.append("Top anime backup recommendations:")
        sections.extend(_summarize_media_item(item, "anime") for item in top_anime_rows[:5])
    if season_anime_rows:
        sections.append("Current season anime backup recommendations:")
        sections.extend(_summarize_media_item(item, "anime") for item in season_anime_rows[:5])
    if tv_rows:
        sections.append("Popular TV backup recommendations:")
        sections.extend(_summarize_media_item(item, "tv") for item in tv_rows[:5])

    return "\n".join(sections)
