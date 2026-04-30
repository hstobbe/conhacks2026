from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.security import get_current_user
from app.database import get_database
from app.models.schemas import PriceAlertCreate
from app.utils.object_id import serialize_doc, serialize_docs, to_object_id

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: PriceAlertCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    db = get_database()
    existing = await db.price_alerts.find_one(
        {
            "userId": current_user["id"],
            "movieId": payload.movieId,
            "retailer": payload.retailer,
            "format": payload.format,
            "isActive": True,
        }
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An active alert already exists for this movie, retailer, and format.",
        )
    document = payload.model_dump()
    document.update({
        "userId": current_user["id"],
        "isActive": True,
        "createdAt": datetime.now(timezone.utc),
    })
    result = await db.price_alerts.insert_one(document)
    created = await db.price_alerts.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.get("")
async def list_alerts(current_user: dict = Depends(get_current_user)) -> dict:
    db = get_database()
    alerts = await db.price_alerts.find({"userId": current_user["id"]}).sort("createdAt", -1).to_list(length=200)
    return {"results": serialize_docs(alerts)}


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)) -> None:
    db = get_database()
    result = await db.price_alerts.delete_one({"_id": to_object_id(alert_id), "userId": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")
