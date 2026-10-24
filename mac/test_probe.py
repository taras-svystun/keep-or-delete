from datetime import datetime
from types import SimpleNamespace

from probe import build_groups


def photo(t, score=0.5, labels=(), text="", size=1, screenshot=False, movie=False):
    return SimpleNamespace(
        _info={"imageDate_timestamp": float(t)}, date=datetime.fromtimestamp(t), width=4, height=3,
        isphoto=not movie, screenshot=screenshot, score=SimpleNamespace(overall=score),
        search_info=SimpleNamespace(labels=list(labels), detected_text=text), original_filesize=size,
    )


def keys(groups, title):
    return next(g["keys"] for g in groups if g["title"] == title)


def test_groups_and_their_order():
    a = photo(1, score=0.9, labels=["Receipt"], size=5)
    b = photo(2, score=0.1, text="hello", size=9)
    shot = photo(3, score=0.0, labels=["Document"], text="x", screenshot=True)
    video = photo(4, size=20, movie=True)
    g = build_groups([video, shot, b, a])
    k = lambda p: f"{round((p._info['imageDate_timestamp'] + 978307200) * 1000)}:4x3"

    # Screenshots and videos stay out of camera groups; the phone groups them already.
    assert keys(g, "Worst shots first") == [k(b), k(a)]
    assert keys(g, "Documents and receipts") == [k(a)]
    assert keys(g, "Photos with text") == [k(b)]
    assert keys(g, "Biggest files first") == [k(video), k(b), k(a), k(shot)]


def test_empty_groups_are_left_out():
    assert [g["title"] for g in build_groups([photo(1)])] == ["Worst shots first", "Biggest files first"]
