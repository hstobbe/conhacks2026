from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    user: UserPublic


class LibraryStatus(str, Enum):
    want_to_watch = "want_to_watch"
    watching = "watching"
    watched = "watched"
    favorite = "favorite"


class LibraryItemCreate(BaseModel):
    tmdbId: int
    title: str
    poster: str | None = None
    genres: list[str] = []
    releaseDate: str | None = None
    userRating: float | None = Field(default=None, ge=0, le=10)
    status: LibraryStatus = LibraryStatus.want_to_watch
    notes: str | None = None


class LibraryItemUpdate(BaseModel):
    title: str | None = None
    poster: str | None = None
    genres: list[str] | None = None
    releaseDate: str | None = None
    userRating: float | None = Field(default=None, ge=0, le=10)
    status: LibraryStatus | None = None
    notes: str | None = None


class PriceAlertCreate(BaseModel):
    movieId: int
    title: str
    targetPrice: float = Field(gt=0)
    format: str = "4K UHD"
    retailer: str = "Any"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)


class ChatResponse(BaseModel):
    reply: str
    suggestions: list[str] = []


class PriceHistoryPoint(BaseModel):
    movieId: int
    format: str
    retailer: str
    price: float
    date: datetime
