from collections import Counter

from app.services.mock_data import MOVIES


def recommend_from_library(library_items: list[dict], limit: int = 8) -> list[dict]:
    if not library_items:
        return sorted(MOVIES, key=lambda movie: (movie["rating"], movie["popularity"]), reverse=True)[:limit]

    watched_ids = {item["tmdbId"] for item in library_items}
    liked_genres: Counter[str] = Counter()
    for item in library_items:
        rating = item.get("userRating") or 0
        weight = 2 if rating >= 8 else 1
        for genre in item.get("genres", []):
            liked_genres[genre] += weight

    def score(movie: dict) -> float:
        genre_score = sum(liked_genres.get(genre, 0) for genre in movie["genres"])
        return genre_score * 10 + movie["rating"] + movie["popularity"] / 100

    candidates = [movie for movie in MOVIES if movie["tmdbId"] not in watched_ids]
    return sorted(candidates, key=score, reverse=True)[:limit]
