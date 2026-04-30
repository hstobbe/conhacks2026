from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import close_mongo_connection, connect_to_mongo, get_database
from app.routes import alerts, anime, auth, bluray, chatbot, dashboard, library, movies, tv
from app.services.prices import catalog_movie_ids, ensure_fresh_deals, seed_price_history
from app.services.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    db = get_database()
    await seed_price_history(db)
    await ensure_fresh_deals(db, movie_ids=catalog_movie_ids(limit=None), max_age_hours=24 * 365)
    app.state.scheduler = start_scheduler(db)
    yield
    app.state.scheduler.shutdown(wait=False)
    await close_mongo_connection()


settings = get_settings()
app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(movies.router, prefix="/api")
app.include_router(tv.router, prefix="/api")
app.include_router(anime.router, prefix="/api")
app.include_router(library.router, prefix="/api")
app.include_router(bluray.router, prefix="/api")
app.include_router(alerts.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")


@app.get("/")
async def root() -> dict:
    return {"name": "CineVault API", "status": "online", "docs": "/docs"}


@app.get("/api/health")
async def health() -> dict:
    return {
        "status": "ok",
        "tmdbConfigured": bool(settings.tmdb_api_key),
        "watchmodeConfigured": bool(settings.watchmode_api_key),
        "geminiConfigured": bool(settings.gemini_api_key),
    }
