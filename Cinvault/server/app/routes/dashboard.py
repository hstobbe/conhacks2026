from fastapi import APIRouter, Depends

from app.auth.security import get_current_user
from app.database import get_database
from app.services.prices import get_current_deals
from app.services.recommendations import recommend_from_library

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def dashboard(current_user: dict = Depends(get_current_user)) -> dict:
    db = get_database()
    library = await db.library.find({"userId": current_user["id"]}).to_list(length=500)
    alerts = await db.price_alerts.find({"userId": current_user["id"]}).sort("createdAt", -1).to_list(length=20)
    deals = await get_current_deals(db)
    watched = [item for item in library if item.get("status") == "watched"]
    ratings = [item["userRating"] for item in library if item.get("userRating") is not None]

    return {
        "stats": {
            "libraryCount": len(library),
            "watchedCount": len(watched),
            "averageRating": round(sum(ratings) / len(ratings), 1) if ratings else None,
            "activeAlerts": len([alert for alert in alerts if alert.get("isActive")]),
        },
        "recommendations": recommend_from_library(library),
        "deals": deals[:4],
        "alerts": [
            {
                "id": str(alert["_id"]),
                "title": alert["title"],
                "targetPrice": alert["targetPrice"],
                "format": alert["format"],
                "retailer": alert["retailer"],
                "isActive": alert["isActive"],
            }
            for alert in alerts
        ],
    }
