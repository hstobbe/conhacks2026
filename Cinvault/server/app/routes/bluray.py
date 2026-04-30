from fastapi import APIRouter, HTTPException, Query, status

from app.database import get_database
from app.services.prices import (
    catalog_movie_ids,
    ensure_fresh_deals,
    get_current_deals,
    get_price_history,
    get_tracked_movie_ids,
    refresh_movie_prices,
)

router = APIRouter(prefix="/bluray", tags=["bluray"])


@router.get("/deals")
async def deals(
    category: str = Query(default="popular", pattern="^(popular|top_rated|now_playing)$"),
    genre: str | None = None,
    limit: int = Query(default=12, ge=1, le=24),
) -> dict:
    db = get_database()
    tracked_movie_ids = await get_tracked_movie_ids(db)
    if not tracked_movie_ids:
        await ensure_fresh_deals(
            db,
            movie_ids=catalog_movie_ids(category=category, genre=genre, limit=max(limit, 12)),
            max_age_hours=24 * 365,
        )
        tracked_movie_ids = await get_tracked_movie_ids(db)

    movie_ids = catalog_movie_ids(
        category=category,
        genre=genre,
        limit=limit,
        tracked_movie_ids=tracked_movie_ids,
    )
    deals = await get_current_deals(db)
    filtered_deals = [deal for deal in deals if int(deal["movieId"]) in set(movie_ids)]
    ordered_ids = {movie_id: index for index, movie_id in enumerate(movie_ids)}
    filtered_deals.sort(key=lambda deal: ordered_ids.get(int(deal["movieId"]), 999))
    return {"results": filtered_deals[:limit]}


@router.post("/refresh/{movie_id}")
async def refresh(movie_id: int) -> dict:
    db = get_database()
    offers = await refresh_movie_prices(db, movie_id)
    if not offers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No live Gruv disc listings were found for this movie.",
        )
    return {"movieId": movie_id, "results": offers}


@router.get("/price-history/{movie_id}")
async def price_history(movie_id: int) -> dict:
    db = get_database()
    return await get_price_history(db, movie_id)
