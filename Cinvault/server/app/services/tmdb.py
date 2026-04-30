import json
import re
from datetime import date, datetime, timedelta

import httpx
from bs4 import BeautifulSoup

from app.config import get_settings
from app.services import mock_data

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_PUBLIC_BASE_URL = "https://www.themoviedb.org"
TMDB_DIGITAL_RELEASE_TYPE = 4
TMDB_PHYSICAL_RELEASE_TYPE = 5
TMDB_PROVIDER_TYPE_MAP = {
    "flatrate": "sub",
    "free": "free",
    "ads": "free",
    "rent": "rent",
    "buy": "buy",
}
TMDB_PUBLIC_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def _auth_options() -> tuple[dict[str, str], dict[str, str]]:
    api_key = get_settings().tmdb_api_key
    if not api_key:
        return {}, {}
    if api_key.startswith("eyJ"):
        return {"Authorization": f"Bearer {api_key}"}, {}
    return {}, {"api_key": api_key}


def _map_movie(movie: dict) -> dict:
    poster_path = movie.get("poster_path")
    return {
        "tmdbId": movie.get("id"),
        "title": movie.get("title") or movie.get("name"),
        "poster": f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else None,
        "genres": movie.get("genres", []),
        "releaseDate": movie.get("release_date"),
        "rating": movie.get("vote_average", 0),
        "popularity": movie.get("popularity", 0),
        "overview": movie.get("overview"),
    }


def _clean_json_ld(value: str) -> str:
    return re.sub(r"/\*\s*<!\[CDATA\[\s*\*/|/\*\s*\]\]>\s*\*/", "", value).strip()


def _parse_tmdb_json_ld(soup: BeautifulSoup, schema_type: str) -> dict | None:
    for script in soup.select('script[type="application/ld+json"]'):
        raw = _clean_json_ld(script.get_text(" ", strip=True))
        if not raw:
            continue
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            continue
        if payload.get("@type") == schema_type:
            return payload
    return None


def _extract_public_images(soup: BeautifulSoup) -> tuple[str | None, str | None]:
    images = [meta.get("content") for meta in soup.select('meta[property="og:image"]') if meta.get("content")]
    poster = images[0] if len(images) > 0 else None
    backdrop = images[1] if len(images) > 1 else poster
    return poster, backdrop


def _parse_tmdb_card_release_date(value: str) -> str | None:
    cleaned = re.sub(r"\s+", " ", value).strip()
    for fmt in ("%b %d, %Y", "%B %d, %Y"):
        try:
            return datetime.strptime(cleaned, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _extract_public_rating(html: str) -> float:
    match = re.search(r'data-percent="(\d+)"', html)
    if not match:
        return 0.0
    return round(int(match.group(1)) / 10, 1)


def _parse_iso_duration_minutes(value: str | None) -> int | None:
    if not value:
        return None
    match = re.fullmatch(r"PT(?:(\d+)H)?(?:(\d+)M)?", value)
    if not match:
        return None
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    return hours * 60 + minutes


async def _scrape_tmdb_upcoming_movies() -> list[dict]:
    async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=TMDB_PUBLIC_HEADERS) as client:
        response = await client.get(f"{TMDB_PUBLIC_BASE_URL}/movie/upcoming")
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    upcoming: list[dict] = []
    seen_ids: set[int] = set()
    today = date.today().isoformat()

    for card in soup.select("div.comp\\:poster-card"):
        link = card.select_one('a[href^="/movie/"]')
        title_node = card.select_one("h2 span")
        date_node = card.select_one("span.subheader")
        poster_node = card.select_one("img.poster")
        href = (link.get("href") if link else "") or ""
        movie_id_match = re.match(r"^/movie/(\d+)", href)
        if not movie_id_match or not title_node:
            continue

        movie_id = int(movie_id_match.group(1))
        if movie_id in seen_ids:
            continue
        seen_ids.add(movie_id)

        poster = poster_node.get("src") if poster_node else None
        release_date = _parse_tmdb_card_release_date(date_node.get_text(" ", strip=True) if date_node else "")
        if release_date and release_date < today:
            continue

        upcoming.append(
            {
                "tmdbId": movie_id,
                "title": title_node.get_text(" ", strip=True),
                "poster": poster,
                "backdrop": poster,
                "genres": [],
                "releaseDate": release_date,
                "rating": 0,
                "popularity": 0,
                "overview": None,
            }
        )

    return upcoming[:20]


async def _scrape_tmdb_movie_details(movie_id: int) -> dict | None:
    async with httpx.AsyncClient(timeout=15, follow_redirects=True, headers=TMDB_PUBLIC_HEADERS) as client:
        response = await client.get(f"{TMDB_PUBLIC_BASE_URL}/movie/{movie_id}")
        if response.status_code == 404:
            return None
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    schema = _parse_tmdb_json_ld(soup, "Movie")
    if not schema:
        return None

    poster, backdrop = _extract_public_images(soup)
    release_events = schema.get("releasedEvent") or []
    first_release = release_events[0].get("startDate") if release_events else None
    release_info = {
        "country": "US",
        "digitalReleaseDate": None,
        "physicalReleaseDate": None,
        "hasDigitalRelease": False,
        "hasPhysicalRelease": bool(first_release and first_release <= date.today().isoformat()),
    }
    return {
        "tmdbId": movie_id,
        "title": schema.get("name"),
        "poster": poster or schema.get("image"),
        "backdrop": backdrop,
        "genres": schema.get("genre", []),
        "releaseDate": first_release,
        "rating": _extract_public_rating(response.text),
        "popularity": 0,
        "overview": schema.get("description"),
        "runtime": _parse_iso_duration_minutes(schema.get("duration")),
        "releaseInfo": release_info,
        "blurayAvailable": release_info["hasPhysicalRelease"],
        "trailers": [],
    }


def _extract_us_release_info(release_dates: dict) -> dict:
    us_release_group = next(
        (
            group for group in release_dates.get("results", [])
            if group.get("iso_3166_1") == "US"
        ),
        {},
    )
    releases = us_release_group.get("release_dates", [])

    def earliest_release_date(release_type: int) -> str | None:
        matching_dates = sorted(
            release.get("release_date", "")
            for release in releases
            if release.get("type") == release_type and release.get("release_date")
        )
        if not matching_dates:
            return None
        return matching_dates[0].split("T")[0]

    digital_release_date = earliest_release_date(TMDB_DIGITAL_RELEASE_TYPE)
    physical_release_date = earliest_release_date(TMDB_PHYSICAL_RELEASE_TYPE)

    return {
        "country": "US",
        "digitalReleaseDate": digital_release_date,
        "physicalReleaseDate": physical_release_date,
        "hasDigitalRelease": digital_release_date is not None,
        "hasPhysicalRelease": physical_release_date is not None,
    }


async def search_movies(query: str) -> list[dict]:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return mock_data.search_movies(query)

    params = {"query": query, "include_adult": "false", "language": "en-US", **auth_params}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{TMDB_BASE_URL}/search/movie", params=params, headers=headers)
            response.raise_for_status()
            return [_map_movie(movie) for movie in response.json().get("results", [])[:20]]
    except httpx.HTTPError:
        return mock_data.search_movies(query)


async def movie_list(category: str, page: int = 1) -> list[dict]:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return mock_data.movie_category_fallback(category)

    params = {"language": "en-US", "page": page, "region": "US", **auth_params}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{TMDB_BASE_URL}/movie/{category}", params=params, headers=headers)
            response.raise_for_status()
            return [_map_movie(movie) for movie in response.json().get("results", [])]
    except httpx.HTTPError:
        return mock_data.movie_category_fallback(category)


async def trending_movies(time_window: str = "week") -> list[dict]:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return sorted(mock_data.MOVIES, key=lambda item: item["popularity"], reverse=True)

    params = {"language": "en-US", **auth_params}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{TMDB_BASE_URL}/trending/movie/{time_window}",
                params=params,
                headers=headers,
            )
            response.raise_for_status()
            return [_map_movie(movie) for movie in response.json().get("results", [])]
    except httpx.HTTPError:
        return sorted(mock_data.MOVIES, key=lambda item: item["popularity"], reverse=True)


async def get_movie_details(movie_id: int) -> dict | None:
    headers, auth_params = _auth_options()
    fallback = mock_data.find_movie(movie_id)
    if not headers and not auth_params:
        return fallback or await _scrape_tmdb_movie_details(movie_id)

    params = {"append_to_response": "videos,release_dates", "language": "en-US", **auth_params}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{TMDB_BASE_URL}/movie/{movie_id}", params=params, headers=headers)
            response.raise_for_status()
            payload = response.json()
            mapped = _map_movie(payload)
            mapped["genres"] = [genre["name"] for genre in payload.get("genres", [])]
            mapped["runtime"] = payload.get("runtime")
            mapped["tagline"] = payload.get("tagline")
            mapped["releaseInfo"] = _extract_us_release_info(payload.get("release_dates", {}))
            mapped["blurayAvailable"] = mapped["releaseInfo"]["hasPhysicalRelease"]
            mapped["trailers"] = [
                video for video in payload.get("videos", {}).get("results", [])
                if video.get("site") == "YouTube" and video.get("type") == "Trailer"
            ][:3]
            return mapped
    except httpx.HTTPError:
        return fallback or await _scrape_tmdb_movie_details(movie_id)


async def get_watch_providers(movie_id: int, region: str = "US") -> list[dict]:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{TMDB_BASE_URL}/movie/{movie_id}/watch/providers",
                params=auth_params,
                headers=headers,
            )
            response.raise_for_status()
            region_payload = response.json().get("results", {}).get(region, {})
            web_url = region_payload.get("link")

            providers = []
            for provider_group, normalized_type in TMDB_PROVIDER_TYPE_MAP.items():
                for provider in region_payload.get(provider_group, []) or []:
                    providers.append(
                        {
                            "service": provider.get("provider_name"),
                            "type": normalized_type,
                            "region": region,
                            "webUrl": web_url,
                            "source": "TMDb",
                            "logoPath": provider.get("logo_path"),
                        }
                    )
            return [provider for provider in providers if provider["service"]]
    except httpx.HTTPError:
        return []


async def upcoming_movies() -> list[dict]:
    headers, auth_params = _auth_options()
    fallback = mock_data.build_homepage_sections()["upcomingMovies"]
    if not headers and not auth_params:
        try:
            scraped = await _scrape_tmdb_upcoming_movies()
            return scraped or fallback
        except httpx.HTTPError:
            return fallback

    start_date = date.today() + timedelta(days=30)
    end_date = start_date + timedelta(days=150)
    params = {"language": "en-US", "region": "US", **auth_params}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{TMDB_BASE_URL}/discover/movie",
                params={
                    **params,
                    "include_adult": "false",
                    "include_video": "false",
                    "sort_by": "popularity.desc",
                    "primary_release_date.gte": start_date.isoformat(),
                    "primary_release_date.lte": end_date.isoformat(),
                    "with_release_type": "2|3",
                    "page": 1,
                },
                headers=headers,
            )
            response.raise_for_status()
            movies = [_map_movie(movie) for movie in response.json().get("results", [])]
            return [
                movie for movie in movies
                if movie.get("releaseDate") and movie["releaseDate"] >= start_date.isoformat()
            ][:20]
    except httpx.HTTPError:
        try:
            scraped = await _scrape_tmdb_upcoming_movies()
            return scraped or fallback
        except httpx.HTTPError:
            return fallback
