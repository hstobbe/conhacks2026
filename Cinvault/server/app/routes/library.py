from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.auth.security import get_current_user
from app.database import get_database
from app.models.schemas import LibraryItemCreate, LibraryItemUpdate
from app.utils.object_id import serialize_doc, serialize_docs, to_object_id

router = APIRouter(prefix="/library", tags=["library"])


@router.get("")
async def list_library(current_user: dict = Depends(get_current_user)) -> dict:
    db = get_database()
    items = await db.library.find({"userId": current_user["id"]}).sort("updatedAt", -1).to_list(length=500)
    return {"results": serialize_docs(items)}


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_library_item(
    payload: LibraryItemCreate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    db = get_database()
    now = datetime.now(timezone.utc)
    document = payload.model_dump(mode="json")
    document.update({"userId": current_user["id"], "createdAt": now, "updatedAt": now})

    try:
        result = await db.library.insert_one(document)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Movie is already in your library.") from exc

    created = await db.library.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.put("/{item_id}")
async def update_library_item(
    item_id: str,
    payload: LibraryItemUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    db = get_database()
    updates = payload.model_dump(mode="json", exclude_unset=True)
    updates["updatedAt"] = datetime.now(timezone.utc)

    result = await db.library.update_one(
        {"_id": to_object_id(item_id), "userId": current_user["id"]},
        {"$set": updates},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library item not found.")

    updated = await db.library.find_one({"_id": to_object_id(item_id)})
    return serialize_doc(updated)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_library_item(item_id: str, current_user: dict = Depends(get_current_user)) -> None:
    db = get_database()
    result = await db.library.delete_one({"_id": to_object_id(item_id), "userId": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Library item not found.")
