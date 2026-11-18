import json
import urllib.request
from pathlib import Path

# =====================================
# HTTP STREAMING CONFIGURATION
# =====================================

ADDON_NAME = "HTTP Streaming"

BASE_URL = "https://vidsrc.sh"

MOVIES_URL = f"{BASE_URL}/movies/latest/page-1.json"
SERIES_URL = f"{BASE_URL}/tvshows/latest/page-1.json"

OUTPUT = Path("site")
CATALOG_DIR = OUTPUT / "catalog"

CATALOGS = {
    "http_movies": {
        "url": MOVIES_URL,
        "type": "movie"
    },
    "http_series": {
        "url": SERIES_URL,
        "type": "series"
    }
}


# =====================================
# DOWNLOAD JSON
# =====================================

def download_json(url):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "HTTP-Streaming/1.0",
            "Accept": "application/json"
        }
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


# =====================================
# NORMALIZE CATALOG ENTRIES
# =====================================

def normalize_items(data, content_type):
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = (
            data.get("results")
            or data.get("items")
            or data.get("data")
            or []
        )
    else:
        items = []

    output = []

    for item in items:
        if not isinstance(item, dict):
            continue

        imdb_id = (
            item.get("imdb_id")
            or item.get("imdb")
            or item.get("imdbId")
        )

        if not imdb_id or not str(imdb_id).startswith("tt"):
            continue

        title = (
            item.get("title")
            or item.get("name")
            or item.get("original_title")
        )

        if not title:
            continue

        entry = {
            "id": str(imdb_id),
            "type": content_type,
            "name": str(title)
        }

        poster = (
            item.get("poster")
            or item.get("poster_path")
            or item.get("image")
        )

        if poster:
            entry["poster"] = poster

        description = (
            item.get("overview")
            or item.get("description")
        )

        if description:
            entry["description"] = description

        year = (
            item.get("year")
            or item.get("release_year")
        )

        if year:
            entry["releaseInfo"] = str(year)

        output.append(entry)

    return output


# =====================================
# SAVE JSON
# =====================================

def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)

    path.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


# =====================================
# BUILD
# =====================================

def main():
    print("Building", ADDON_NAME)

    manifest = json.loads(
        Path("manifest.json").read_text(encoding="utf-8")
    )

    save_json(OUTPUT / "manifest.json", manifest)

    for catalog_id, config in CATALOGS.items():
        print("Fetching:", catalog_id)

        data = download_json(config["url"])

        entries = normalize_items(
            data,
            config["type"]
        )

        if not entries:
            raise RuntimeError(
                f"No valid catalog entries received for {catalog_id}. "
                "Check the VidSrc response format."
            )

        save_json(
            CATALOG_DIR / config["type"] / f"{catalog_id}.json",
            {"metas": entries}
        )

        print("Entries:", len(entries))

    print("HTTP Streaming build complete.")


if __name__ == "__main__":
    main()
