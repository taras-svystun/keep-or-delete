"""Read Apple's analysis from the Mac Photos library: report which fields are filled, and write
groups for the phone, with every photo's key so the phone can match its photos.

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


# Labels Apple puts on photos of paper and cards: usually taken to note something, then forgotten.
# Not "Map", "Sign" or "Book": those are often travel photos.
DOCUMENT_LABELS = {"Document", "Printed Page", "Receipt", "Handwriting", "Ticket", "Paper", "Menu",
                   "Whiteboard", "Chalkboard", "Chart", "Newspaper", "Nutrition Facts Label", "Credit Card"}


# Smallest group of faces with no name, or of one place.
MIN_SIZE = 20


def build_groups(photos) -> list[dict]:
    """Groups for the phone, each a title and photo keys in the order the cards show.

    Camera photos means photos that are not screenshots: the phone already has a screenshots group.
    """
    camera = sorted((p for p in photos if p.isphoto and not p.screenshot), key=lambda p: p.date)
    groups = [
        ("Worst shots first", sorted(camera, key=lambda p: p.score.overall)),
        ("Documents and receipts", [p for p in camera if is_document(p)]),
        ("Photos with text", [p for p in camera if p.search_info.detected_text]),
        ("Biggest files first", sorted(photos, key=lambda p: -(p.original_filesize or 0))),
        ("Food", [p for p in camera if "Food" in p.search_info.labels]),
        ("People, no one named", [p for p in camera if p.face_info and not named(p)]),
    ]
    # Photos store an eye state per face, 0, 1 or 2, and osxphotos does not say what each means. One
    # group per value, so Taras can look and tell which is closed eyes (open question in docs/PLAN.md).
    groups += [(f"Eye state {v}", [p for p in camera if any(f.eye_state == v for f in p.face_info)]) for v in (0, 1, 2)]
    # A group per person named in Photos' People album, per face Photos grouped but no one named,
    # and per place Photos titled a moment with; the biggest first. Photos' face groups and places
    # below 20 photos are mostly strangers seen once and short stops: too many tiny groups.
    by_name, by_face, by_place = {}, {}, {}
    for p in sorted(photos, key=lambda p: p.date):
        for name in named(p):
            by_name.setdefault(name, []).append(p)
        for face in {f.person_info.uuid: f for f in p.face_info if f.person_info and not is_named(f.person_info.name)}:
            by_face.setdefault(face, []).append(p)
        if p.moment_info and p.moment_info.title:
            by_place.setdefault(p.moment_info.title, []).append(p)
    unnamed = [ps for ps in sorted(by_face.values(), key=len, reverse=True) if len(ps) >= MIN_SIZE]
    groups += sorted(by_name.items(), key=lambda g: -len(g[1]))
    groups += [(f"Unnamed person {n}", ps) for n, ps in enumerate(unnamed, 1)]
    groups += sorted(((t, ps) for t, ps in by_place.items() if len(ps) >= MIN_SIZE), key=lambda g: -len(g[1]))
    # A group of one photo is no use.
    return [{"title": t, "keys": [key(p) for p in ps]} for t, ps in groups if len(ps) > 1]


def is_named(name) -> bool:
    return bool(name) and name != "_UNKNOWN_"


def named(p) -> set[str]:
    return {n for n in p.persons if is_named(n)}


def is_document(p) -> bool:
    """A paper or card label and no one on it. Without the second part, about 13% were people with a
    bit of text behind them (Taras's check, step 5b)."""
    labels = set(p.search_info.labels)
    return bool(DOCUMENT_LABELS & labels) and not p.face_info and "People" not in labels


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

    groups = build_groups(photos)
    print("\nGroups for the phone:")
    for g in groups:
        print(f"  {g['title']:24} {len(g['keys']):6}")

    # Only keys and group titles, with people's and places' names: this goes over plain HTTP
    # (rule in docs/PLAN.md).
    (OUT / "public").mkdir(parents=True, exist_ok=True)
    phone = {"photos": sorted(by_key), "shared": sorted(shared_keys), "groups": groups}
    (OUT / "public" / "groups.json").write_text(json.dumps(phone))
    (OUT / "photos.json").write_text(json.dumps([detail(p) for p in photos], ensure_ascii=False, indent=1))
    print(f"\nPer-photo details: {OUT / 'photos.json'}")


if __name__ == "__main__":
    main()
