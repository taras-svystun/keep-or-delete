from datetime import datetime
from types import SimpleNamespace

from probe import build_groups


def face(name, uuid=None):
    return SimpleNamespace(person_info=SimpleNamespace(name=name, uuid=uuid or name))


def photo(t, score=0.5, labels=(), text="", size=1, screenshot=False, movie=False, persons=(), place=None):
    return SimpleNamespace(
        persons=list(persons), face_info=[face(n) for n in persons],
        moment_info=SimpleNamespace(title=place) if place else None,
        _info={"imageDate_timestamp": float(t)}, date=datetime.fromtimestamp(t), width=4, height=3,
        isphoto=not movie, screenshot=screenshot, score=SimpleNamespace(overall=score),
        search_info=SimpleNamespace(labels=list(labels), detected_text=text), original_filesize=size,
    )


def keys(groups, title):
    return next(g["keys"] for g in groups if g["title"] == title)


def test_groups_and_their_order():
    a = photo(1, score=0.9, labels=["Receipt"], size=5)
    b = photo(2, score=0.1, text="hello", size=9)
    c = photo(3, score=0.5, labels=["Printed Page"], text="menu", size=1)
    shot = photo(4, score=0.0, labels=["Document"], text="x", screenshot=True, size=2)
    video = photo(5, size=20, movie=True)
    g = build_groups([video, shot, c, b, a])
    k = lambda p: f"{round((p._info['imageDate_timestamp'] + 978307200) * 1000)}:4x3"

    # Screenshots and videos stay out of camera groups; the phone groups them already.
    assert keys(g, "Worst shots first") == [k(b), k(c), k(a)]
    assert keys(g, "Documents and receipts") == [k(a), k(c)]
    assert keys(g, "Photos with text") == [k(b), k(c)]
    assert keys(g, "Biggest files first") == [k(video), k(b), k(a), k(shot), k(c)]


def test_groups_of_one_photo_are_left_out():
    assert [g["title"] for g in build_groups([photo(1), photo(2)])] == ["Worst shots first", "Biggest files first"]


def test_documents_leave_out_people():
    papers = [photo(1, labels=["Document"]), photo(2, labels=["Receipt"])]
    with_face = photo(3, labels=["Document"], persons=["_UNKNOWN_"])
    with_people = photo(4, labels=["Document", "People"])
    assert len(keys(build_groups([*papers, with_face, with_people]), "Documents and receipts")) == 2


def test_one_group_per_named_person_most_photos_first():
    a = photo(1, persons=["Ann", "_UNKNOWN_"])
    b = photo(2, persons=["Bob", "Ann"])
    c = photo(3, persons=["Bob"])
    d = photo(4, persons=["Bob"])
    titles = [g["title"] for g in build_groups([d, c, b, a])]
    assert titles[-2:] == ["Bob", "Ann"]


def test_faces_with_no_name_and_places_need_20_photos():
    many = [photo(t, persons=["_UNKNOWN_"], place="Lviv") for t in range(20)]
    for p in many:
        p.face_info = [face(None, "cluster-1")]
    few = [photo(100 + t, place="Kyiv") for t in range(19)]
    g = build_groups(many + few)
    titles = [x["title"] for x in g]
    assert "Unnamed person 1" in titles and "Lviv" in titles and "Kyiv" not in titles
    assert len(keys(g, "People, no one named")) == 20

