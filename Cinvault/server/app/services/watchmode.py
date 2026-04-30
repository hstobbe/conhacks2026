import httpx

from app.config import get_settings
from app.services.mock_data import find_movie

WATCHMODE_BASE_URL = "https://api.watchmode.com/v1"


def _mock_availability(movie_id: int) -> list[dict]:
    movie = find_movie(movie_id)
    services = movie["streaming"] if movie else ["Prime Video", "Apple TV"]
    return [
        {
            "service": service,
            "type": "sub" if service not in {"Apple TV"} else "rent",
            "region": "US",
            "webUrl": "https://www.justwatch.com/us",
        }
        for service in services
    ]


async def get_watchmode_availability(movie_id: int, region: str = "US") -> list[dict]:
    api_key = get_settings().watchmode_api_key
    if not api_key:
        return []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            search_response = await client.get(
                f"{WATCHMODE_BASE_URL}/search/",
                params={
                    "apiKey": api_key,
                    "search_field": "tmdb_movie_id",
                    "search_value": movie_id,
                    "types": "movie",
                },
            )
            search_response.raise_for_status()
            results = search_response.json().get("title_results", [])
            if not results:
                return _mock_availability(movie_id)

            watchmode_id = results[0]["id"]
            source_params = {"apiKey": api_key}
            if region:
                source_params["regions"] = region
            sources_response = await client.get(
                f"{WATCHMODE_BASE_URL}/title/{watchmode_id}/sources/",
                params=source_params,
            )
            if sources_response.status_code == 400 and region:
                sources_response = await client.get(
                    f"{WATCHMODE_BASE_URL}/title/{watchmode_id}/sources/",
                    params={"apiKey": api_key},
                )
            sources_response.raise_for_status()
            return [
                {
                    "service": source.get("name"),
                    "type": source.get("type"),
                    "region": source.get("region"),
                    "webUrl": source.get("web_url"),
                    "source": "Watchmode",
                }
                for source in sources_response.json()
                if source.get("name")
            ]
    except httpx.HTTPError:
        return []


async def get_streaming_availability(movie_id: int) -> list[dict]:
    watchmode_results = await get_watchmode_availability(movie_id)
    return watchmode_results or _mock_availability(movie_id)
