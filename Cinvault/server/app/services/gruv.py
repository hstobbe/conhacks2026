import re
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup

GRUV_BASE_URL = "https://www.gruv.com"
_REQUEST_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def _normalize_text(value: str) -> str:
    normalized = value.lower()
    normalized = normalized.replace("&", " and ")
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return re.sub(r"\s+", " ", normalized).strip()


def _extract_price(value: str) -> float | None:
    match = re.search(r"\$([0-9]+(?:\.[0-9]{2})?)", value)
    if not match:
        return None
    return float(match.group(1))


def _classify_format(title: str) -> str | None:
    normalized = _normalize_text(title)
    if "steelbook" in normalized and any(token in normalized for token in ("4k", "ultra hd", "uhd")):
        return "4K Steelbook"
    if any(token in normalized for token in ("4k", "ultra hd", "uhd")):
        return "4K UHD"
    if "blu ray" in normalized or "bluray" in normalized:
        return "Blu-ray"
    return None


def _is_match(movie_title: str, candidate_title: str) -> bool:
    normalized_movie = _normalize_text(movie_title)
    normalized_candidate = _normalize_text(candidate_title)
    if not normalized_movie or not normalized_candidate:
        return False
    if normalized_movie in normalized_candidate:
        if "collection" in normalized_candidate and "collection" not in normalized_movie:
            return False
        if re.search(r"\b\d+\s+film\b", normalized_candidate):
            return False
        if "dvd" in normalized_candidate and "blu ray" not in normalized_candidate and "4k" not in normalized_candidate:
            return False
        return True
    movie_tokens = set(normalized_movie.split())
    candidate_tokens = set(normalized_candidate.split())
    significant_tokens = {token for token in movie_tokens if len(token) > 2}
    return len(significant_tokens & candidate_tokens) >= min(3, len(significant_tokens))


async def search_gruv_prices(movie_title: str) -> list[dict]:
    async with httpx.AsyncClient(
        timeout=15,
        follow_redirects=True,
        headers=_REQUEST_HEADERS,
    ) as client:
        response = await client.get(f"{GRUV_BASE_URL}/search", params={"q": movie_title})
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    offers: list[dict] = []
    seen_urls: set[str] = set()

    for card in soup.select("div.product-card"):
        link = card.select_one("a.product-card-link")
        title_node = card.select_one("h3.product-card-title")
        price_node = card.select_one("span.product-card-price-final")
        if not link or not title_node or not price_node:
            continue

        offer_title = title_node.get_text(" ", strip=True)
        if not _is_match(movie_title, offer_title):
            continue

        offer_format = _classify_format(offer_title)
        price = _extract_price(price_node.get_text(" ", strip=True))
        href = (link.get("href") or "").strip()
        if not offer_format or price is None or not href:
            continue

        product_url = href if href.startswith("http") else f"{GRUV_BASE_URL}{href}"
        if product_url in seen_urls:
            continue
        seen_urls.add(product_url)

        offers.append(
            {
                "title": offer_title,
                "retailer": "Gruv",
                "format": offer_format,
                "price": price,
                "productUrl": product_url,
                "source": "scraped",
                "isLive": True,
                "date": datetime.now(timezone.utc),
            }
        )

    return sorted(offers, key=lambda offer: offer["price"])
