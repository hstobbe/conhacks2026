from fastapi import APIRouter, HTTPException, Query, status
from httpx import HTTPStatusError

from app.services.tv import get_tv_details, get_tv_season, popular_tv, search_tv, trending_tv

router = APIRouter(prefix="/tv", tags=["tv"])


@router.get("/search")
async def search(query: str = Query(min_length=2), page: int = Query(default=1, ge=1)) -> dict:
    try:
        return {"results": await search_tv(query, page=page)}
    except HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="TV search failed.") from exc


@router.get("/popular")
async def popular(page: int = Query(default=1, ge=1)) -> dict:
    try:
        return {"results": await popular_tv(page=page)}
    except HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Popular TV lookup failed.") from exc


@router.get("/trending")
async def trending(time_window: str = Query(default="day", pattern="^(day|week)$")) -> dict:
    try:
        return {"results": await trending_tv(time_window=time_window)}
    except HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Trending TV lookup failed.") from exc


@router.get("/{series_id}")
async def details(series_id: int, region: str = "US") -> dict:
    try:
        show = await get_tv_details(series_id, region=region)
    except HTTPStatusError as exc:
        if exc.response.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TV show not found.") from exc
        raise HTTPException(status_code=exc.response.status_code, detail="TV details lookup failed.") from exc

    if not show:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TV show not found.")
    return show


@router.get("/{series_id}/season/{season_number}")
async def season(series_id: int, season_number: int) -> dict:
    try:
        return await get_tv_season(series_id, season_number)
    except HTTPStatusError as exc:
        if exc.response.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TV season not found.") from exc
        raise HTTPException(status_code=exc.response.status_code, detail="TV season lookup failed.") from exc
