from app.services.tmdb import get_watch_providers
from app.services.watchmode import get_watchmode_availability
from app.services.watchmode import _mock_availability

SOURCE_PRIORITY = {"Watchmode": 0, "TMDb": 1}
TYPE_PRIORITY = {"sub": 0, "free": 1, "rent": 2, "buy": 3}


def _normalize_service_name(service: str) -> str:
    return (
        service.lower()
        .replace("+", "plus")
        .replace("&", "and")
        .replace(".", "")
        .replace(" ", "")
    )


def _canonical_service(service: str) -> tuple[str, str]:
    normalized = _normalize_service_name(service)
    simplified = (
        normalized
        .replace("withads", "")
        .replace("amazonchannel", "")
        .replace("viaamazonprime", "")
    )

    if "primevideo" in simplified or simplified in {"amazon", "amazonvideo"}:
        return "amazon", "Amazon"
    if "appletv" in simplified or "itunes" in simplified:
        return "appletv", "Apple TV"
    if "googleplay" in simplified:
        return "googleplay", "Google Play"
    if "fandangoathome" in simplified or simplified == "vudu":
        return "fandangoathome", "Fandango at Home"
    if simplified in {"max", "hbomax"}:
        return "max", "Max"
    if simplified.startswith("crave"):
        return "crave", "Crave"
    if simplified in {"microsoftstore", "windowsstore"}:
        return "microsoftstore", "Microsoft Store"

    return simplified, service


def _ordered_types(types: list[str]) -> list[str]:
    return sorted(set(types), key=lambda item: TYPE_PRIORITY.get(item, 99))


def _merge_streaming_sources(results: list[dict]) -> list[dict]:
    merged: dict[tuple[str, str], dict] = {}

    for item in results:
        service = item.get("service")
        item_type = item.get("type") or "unknown"
        region = item.get("region") or "US"
        if not service:
            continue

        service_key, display_service = _canonical_service(service)
        key = (service_key, region)
        existing = merged.get(key)
        if not existing:
            merged[key] = {
                **item,
                "service": display_service,
                "region": region,
                "type": item_type,
                "types": [item_type],
                "sources": [item.get("source", "Unknown")],
            }
            continue

        source = item.get("source", "Unknown")
        if source not in existing["sources"]:
            existing["sources"].append(source)
        if item_type not in existing["types"]:
            existing["types"] = _ordered_types([*existing["types"], item_type])
            existing["type"] = ", ".join(existing["types"])

        if not existing.get("webUrl") and item.get("webUrl"):
            existing["webUrl"] = item["webUrl"]
        if SOURCE_PRIORITY.get(source, 99) < SOURCE_PRIORITY.get(existing.get("source"), 99):
            existing["source"] = source

    return sorted(
        merged.values(),
        key=lambda item: (
            TYPE_PRIORITY.get(item["types"][0], 9),
            item["service"],
        ),
    )


async def get_combined_streaming_availability(movie_id: int, region: str = "US") -> list[dict]:
    watchmode_results = await get_watchmode_availability(movie_id, region=region)
    provider_region = region
    if watchmode_results and not any(item.get("region") == region for item in watchmode_results):
        provider_region = watchmode_results[0].get("region") or region

    tmdb_results = await get_watch_providers(movie_id, region=provider_region)
    merged_results = _merge_streaming_sources([*watchmode_results, *tmdb_results])

    if merged_results:
        return merged_results

    return [
        {**item, "source": "Mock", "sources": ["Mock"]}
        for item in _mock_availability(movie_id)
    ]
