import httpx

from app.services import mock_data
from app.services.tmdb import TMDB_BASE_URL, TMDB_IMAGE_BASE, _auth_options

TMDB_PROVIDER_TYPE_MAP = {
    "flatrate": "sub",
    "free": "free",
    "ads": "free",
    "rent": "rent",
    "buy": "buy",
}


def _image_url(path: str | None) -> str | None:
    return f"{TMDB_IMAGE_BASE}{path}" if path else None


def _map_tv_summary(show: dict) -> dict:
    return {
        "tmdbId": show.get("id"),
        "title": show.get("name") or show.get("original_name"),
        "originalTitle": show.get("original_name"),
        "poster": _image_url(show.get("poster_path")),
        "backdrop": _image_url(show.get("backdrop_path")),
        "genreIds": show.get("genre_ids", []),
        "firstAirDate": show.get("first_air_date"),
        "rating": show.get("vote_average", 0),
        "popularity": show.get("popularity", 0),
        "overview": show.get("overview"),
        "mediaType": "tv",
    }


def _map_provider_group(region_payload: dict, region: str) -> list[dict]:
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


async def search_tv(query: str, page: int = 1) -> list[dict]:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return mock_data.search_tv_shows(query)

    params = {
        "query": query,
        "include_adult": "false",
        "language": "en-US",
        "page": page,
        **auth_params,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{TMDB_BASE_URL}/search/tv", params=params, headers=headers)
            response.raise_for_status()
            return [_map_tv_summary(show) for show in response.json().get("results", [])]
    except httpx.HTTPError:
        return mock_data.search_tv_shows(query)


async def popular_tv(page: int = 1) -> list[dict]:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return sorted(mock_data.TV_SHOWS, key=lambda item: item["rating"], reverse=True)

    params = {"language": "en-US", "page": page, **auth_params}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{TMDB_BASE_URL}/tv/popular", params=params, headers=headers)
            response.raise_for_status()
            return [_map_tv_summary(show) for show in response.json().get("results", [])]
    except httpx.HTTPError:
        return sorted(mock_data.TV_SHOWS, key=lambda item: item["rating"], reverse=True)


async def trending_tv(time_window: str = "day") -> list[dict]:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return sorted(mock_data.TV_SHOWS, key=lambda item: item["popularity"], reverse=True)

    params = {"language": "en-US", **auth_params}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{TMDB_BASE_URL}/trending/tv/{time_window}",
                params=params,
                headers=headers,
            )
            response.raise_for_status()
            return [_map_tv_summary(show) for show in response.json().get("results", [])]
    except httpx.HTTPError:
        return sorted(mock_data.TV_SHOWS, key=lambda item: item["popularity"], reverse=True)


async def get_tv_watch_providers(series_id: int, region: str = "US") -> list[dict]:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return []

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/tv/{series_id}/watch/providers",
            params=auth_params,
            headers=headers,
        )
        response.raise_for_status()
        region_payload = response.json().get("results", {}).get(region, {})
        return _map_provider_group(region_payload, region)


async def get_tv_details(series_id: int, region: str = "US") -> dict | None:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return mock_data.find_tv_show(series_id)

    params = {"append_to_response": "videos,content_ratings", "language": "en-US", **auth_params}
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"{TMDB_BASE_URL}/tv/{series_id}", params=params, headers=headers)
        response.raise_for_status()
        payload = response.json()

    show = _map_tv_summary(payload)
    show.update(
        {
            "genres": [genre["name"] for genre in payload.get("genres", [])],
            "createdBy": [
                {"id": person.get("id"), "name": person.get("name")}
                for person in payload.get("created_by", [])
            ],
            "networks": [
                {"id": network.get("id"), "name": network.get("name"), "logo": _image_url(network.get("logo_path"))}
                for network in payload.get("networks", [])
            ],
            "status": payload.get("status"),
            "type": payload.get("type"),
            "numberOfSeasons": payload.get("number_of_seasons"),
            "numberOfEpisodes": payload.get("number_of_episodes"),
            "episodeRunTime": payload.get("episode_run_time", []),
            "lastAirDate": payload.get("last_air_date"),
            "nextEpisodeToAir": payload.get("next_episode_to_air"),
            "seasons": [
                {
                    "id": season.get("id"),
                    "seasonNumber": season.get("season_number"),
                    "name": season.get("name"),
                    "episodeCount": season.get("episode_count"),
                    "airDate": season.get("air_date"),
                    "poster": _image_url(season.get("poster_path")),
                }
                for season in payload.get("seasons", [])
            ],
            "trailers": [
                video for video in payload.get("videos", {}).get("results", [])
                if video.get("site") == "YouTube" and video.get("type") in {"Trailer", "Teaser"}
            ][:3],
            "streamingAvailability": await get_tv_watch_providers(series_id, region=region),
        }
    )
    return show


async def get_tv_season(series_id: int, season_number: int) -> dict:
    headers, auth_params = _auth_options()
    if not headers and not auth_params:
        return {}

    params = {"language": "en-US", **auth_params}
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/tv/{series_id}/season/{season_number}",
            params=params,
            headers=headers,
        )
        response.raise_for_status()
        payload = response.json()

    payload["poster"] = _image_url(payload.get("poster_path"))
    payload["episodes"] = [
        {
            "id": episode.get("id"),
            "episodeNumber": episode.get("episode_number"),
            "seasonNumber": episode.get("season_number"),
            "title": episode.get("name"),
            "overview": episode.get("overview"),
            "airDate": episode.get("air_date"),
            "rating": episode.get("vote_average"),
            "still": _image_url(episode.get("still_path")),
        }
        for episode in payload.get("episodes", [])
    ]
    return payload
