"""Hand-label a random sample of screenshots by kind, fast, in the browser.

The labels are the answer key for step 6: text rules and CLIP are both scored against them.
The first run picks the sample from the Mac Photos library and saves it, with each photo's
recognised text, to mac/out/sample.json; later runs start at once. Labels go to
mac/out/labels.json after every click. Both files are personal data, so they stay in the
git-ignored mac/out/. The server listens on 127.0.0.1 only: nothing leaves the Mac.

Run: mac/.venv/bin/python mac/label.py, then open http://127.0.0.1:8766
"""

import json
import random
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "out"
SAMPLE = OUT / "sample.json"
LABELS = OUT / "labels.json"
PORT = 8766
SIZE = 200

# Kinds of screenshots, in the order of the keys 1-9, 0, o on the labelling page.
KINDS = {
    "invitation": "Invitation or event",
    "meme": "Meme or joke",
    "fact": "Fact or tip (lists, superfoods)",
    "tech": "Tech post (LinkedIn, ...)",
    "chat": "Chat",
    "map": "Map or route",
    "shopping": "Shopping or ticket",
    "profile": "Profile or person (Tinder, social)",
    "music": "Music (Shazam)",
    "movie": "Movie or series",
    "other": "Other",
}


def pick_sample(uuids: list[str], size: int = SIZE, seed: int = 6) -> list[str]:
    """A random sample that stays the same between runs, so labels never point at a lost photo."""
    return random.Random(seed).sample(sorted(uuids), min(size, len(uuids)))


def save_label(labels: dict[str, str], uuid: str, kind: str | None) -> dict[str, str]:
    """Set or (with kind None, for undo) remove one photo's label."""
    if kind is not None and kind not in KINDS:
        raise ValueError(f"unknown kind: {kind}")
    labels = {u: k for u, k in labels.items() if u != uuid}
    if kind is not None:
        labels[uuid] = kind
    return labels


def build_sample() -> list[dict]:
    import osxphotos

    shots = {p.uuid: p for p in osxphotos.PhotosDB().photos() if p.screenshot and p.path_derivatives}
    sample = []
    for uuid in pick_sample(list(shots)):
        p = shots[uuid]
        sample.append({
            "uuid": uuid,
            # The largest local preview; originals live in iCloud on this Mac.
            "image": p.path_derivatives[0],
            "text": " ".join(t for t, _ in p.detected_text()),
            "labels": p.search_info.labels,
        })
    return sample


def load_json(path: Path, default):
    return json.loads(path.read_text()) if path.exists() else default


class Handler(BaseHTTPRequestHandler):
    def send(self, body: bytes, kind: str, code: int = 200):
        self.send_response(code)
        self.send_header("Content-Type", kind)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/":
            self.send((HERE / "label.html").read_bytes(), "text/html; charset=utf-8")
        elif self.path == "/data":
            data = {"kinds": KINDS, "sample": [s["uuid"] for s in self.server.sample],
                    "labels": load_json(LABELS, {})}
            self.send(json.dumps(data).encode(), "application/json")
        elif self.path.startswith("/img/"):
            image = self.server.images.get(self.path[5:])
            if image is None:
                self.send(b"", "text/plain", 404)
            else:
                self.send(Path(image).read_bytes(), "image/jpeg")
        else:
            self.send(b"", "text/plain", 404)

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        try:
            labels = save_label(load_json(LABELS, {}), body["uuid"], body["kind"])
        except ValueError as e:
            self.send(str(e).encode(), "text/plain", 400)
            return
        LABELS.write_text(json.dumps(labels, indent=1))
        self.send(b"{}", "application/json")

    def log_message(self, *args):
        pass


def main():
    OUT.mkdir(exist_ok=True)
    if not SAMPLE.exists():
        print("Picking the sample from the Photos library (about a minute)...", flush=True)
        SAMPLE.write_text(json.dumps(build_sample(), ensure_ascii=False, indent=1))
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    server.sample = load_json(SAMPLE, [])
    server.images = {s["uuid"]: s["image"] for s in server.sample}
    print(f"{len(server.sample)} screenshots. Open http://127.0.0.1:{PORT}  (Ctrl-C to stop)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
