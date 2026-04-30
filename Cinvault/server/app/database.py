from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.uri_parser import parse_uri

from app.config import get_settings

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global client, database

    settings = get_settings()
    parsed_uri = parse_uri(settings.mongo_uri)
    database_name = parsed_uri.get("database") or "cinevault"

    client = AsyncIOMotorClient(settings.mongo_uri, tz_aware=True)
    database = client[database_name]
    await database.command("ping")
    await create_indexes(database)


async def close_mongo_connection() -> None:
    if client:
        client.close()


def get_database() -> AsyncIOMotorDatabase:
    if database is None:
        raise RuntimeError("MongoDB is not connected yet.")
    return database


async def create_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.users.create_index("email", unique=True)
    await db.library.create_index([("userId", 1), ("tmdbId", 1)], unique=True)
    await db.price_alerts.create_index([("userId", 1), ("movieId", 1), ("isActive", 1)])
    await db.price_history.create_index([("movieId", 1), ("date", -1)])
    await db.price_history.create_index([("movieId", 1), ("retailer", 1), ("format", 1), ("date", -1)])
    await db.current_disc_offers.create_index([("movieId", 1), ("retailer", 1), ("format", 1)], unique=True)
    await db.current_disc_offers.create_index([("checkedAt", -1)])
