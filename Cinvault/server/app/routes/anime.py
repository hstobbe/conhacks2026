from fastapi import APIRouter, HTTPException, Query, status
from httpx import HTTPStatusError

from app.services.anime import (
    current_season_anime,
    get_anime_details,
    get_anime_episodes,
    search_anime,
    top_anime,
)

router = APIRouter(prefix="/anime", tags=["anime"])


@router.get("/search")
async def search(
    query: str = Query(min_length=2),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=25),
    type: str | None = Query(default=None, pattern="^(tv|movie|ova|special|ona|music)$"),
    min_score: float | None = Query(default=None, ge=0, le=10),
) -> dict:
    try:
        return {
            "results": await search_anime(
                query,
                page=page,
                limit=limit,
                anime_type=type,
                min_score=min_score,
            )
        }
    except HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Anime search failed.") from exc


@router.get("/top")
async def top(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=25),
    type: str | None = Query(default=None, pattern="^(tv|movie|ova|special|ona|music)$"),
) -> dict:
    try:
        return {"results": await top_anime(page=page, limit=limit, anime_type=type)}
    except HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Top anime lookup failed.") from exc


@router.get("/season-now")
async def season_now(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=25),
) -> dict:
    try:
        return {"results": await current_season_anime(page=page, limit=limit)}
    except HTTPStatusError as exc:
        raise HTTPException(status_code=exc.response.status_code, detail="Current season anime lookup failed.") from exc


@router.get("/{anime_id}")
async def details(anime_id: int) -> dict:
    try:
        return await get_anime_details(anime_id)
    except HTTPStatusError as exc:
        if exc.response.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anime not found.") from exc
        raise HTTPException(status_code=exc.response.status_code, detail="Anime details lookup failed.") from exc


@router.get("/{anime_id}/episodes")
async def episodes(anime_id: int, page: int = Query(default=1, ge=1)) -> dict:
    try:
        return {"results": await get_anime_episodes(anime_id, page=page)}
    except HTTPStatusError as exc:
        if exc.response.status_code == status.HTTP_404_NOT_FOUND:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anime episodes not found.") from exc
        raise HTTPException(status_code=exc.response.status_code, detail="Anime episodes lookup failed.") from exc
