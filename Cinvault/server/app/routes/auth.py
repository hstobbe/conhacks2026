from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.auth.security import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_database
from app.models.schemas import TokenResponse, UserCreate, UserLogin, UserPublic
from app.utils.object_id import serialize_doc

router = APIRouter(prefix="/auth", tags=["auth"])


def _public_user(user: dict) -> UserPublic:
    return UserPublic(id=user["id"], name=user["name"], email=user["email"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate) -> TokenResponse:
    db = get_database()
    user_id = str(uuid4())
    user_doc = {
        "_id": user_id,
        "name": payload.name,
        "email": payload.email.lower(),
        "hashedPassword": hash_password(payload.password),
        "createdAt": datetime.now(timezone.utc),
    }

    try:
        await db.users.insert_one(user_doc)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.") from exc

    user = serialize_doc(user_doc)
    token = create_access_token(subject=user["id"])
    return TokenResponse(accessToken=token, user=_public_user(user))


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin) -> TokenResponse:
    db = get_database()
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["hashedPassword"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    user = serialize_doc(user)
    token = create_access_token(subject=user["id"])
    return TokenResponse(accessToken=token, user=_public_user(user))


@router.get("/me", response_model=UserPublic)
async def me(current_user: dict = Depends(get_current_user)) -> UserPublic:
    return _public_user(current_user)
