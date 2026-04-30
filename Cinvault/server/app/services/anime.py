import httpx

JIKAN_BASE_URL = "https://api.jikan.moe/v4"


def _image_url(item: dict) -> str | None:
    return (
        item.get("images", {})
        .get("jpg", {})
        .get("large_image_url")
        or item.get("images", {})
        .get("jpg", {})
        .get("image_url")
    )


def _trailer_url(item: dict) -> str | None:
    return item.get("trailer", {}).get("url") or item.get("trailer", {}).get("embed_url")


def _map_anime_summary(item: dict) -> dict:
    return {
        "malId": item.get("mal_id"),
        "title": item.get("title_english") or item.get("title"),
        "originalTitle": item.get("title_japanese"),
        "url": item.get("url"),
        "poster": _image_url(item),
        "trailer": _trailer_url(item),
        "type": item.get("type"),
        "source": item.get("source"),
        "episodes": item.get("episodes"),
        "status": item.get("status"),
        "airing": item.get("airing"),
        "aired": item.get("aired", {}).get("string"),
        "season": item.get("season"),
        "year": item.get("year"),
        "rating": item.get("rating"),
        "score": item.get("score"),
        "rank": item.get("rank"),
        "popularity": item.get("popularity"),
        "members": item.get("members"),
        "genres": [genre.get("name") for genre in item.get("genres", [])],
        "studios": [studio.get("name") for studio in item.get("studios", [])],
        "synopsis": item.get("synopsis"),
        "mediaType": "anime",
    }


async def search_anime(
    query: str,
    page: int = 1,
    limit: int = 20,
    anime_type: str | None = None,
    min_score: float | None = None,
) -> list[dict]:
    params: dict[str, str | int | float] = {
        "q": query,
        "page": page,
        "limit": limit,
        "sfw": "true",
        "order_by": "score",
        "sort": "desc",
    }
    if anime_type:
        params["type"] = anime_type
    if min_score is not None:
        params["min_score"] = min_score

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{JIKAN_BASE_URL}/anime", params=params)
        response.raise_for_status()
        return [_map_anime_summary(item) for item in response.json().get("data", [])]


async def top_anime(page: int = 1, limit: int = 20, anime_type: str | None = None) -> list[dict]:
    params: dict[str, str | int] = {"page": page, "limit": limit, "sfw": "true"}
    if anime_type:
        params["type"] = anime_type

    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{JIKAN_BASE_URL}/top/anime", params=params)
        response.raise_for_status()
        return [_map_anime_summary(item) for item in response.json().get("data", [])]


async def current_season_anime(page: int = 1, limit: int = 20) -> list[dict]:
    params = {"page": page, "limit": limit, "sfw": "true"}
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{JIKAN_BASE_URL}/seasons/now", params=params)
        response.raise_for_status()
        return [_map_anime_summary(item) for item in response.json().get("data", [])]


async def get_anime_details(anime_id: int) -> dict:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{JIKAN_BASE_URL}/anime/{anime_id}/full")
        response.raise_for_status()
        item = response.json().get("data", {})

    details = _map_anime_summary(item)
    details.update(
        {
            "background": item.get("background"),
            "duration": item.get("duration"),
            "broadcast": item.get("broadcast", {}),
            "themes": {
                "openings": item.get("theme", {}).get("openings", []),
                "endings": item.get("theme", {}).get("endings", []),
            },
            "producers": [producer.get("name") for producer in item.get("producers", [])],
            "licensors": [licensor.get("name") for licensor in item.get("licensors", [])],
            "relations": item.get("relations", []),
            "external": item.get("external", []),
            "streaming": item.get("streaming", []),
        }
    )
    return details


async def get_anime_episodes(anime_id: int, page: int = 1) -> list[dict]:
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(f"{JIKAN_BASE_URL}/anime/{anime_id}/episodes", params={"page": page})
        response.raise_for_status()
        return [
            {
                "malId": episode.get("mal_id"),
                "title": episode.get("title"),
                "titleJapanese": episode.get("title_japanese"),
                "titleRomanji": episode.get("title_romanji"),
                "aired": episode.get("aired"),
                "score": episode.get("score"),
                "filler": episode.get("filler"),
                "recap": episode.get("recap"),
                "url": episode.get("url"),
            }
            for episode in response.json().get("data", [])
        ]
