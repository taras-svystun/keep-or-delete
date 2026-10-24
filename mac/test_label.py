import pytest

from label import pick_sample, save_label


def test_sample_is_stable_and_ignores_input_order():
    uuids = [f"u{i}" for i in range(50)]
    assert pick_sample(uuids, 10) == pick_sample(list(reversed(uuids)), 10)
    assert len(set(pick_sample(uuids, 10))) == 10
    assert len(pick_sample(uuids[:3], 10)) == 3


def test_save_label_sets_replaces_and_removes():
    labels = save_label({}, "a", "meme")
    labels = save_label(labels, "a", "chat")
    assert labels == {"a": "chat"}
    assert save_label(labels, "a", None) == {}
    with pytest.raises(ValueError):
        save_label(labels, "a", "cats")
