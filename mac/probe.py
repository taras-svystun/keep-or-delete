"""Probe the Mac Photos library: which of Apple's fields are filled, and whether photos can be
matched to the phone by key.

Prints only counts, so the output is safe to paste into the journal. Per-photo details (labels,
places, text) go to mac/out/, which is git-ignored because it is personal data. The file for the
phone, keys and groups only, goes to mac/out/public/, the one folder served on the Wi-Fi.

Run: mac/.venv/bin/python mac/probe.py
Serve to the phone: mac/.venv/bin/python -m http.server 8765 -d mac/out/public
"""

import json
from collections import Counter
from pathlib import Path

import osxphotos

OUT = Path(__file__).parent / "out"
# Seconds from 1970 to 2001, where Apple counts time from.
APPLE_EPOCH = 978307200


def key(p) -> str:
    """The key both sides know: creation time in whole milliseconds, then width x height.

    The phone (expo-media-library 58, `toMetadata`) rounds `creationDate` to whole milliseconds the
    same way, and reads `pixelWidth` and `pixelHeight` of the current version, as `width` and
    `height` do here. The time is the raw database value (seconds since 2001), not `p.date`: that
    datetime keeps only microseconds, which moves times like 51.4998 ms across the half and makes
    keys 1 ms off from the phone's.
    """
    ms = round((p._info["imageDate_timestamp"] + APPLE_EPOCH) * 1000)
    return f"{ms}:{p.width}x{p.height}"


def filled(p) -> dict[str, bool]:
    """Which of Apple's fields hold something for this photo."""
    s, sc = p.search_info, p.score
    return {
        "score": sc is not None and sc.overall is not None,
        "labels": bool(s.labels),
        "text_found": bool(s.detected_text),
        "document_types": bool(s.document_types),
        "id_document_types": bool(s.id_document_types),
        "events": bool(s.events or s.event_types),
        "venues": bool(s.venues or s.venue_types),
        "holidays": bool(s.holidays),
        "trip": bool(s.trip),
        "activities": bool(s.activities),
        "landmarks": bool(s.landmarks),
        "pets": bool(s.pets),
        "persons": bool([n for n in p.persons if n != "_UNKNOWN_"]),
        "faces": bool(p.face_info),
        "ai_caption": bool(p.ai_caption),
        "moment": p.moment_info is not None,
        "place": p.place is not None,
        "burst": p.burst,
        "burst_selected": p.burst and p.burst_selected,
        "filesize": bool(p.original_filesize),
        "screenshot": p.screenshot,
        "syndicated": bool(p.syndicated),
        "shared": bool(p.shared),
        "cloud_asset": p.iscloudasset,
        "original_on_mac": not p.ismissing,
    }


def detail(p) -> dict:
    s = p.search_info
    return {
        "key": key(p),
        "uuid": p.uuid,
        "filename": p.original_filename,
        "movie": p.ismovie,
        "score": p.score.overall if p.score else None,
        "failure": p.score.failure if p.score else None,
        "labels": s.labels,
        "documents": s.document_types + s.id_document_types,
        "events": s.events + s.event_types,
        "trip": s.trip,
        "text": s.detected_text[:200] if s.detected_text else "",
        "caption": p.ai_caption,
        "burst": p.burst,
        "burst_selected": p.burst_selected,
        "size": p.original_filesize,
    }


def main():
    db = osxphotos.PhotosDB()
    photos = db.photos()
    n = len(photos)
    movies = sum(p.ismovie for p in photos)
    dates = sorted(p.date for p in photos)
    print(f"Photos library {db.photos_version}: {n} items ({n - movies} photos, {movies} videos), "
          f"{dates[0]:%Y-%m-%d} to {dates[-1]:%Y-%m-%d}")

    counts = Counter()
    for p in photos:
        counts.update(k for k, v in filled(p).items() if v)
    print("\nFilled per field:")
    for field in filled(photos[0]):
        print(f"  {field:18} {counts[field]:6}  {100 * counts[field] / n:5.1f}%")

    by_key = Counter(key(p) for p in photos)
    shared_keys = {k: c for k, c in by_key.items() if c > 1}
    print(f"\nKeys: {len(by_key)} distinct for {n} items; {len(shared_keys)} keys shared by "
          f"{sum(shared_keys.values())} items")
    with_name = Counter((key(p), p.original_filename) for p in photos)
    print(f"Key plus filename: {sum(c for c in with_name.values() if c > 1)} items still share one")

    # Groups come in plan step 5b; for now every photo has none, so the phone can test the match.
    (OUT / "public").mkdir(parents=True, exist_ok=True)
    phone = {"photos": {key(p): [] for p in photos}, "shared": sorted(shared_keys)}
    (OUT / "public" / "groups.json").write_text(json.dumps(phone))
    (OUT / "photos.json").write_text(json.dumps([detail(p) for p in photos], ensure_ascii=False, indent=1))
    print(f"\nPer-photo details: {OUT / 'photos.json'}")


if __name__ == "__main__":
    main()
