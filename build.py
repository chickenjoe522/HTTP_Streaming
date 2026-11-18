import json
import urllib.request
from pathlib import Path

# =====================================
# HTTP STREAMING
# =====================================

ADDON_NAME = "HTTP Streaming"
BASE_URL = "https://vidsrc.sh"

FEEDS = {
    "http_movies": {
        "url": f"{BASE_URL}/movies/latest/page-1.json",
        "type": "movie"
    },
    "http_series": {
        "url": f"{BASE_URL}/tvshows/latest/page-1.json",
        "type": "series"
    }
}

ROOT = Path("site")
CATALOG_DIR = ROOT / "catalog"


# =====================================
# DOWNLOAD VIDSRС JSON
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
        return json.loads(
            response.read().decode("utf-8")
        )


# =====================================
# NORMALIZE VIDSRС RESPONSE
# =====================================

def normalize_items(data, content_type):

    # VidSrc uses "result", not "results".
    items = data.get("result", [])

    if not isinstance(items, list):
        raise RuntimeError(
            "VidSrc result field is not a list"
        )

    output = []
    seen = set()

    for item in items:

        if not isinstance(item, dict):
            continue

        imdb_id = item.get("imdb_id")
        title = item.get("title")

        if not imdb_id or not title:
            continue

        if not str(imdb_id).startswith("tt"):
            continue

        if imdb_id in seen:
            continue

        seen.add(imdb_id)

        entry = {
            "id": str(imdb_id),
            "type": content_type,
            "name": str(title)
        }

        # VidSrc listing feeds provide quality
        # and addition date, but not necessarily posters.

        quality = item.get("quality")
        added = item.get("time_added")

        details = []

        if quality:
            details.append(f"Quality: {quality}")

        if added:
            details.append(f"Added: {added}")

        if details:
            entry["description"] = " | ".join(details)

        output.append(entry)

    return output


# =====================================
# SAVE JSON
# =====================================

def save_json(path, data):

    path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    path.write_text(
        json.dumps(
            data,
            ensure_ascii=False,
            indent=2
        ),
        encoding="utf-8"
    )


# =====================================
# BUILD CATALOGS
# =====================================

def main():

    print("=" * 40)
    print(ADDON_NAME)
    print("VidSrc Catalog Builder")
    print("=" * 40)

    manifest_file = Path("manifest.json")

    if not manifest_file.exists():
        raise FileNotFoundError(
            "manifest.json not found"
        )

    manifest = json.loads(
        manifest_file.read_text(
            encoding="utf-8"
        )
    )

    manifest["name"] = ADDON_NAME

    save_json(
        ROOT / "manifest.json",
        manifest
    )

    total = 0

    for catalog_id, config in FEEDS.items():

        print()
        print("Fetching:", catalog_id)
        print("URL:", config["url"])

        data = download_json(config["url"])

        print("Available pages:", data.get("pages"))

        entries = normalize_items(
            data,
            config["type"]
        )

        if not entries:
            raise RuntimeError(
                f"No valid entries for {catalog_id}. "
                f"Response keys: {list(data.keys())}"
            )

        output_file = (
            CATALOG_DIR
            / config["type"]
            / f"{catalog_id}.json"
        )

        save_json(
            output_file,
            {"metas": entries}
        )

        print("Catalog:", catalog_id)
        print("Entries:", len(entries))
        print("Saved:", output_file)

        total += len(entries)

    print()
    print("=" * 40)
    print("BUILD SUCCESSFUL")
    print("Addon:", ADDON_NAME)
    print("Catalogs: 2")
    print("Total entries:", total)
    print("=" * 40)


if __name__ == "__main__":
    main()
