from fastapi import APIRouter, HTTPException, Query, status

from app.services import mock_data
from app.services.homepage import build_rich_homepage
from app.database import get_database
from app.services.prices import get_movie_deals
from app.services.streaming import get_combined_streaming_availability
from app.services.tmdb import get_movie_details, search_movies, upcoming_movies

router = APIRouter(prefix="/movies", tags=["movies"])


@router.get("/home")
async def homepage_movies() -> dict:
    return await build_rich_homepage()


@router.get("/filter")
async def filter_movies(
    genre: str | None = None,
    year: int | None = None,
    min_rating: float | None = Query(default=None, ge=0, le=10),
    min_popularity: float | None = Query(default=None, ge=0),
    streaming: str | None = None,
    bluray_available: bool | None = None,
) -> dict:
    return {
        "results": mock_data.filter_movies(
            genre=genre,
            year=year,
            min_rating=min_rating,
            min_popularity=min_popularity,
            streaming=streaming,
            bluray_available=bluray_available,
        )
    }


@router.get("/search")
async def search(query: str = Query(min_length=2)) -> dict:
    return {"results": await search_movies(query)}


@router.get("/upcoming")
async def upcoming() -> dict:
    return {"results": await upcoming_movies()}


@router.get("/{movie_id}")
async def details(movie_id: int) -> dict:
    movie = await get_movie_details(movie_id)
    if not movie:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movie not found.")

    db = get_database()
    movie["streamingAvailability"] = await get_combined_streaming_availability(movie_id)
    bluray_availability = await get_movie_deals(db, movie_id)
    release_info = movie.get("releaseInfo", {})
    if not bluray_availability and release_info.get("hasPhysicalRelease"):
        bluray_availability.append(
            {
                "movieId": movie_id,
                "title": movie["title"],
                "format": "Blu-ray",
                "retailer": "Retailer pricing pending",
                "price": None,
                "source": "TMDb US physical release",
                "sourceLabel": "TMDb US physical release",
                "retailerLabel": "Retailer pricing pending",
                "currency": "CAD",
                "releaseDate": release_info.get("physicalReleaseDate"),
            }
        )
    movie["blurayAvailability"] = bluray_availability
    return movie
