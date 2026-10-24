from kinds import kind_from_text


def test_text_rules_pick_the_kind_with_most_hits():
    assert kind_from_text("Shazam · Song by Artist · Apple Music", []) == "music"
    assert kind_from_text("12:01 hi 12:02 yo 12:03 ok 12:04 bye", []) == "chat"
    assert kind_from_text("", ["People"]) == "profile"
    assert kind_from_text("nothing to see", []) == "other"
