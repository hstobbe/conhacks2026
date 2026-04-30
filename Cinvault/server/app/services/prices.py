from datetime import date, datetime, timedelta, timezone

import httpx
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services import mock_data
from app.services.gruv import search_gruv_prices
from app.services.tmdb import get_movie_details
from app.utils.object_id import serialize_doc, serialize_docs

CAD_EXCHANGE_RATE = 1.37


def catalog_movie_ids(
    *,
    category: str = "popular",
    genre: str | None = None,
    limit: int | None = 12,
    tracked_movie_ids: set[int] | None = None,
) -> list[int]:
    normalized_genre = genre.lower() if genre else None
    today = date.today()
    candidates = [
        movie
        for movie in mock_data.MOVIES
        if movie.get("blurayAvailable")
        and movie.get("releaseDate")
        and date.fromisoformat(movie["releaseDate"]) <= today
        and (
            normalized_genre is None
            or any(item.lower() == normalized_genre for item in movie.get("genres", []))
        )
        and (
            tracked_movie_ids is None
            or int(movie["tmdbId"]) in tracked_movie_ids
        )
    ]

    if category == "top_rated":
        sorted_candidates = sorted(
            candidates,
            key=lambda movie: (movie.get("rating", 0), movie.get("popularity", 0)),
            reverse=True,
        )
    elif category == "now_playing":
        now_playing = [
            movie
            for movie in candidates
            if 0 <= (today - date.fromisoformat(movie["releaseDate"])).days <= 120
        ]
        sorted_candidates = sorted(
            now_playing or candidates,
            key=lambda movie: (movie.get("releaseDate", ""), movie.get("popularity", 0)),
            reverse=True,
        )
    else:
        sorted_candidates = sorted(
            candidates,
            key=lambda movie: (movie.get("popularity", 0), movie.get("rating", 0)),
            reverse=True,
        )
    movie_ids = [int(movie["tmdbId"]) for movie in sorted_candidates]
    if limit is None:
        return movie_ids
    return movie_ids[:limit]


def _movie_metadata(movie_id: int) -> dict:
    movie = mock_data.find_movie(movie_id)
    if not movie:
        return {}
    return {
        "movieId": movie["tmdbId"],
        "title": movie["title"],
        "poster": movie.get("poster"),
        "backdrop": movie.get("backdrop"),
        "genres": movie.get("genres", []),
        "releaseDate": movie.get("releaseDate"),
        "rating": movie.get("rating"),
        "popularity": movie.get("popularity"),
        "overview": movie.get("overview"),
        "mediaType": "movie",
        "blurayAvailable": movie.get("blurayAvailable", True),
    }


def _clean_offer_payload(offer: dict) -> dict:
    cleaned = dict(offer)
    cleaned.pop("_id", None)
    cleaned.pop("discount", None)
    retailer = cleaned.get("retailer")
    if retailer:
        cleaned["sourceLabel"] = retailer
        cleaned["retailerLabel"] = retailer
    return cleaned


def _present_offer_payload(offer: dict) -> dict:
    cleaned = _clean_offer_payload(offer)
    price = cleaned.get("price")
    if isinstance(price, (int, float)):
        price_usd = round(float(price), 2)
        price_cad = round(price_usd * CAD_EXCHANGE_RATE, 2)
        cleaned["priceUsd"] = price_usd
        cleaned["priceCad"] = price_cad
        cleaned["price"] = price_cad
        cleaned["currency"] = "CAD"
        cleaned["priceDisplay"] = f"C${price_cad:.2f}"
    return cleaned


def _enrich_offer(offer: dict) -> dict:
    metadata = _movie_metadata(int(offer["movieId"])) if offer.get("movieId") is not None else {}
    return _present_offer_payload(
        {
        **metadata,
        **offer,
        "isDiscPrice": True,
        }
    )


def _coerce_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _seed_history_for_deal(deal: dict) -> list[dict]:
    current_price = float(deal["price"])
    offsets = [7.0, 5.5, 4.0, 2.5, 1.5, 0.0]
    start_date = datetime.now(timezone.utc) - timedelta(days=60)
    return [
        {
            "movieId": deal["movieId"],
            "title": deal["title"],
            "format": deal["format"],
            "retailer": deal["retailer"],
            "price": round(current_price + offset, 2),
            "date": start_date + timedelta(days=index * 10),
            "source": "mock",
            "isLive": False,
        }
        for index, offset in enumerate(offsets)
    ]


async def _ensure_mock_history(db: AsyncIOMotorDatabase, movie_id: int) -> list[dict]:
    matching_deals = [deal for deal in mock_data.BLURAY_DEALS if deal["movieId"] == movie_id]
    if matching_deals:
        documents: list[dict] = []
        for deal in matching_deals:
            documents.extend(_seed_history_for_deal(deal))
        await db.price_history.insert_many(documents)
        return documents

    return []


def _latest_rows(rows: list[dict]) -> list[dict]:
    latest_by_key: dict[tuple[int, str, str], dict] = {}
    for row in sorted(rows, key=lambda item: item["date"], reverse=True):
        key = (row["movieId"], row["retailer"], row["format"])
        latest_by_key.setdefault(key, row)
    return list(latest_by_key.values())


def _best_deals(rows: list[dict]) -> list[dict]:
    latest_by_offer = _latest_rows(rows)
    best_by_movie: dict[int, dict] = {}
    for row in latest_by_offer:
        existing = best_by_movie.get(row["movieId"])
        if existing is None or row["price"] < existing["price"]:
            best_by_movie[row["movieId"]] = row
    return sorted(best_by_movie.values(), key=lambda item: item["price"])


async def _resolve_movie_title(movie_id: int) -> str | None:
    movie = mock_data.find_movie(movie_id)
    if movie:
        return movie["title"]
    details = await get_movie_details(movie_id)
    if details:
        return details.get("title")
    return None


async def _store_price_point_if_changed(db: AsyncIOMotorDatabase, point: dict) -> None:
    latest = await db.price_history.find_one(
        {
            "movieId": point["movieId"],
            "retailer": point["retailer"],
            "format": point["format"],
        },
        sort=[("date", -1)],
    )
    if latest and latest.get("price") == point["price"] and latest.get("source") == point.get("source"):
        await db.price_history.update_one({"_id": latest["_id"]}, {"$set": {"lastCheckedAt": point["date"], "productUrl": point.get("productUrl")}})
    else:
        await db.price_history.insert_one(dict(point))
    await db.current_disc_offers.update_one(
        {
            "movieId": point["movieId"],
            "retailer": point["retailer"],
            "format": point["format"],
        },
        {
            "$set": {
                **_clean_offer_payload(
                    {
                        **_movie_metadata(int(point["movieId"])),
                        **point,
                        "isDiscPrice": True,
                    }
                ),
                "checkedAt": point["date"],
            },
            "$unset": {"discount": ""},
        },
        upsert=True,
    )


async def _cached_offers(
    db: AsyncIOMotorDatabase,
    query: dict | None = None,
    *,
    limit: int = 200,
) -> list[dict]:
    rows = await db.current_disc_offers.find(query or {}).sort([("price", 1), ("checkedAt", -1)]).to_list(length=limit)
    return [serialize_doc(row) for row in rows if row is not None]


async def seed_price_history(db: AsyncIOMotorDatabase) -> None:
    existing_count = await db.price_history.count_documents({})
    if existing_count:
        return

    documents = []
    for deal in mock_data.BLURAY_DEALS:
        documents.extend(_seed_history_for_deal(deal))
    if documents:
        await db.price_history.insert_many(documents)


async def get_price_history(db: AsyncIOMotorDatabase, movie_id: int) -> dict:
    rows = await db.price_history.find({"movieId": movie_id}).sort("date", 1).to_list(length=100)
    if not rows:
        rows = await _ensure_mock_history(db, movie_id)
    if not rows:
        return {
            "movieId": movie_id,
            "currentPrice": None,
            "lowestPrice": None,
            "highestPrice": None,
            "averagePrice": None,
            "offers": [],
            "history": [],
        }

    serialized = [_present_offer_payload(point) for point in serialize_docs(rows)]
    latest_offers = [_enrich_offer(offer) for offer in serialize_docs(_latest_rows(rows))]
    current_prices = [point["price"] for point in latest_offers] or [point["price"] for point in serialized]
    history_prices = [point["price"] for point in serialized]
    return {
        "movieId": movie_id,
        "currentPrice": min(current_prices),
        "lowestPrice": min(history_prices),
        "highestPrice": max(history_prices),
        "averagePrice": round(sum(history_prices) / len(history_prices), 2),
        "currency": "CAD",
        "offers": sorted(latest_offers, key=lambda offer: offer["price"]),
        "history": serialized,
    }


async def get_current_deals(db: AsyncIOMotorDatabase) -> list[dict]:
    cached = await _cached_offers(db, limit=200)
    if cached:
        return [_enrich_offer(offer) for offer in cached]

    rows = await db.price_history.find({}).sort("date", -1).to_list(length=1000)
    if not rows:
        await seed_price_history(db)
        rows = await db.price_history.find({}).sort("date", -1).to_list(length=1000)
    return [_enrich_offer(offer) for offer in serialize_docs(_best_deals(rows))]


async def get_tracked_movie_ids(db: AsyncIOMotorDatabase) -> set[int]:
    rows = await _cached_offers(db, limit=500)
    if rows:
        return {int(row["movieId"]) for row in rows if row.get("movieId") is not None}
    return set()


async def get_movie_deals(db: AsyncIOMotorDatabase, movie_id: int) -> list[dict]:
    cached = await _cached_offers(db, {"movieId": movie_id}, limit=50)
    if cached:
        return [_enrich_offer(offer) for offer in cached]

    rows = await db.price_history.find({"movieId": movie_id}).sort("date", -1).to_list(length=200)
    if not rows:
        rows = await _ensure_mock_history(db, movie_id)
    return sorted(
        [_enrich_offer(offer) for offer in serialize_docs(_latest_rows(rows))],
        key=lambda offer: offer["price"],
    )


async def refresh_movie_prices(db: AsyncIOMotorDatabase, movie_id: int) -> list[dict]:
    movie_title = await _resolve_movie_title(movie_id)
    if not movie_title:
        return []

    offers = await search_gruv_prices(movie_title)
    current_time = datetime.now(timezone.utc)
    for offer in offers:
        await _store_price_point_if_changed(
            db,
            {
                **offer,
                "movieId": movie_id,
                "title": movie_title,
                "date": current_time,
            },
        )

    rows = await db.price_history.find(
        {"movieId": movie_id, "retailer": "Gruv"},
    ).sort("date", -1).to_list(length=50)
    return sorted(
        [_enrich_offer(offer) for offer in serialize_docs(_latest_rows(rows))],
        key=lambda offer: offer["price"],
    )


async def ensure_fresh_movie_prices(
    db: AsyncIOMotorDatabase,
    movie_id: int,
    *,
    max_age_hours: int = 6,
) -> list[dict]:
    latest_gruv_row = await db.current_disc_offers.find_one(
        {"movieId": movie_id, "retailer": "Gruv"},
        sort=[("checkedAt", -1)],
    )
    now = datetime.now(timezone.utc)
    last_checked = _coerce_utc(latest_gruv_row.get("checkedAt") if latest_gruv_row else None)
    should_refresh = last_checked is None or (now - last_checked) > timedelta(hours=max_age_hours)
    if should_refresh:
        try:
            refreshed = await refresh_movie_prices(db, movie_id)
            if refreshed:
                return refreshed
        except httpx.HTTPError:
            pass
    return await get_movie_deals(db, movie_id)


async def ensure_fresh_deals(
    db: AsyncIOMotorDatabase,
    *,
    movie_ids: list[int] | None = None,
    max_age_hours: int = 6,
) -> list[dict]:
    target_movie_ids = movie_ids or catalog_movie_ids()
    for movie_id in target_movie_ids:
        await ensure_fresh_movie_prices(db, int(movie_id), max_age_hours=max_age_hours)
    return await get_current_deals(db)


async def append_latest_prices(db: AsyncIOMotorDatabase) -> None:
    tracked_movie_ids = {deal["movieId"] for deal in mock_data.BLURAY_DEALS}
    active_alert_ids = await db.price_alerts.distinct("movieId", {"isActive": True})
    history_movie_ids = await db.price_history.distinct("movieId")
    tracked_movie_ids.update(active_alert_ids)
    tracked_movie_ids.update(history_movie_ids)
    for movie_id in sorted(tracked_movie_ids):
        await refresh_movie_prices(db, int(movie_id))
