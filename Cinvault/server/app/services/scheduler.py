from apscheduler.schedulers.asyncio import AsyncIOScheduler
from motor.motor_asyncio import AsyncIOMotorDatabase

async def check_price_alerts(db: AsyncIOMotorDatabase) -> None:
    active_alerts = await db.price_alerts.find({"isActive": True}).to_list(length=500)
    for alert in active_alerts:
        query = {
            "movieId": alert["movieId"],
            "format": alert["format"],
        }
        if alert["retailer"] != "Any":
            query["retailer"] = alert["retailer"]
        latest = await db.price_history.find_one(
            query,
            sort=[("date", -1)],
        )
        if latest and latest["price"] <= alert["targetPrice"]:
            await db.price_alerts.update_one(
                {"_id": alert["_id"]},
                {"$set": {"triggeredAt": latest["date"], "isActive": False}},
            )


async def refresh_prices_and_alerts(db: AsyncIOMotorDatabase) -> None:
    await check_price_alerts(db)


def start_scheduler(db: AsyncIOMotorDatabase) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(refresh_prices_and_alerts, "interval", hours=6, args=[db])
    scheduler.start()
    return scheduler
