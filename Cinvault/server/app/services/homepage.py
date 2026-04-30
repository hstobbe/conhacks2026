import asyncio
from datetime import date

from app.services import mock_data
from app.services.anime import current_season_anime, top_anime
from app.services.tmdb import movie_list, trending_movies, upcoming_movies
from app.services.tv import popular_tv, trending_tv


async def _safe(coro, fallback):
    try:
        return await coro
    except Exception:
        return fallback


def _disc_eligible_movie(item: dict) -> bool:
    movie_id = item.get("tmdbId")
    if movie_id is None:
        return False
    known_movie = mock_data.find_movie(int(movie_id))
    if known_movie is None:
        return False
    return bool(known_movie.get("blurayAvailable"))


def _filter_disc_movies(items: list[dict]) -> list[dict]:
    return [item for item in items if _disc_eligible_movie(item)]


def _number(value) -> float:
    if value is None:
        return 0.0
    return float(value)


def _date_ordinal(value: str | None) -> int:
    if not value:
        return date.min.toordinal()
    try:
        return date.fromisoformat(value).toordinal()
    except ValueError:
        return date.min.toordinal()


def _upcoming_date_ordinal(value: str | None) -> int:
    if not value:
        return date.max.toordinal()
    try:
        return date.fromisoformat(value).toordinal()
    except ValueError:
        return date.max.toordinal()


def _title_key(item: dict) -> str:
    return (item.get("title") or item.get("originalTitle") or "").lower()


def _sort_trending_movies(items: list[dict]) -> list[dict]:
    return sorted(
        items,
        key=lambda item: (
            -_number(item.get("popularity")),
            -_number(item.get("rating")),
            -_date_ordinal(item.get("releaseDate")),
            _title_key(item),
        ),
    )


def _sort_top_rated_movies(items: list[dict]) -> list[dict]:
    return sorted(
        items,
        key=lambda item: (
            -_number(item.get("rating")),
            -_number(item.get("popularity")),
            -_date_ordinal(item.get("releaseDate")),
            _title_key(item),
        ),
    )


def _sort_now_playing_movies(items: list[dict]) -> list[dict]:
    return sorted(
        items,
        key=lambda item: (
            -_date_ordinal(item.get("releaseDate")),
            -_number(item.get("popularity")),
            -_number(item.get("rating")),
            _title_key(item),
        ),
    )


def _sort_upcoming_movies(items: list[dict]) -> list[dict]:
    return sorted(
        items,
        key=lambda item: (
            _upcoming_date_ordinal(item.get("releaseDate")),
            -_number(item.get("popularity")),
            -_number(item.get("rating")),
            _title_key(item),
        ),
    )


def _sort_tv_trending(items: list[dict]) -> list[dict]:
    return sorted(
        items,
        key=lambda item: (
            -_number(item.get("popularity")),
            -_number(item.get("rating")),
            -_date_ordinal(item.get("firstAirDate")),
            _title_key(item),
        ),
    )


def _sort_tv_popular(items: list[dict]) -> list[dict]:
    return sorted(
        items,
        key=lambda item: (
            -_number(item.get("rating")),
            -_number(item.get("popularity")),
            -_date_ordinal(item.get("firstAirDate")),
            _title_key(item),
        ),
    )


def _movie_id(item: dict) -> int | None:
    movie_id = item.get("tmdbId")
    return int(movie_id) if movie_id is not None else None


def _unique_movie_list(*groups: list[dict]) -> list[dict]:
    unique_items: list[dict] = []
    seen_ids: set[int] = set()
    for group in groups:
        for item in group:
            movie_id = _movie_id(item)
            if movie_id is None or movie_id in seen_ids:
                continue
            seen_ids.add(movie_id)
            unique_items.append(item)
    return unique_items


def _take_unique_movies(items: list[dict], *, limit: int, excluded_ids: set[int]) -> list[dict]:
    selected: list[dict] = []
    for item in items:
        movie_id = _movie_id(item)
        if movie_id is None or movie_id in excluded_ids:
            continue
        excluded_ids.add(movie_id)
        selected.append(item)
        if len(selected) >= limit:
            break
    return selected


async def build_rich_homepage() -> dict:
    mock_sections = mock_data.build_homepage_sections()
    (
        trending,
        popular,
        top_rated,
        now_playing,
        upcoming,
        tv_trending,
        tv_popular,
        anime_top,
        anime_season,
    ) = await asyncio.gather(
        _safe(trending_movies("week"), mock_sections["trendingNow"]),
        _safe(movie_list("popular"), mock_sections["popularMovies"]),
        _safe(movie_list("top_rated"), mock_sections["topRatedMovies"]),
        _safe(movie_list("now_playing"), mock_sections["nowPlaying"]),
        _safe(upcoming_movies(), mock_sections["upcomingMovies"]),
        _safe(trending_tv("week"), mock_sections["tvTrending"]),
        _safe(popular_tv(), mock_sections["tvPopular"]),
        _safe(top_anime(limit=20), []),
        _safe(current_season_anime(limit=20), []),
    )
    trending = _filter_disc_movies(trending)
    popular = _filter_disc_movies(popular)
    top_rated = _filter_disc_movies(top_rated)
    now_playing = _filter_disc_movies(now_playing)
    upcoming = _filter_disc_movies(upcoming)
    trending = _sort_trending_movies(trending)
    popular = _sort_trending_movies(popular)
    top_rated = _sort_top_rated_movies(top_rated)
    now_playing = _sort_now_playing_movies(now_playing)
    upcoming = _sort_upcoming_movies(upcoming)
    tv_trending = _sort_tv_trending(tv_trending)
    tv_popular = _sort_tv_popular(tv_popular)
    catalog_movies = _filter_disc_movies(mock_data.MOVIES)
    used_movie_ids: set[int] = set()
    trending = _take_unique_movies(
        _unique_movie_list(trending, _sort_trending_movies(catalog_movies)),
        limit=8,
        excluded_ids=used_movie_ids,
    )
    popular = _take_unique_movies(
        _unique_movie_list(popular, _sort_trending_movies(catalog_movies)),
        limit=8,
        excluded_ids=used_movie_ids,
    )
    top_rated = _take_unique_movies(
        _unique_movie_list(top_rated, _sort_top_rated_movies(catalog_movies)),
        limit=8,
        excluded_ids=used_movie_ids,
    )
    now_playing = _take_unique_movies(now_playing, limit=8, excluded_ids=used_movie_ids)
    upcoming = _take_unique_movies(upcoming, limit=8, excluded_ids=used_movie_ids)

    return {
        "movieRows": [
            {
                "key": "trendingMovies",
                "title": "Trending Movies",
                "subtitle": "What people are watching this week",
                "items": trending[:20],
                "mediaType": "movie",
            },
            {
                "key": "popularMovies",
                "title": "Popular Movies",
                "subtitle": "A wider scrollable wall of current favorites",
                "items": popular[:20],
                "mediaType": "movie",
            },
            {
                "key": "topRatedMovies",
                "title": "Top Rated Movies",
                "subtitle": "Highly rated catalog picks",
                "items": top_rated[:20],
                "mediaType": "movie",
            },
            {
                "key": "nowPlaying",
                "title": "Now Playing",
                "subtitle": "Recent theatrical releases",
                "items": now_playing[:20],
                "mediaType": "movie",
            },
            {
                "key": "upcomingMovies",
                "title": "Upcoming Movies",
                "subtitle": "Coming soon",
                "items": upcoming[:20],
                "mediaType": "movie",
            },
        ],
        "tvRows": [
            {
                "key": "trendingTv",
                "title": "Trending TV Shows",
                "subtitle": "Series moving this week",
                "items": tv_trending[:20],
                "mediaType": "tv",
            },
            {
                "key": "popularTv",
                "title": "Popular TV Shows",
                "subtitle": "Binge-worthy series",
                "items": tv_popular[:20],
                "mediaType": "tv",
            },
        ],
        "animeRows": [
            {
                "key": "topAnime",
                "title": "Top Anime",
                "subtitle": "Highest-rated anime from Jikan",
                "items": anime_top[:20],
                "mediaType": "anime",
            },
            {
                "key": "seasonAnime",
                "title": "Current Season Anime",
                "subtitle": "Airing now",
                "items": anime_season[:20],
                "mediaType": "anime",
            },
        ],
        "legacy": mock_sections,
    }
