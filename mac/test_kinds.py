from kinds import kind_from_text


def test_text_rules_pick_the_kind_with_most_hits():
    assert kind_from_text("Shazam · Song by Artist · Apple Music", []) == "music"
    assert kind_from_text("12:01 hi 12:02 yo 12:03 ok 12:04 bye", []) == "chat"
    assert kind_from_text("", ["People"]) == "profile"
    assert kind_from_text("nothing to see", []) == "other"


def test_labels_win_and_surest_comes_first():
    import numpy as np

    from kinds import order_by_kind

    chance = np.array([[0.9, 0.1], [0.6, 0.4], [0.2, 0.8], [0.7, 0.3]])
    kinds = order_by_kind(["a", "b", "c", "d"], {"d": "chat"}, ["meme", "chat"], chance)
    assert kinds == {"chat": ["d", "c"], "meme": ["a", "b"]}
