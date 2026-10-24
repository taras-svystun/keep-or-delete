"""Sort screenshots into kinds three ways and score each against Taras's labels (plan step 6).

1. Text rules (level 2): keywords in Apple's recognised text and labels.
2. CLIP zero-shot: which short description ("a screenshot of a chat") the image is closest to.
3. CLIP probe: a logistic regression on CLIP's image vectors, trained on the labels and scored by
   5-fold cross-validation, so each photo is judged by a model that never saw it.
The rules and descriptions were written before reading the labels, so neither is tuned to them.

Prints only counts and scores. Run: mac/.venv/bin/python mac/kinds.py
"""

import json
import re
from collections import Counter
from pathlib import Path

import numpy as np

from label import KINDS, LABELS, SAMPLE

OUT = Path(__file__).parent / "out"
MODEL, WEIGHTS = "ViT-B-32", "laion2b_s34b_b79k"

# Keywords per kind, in English, Ukrainian, Russian and French. Lower case; matched as substrings.
WORDS = {
    "invitation": ["invit", "запрош", "приглаш", "rsvp", "save the date", "register", "реєстрац",
                   "регистрац", "inscri", "eventbrite", "meetup", "webinar", "вебінар", "вебинар",
                   "going", "interested", "festival", "фестивал", "concert", "концерт", "conference",
                   "конференц", "workshop", "воркшоп", "лекці", "лекци", "event", "подія", "події"],
    "meme": ["lol", "😂", "🤣", "when you", "коли ти", "когда ты", "me:", "мем", "meme", "9gag",
             "be like"],
    "fact": ["tips", "порад", "совет", "benefit", "користь", "польза", "vitamin", "вітамін", "витамин",
             "protein", "білок", "белок", "healthy", "здоров", "did you know", "fact", "факт",
             "superfood", "суперфуд", "recipe", "рецепт"],
    "tech": ["linkedin", "github", "python", "api", "machine learning", "neural", "gpt", "chatgpt",
             "claude", "llm", "developer", "engineer", "startup", "стартап", "data", "model", "code"],
    "chat": ["imessage", "delivered", "last seen", "був у мережі", "була у мережі", "в сети", "онлайн",
             "online", "type a message", "message", "повідомлення", "сообщение", "написати", "telegram",
             "whatsapp", "typing", "друкує", "печатает"],
    "map": ["google maps", "directions", "маршрут", "route", "itinéraire", "km", "км", "navigate",
            "карти", "карты", "plans", "start", "arrive", "прибуття", "прибытие"],
    "shopping": ["€", "$", "₴", "грн", "add to cart", "в кошик", "в корзину", "купити", "купить", "buy",
                 "order", "замовлен", "заказ", "ticket", "квиток", "билет", "billet", "boarding", "price",
                 "ціна", "цена", "prix", "total", "booking", "size", "розмір", "размер", "delivery"],
    "profile": ["tinder", "bumble", "hinge", "km away", "miles away", "followers", "following",
                "підписник", "подписчик", "abonnés", "follow", "instagram", "posts", "дописи"],
    "music": ["shazam", "spotify", "apple music", "lyrics", "album", "альбом", "playlist", "плейлист",
              "song", "пісн", "песн", "listen", "слухати", "youtube music", "soundcloud"],
    "movie": ["imdb", "netflix", "season", "сезон", "фільм", "фильм", "film", "movie", "trailer",
              "трейлер", "letterboxd", "кинопоиск", "серіал", "сериал", "series", "episode", "серія",
              "rotten tomatoes", "megogo"],
}

# What CLIP compares each image to; several phrasings per kind, averaged.
PROMPTS = {
    "invitation": ["a screenshot of an event invitation", "a screenshot of an event poster with a date",
                   "a screenshot of a concert or conference announcement"],
    "meme": ["a meme", "a funny meme with a picture and a caption", "a screenshot of a joke"],
    "fact": ["a screenshot of a list of tips", "a screenshot of an infographic with facts",
             "a screenshot of a list of healthy foods"],
    "tech": ["a screenshot of a LinkedIn post", "a screenshot of a post about technology",
             "a screenshot of code or a tech article"],
    "chat": ["a screenshot of a chat conversation", "a screenshot of text messages",
             "a screenshot of a messenger app"],
    "map": ["a screenshot of a map", "a screenshot of a route on a map", "a screenshot of directions"],
    "shopping": ["a screenshot of an online shop product", "a screenshot of a ticket",
                 "a screenshot of an order or a receipt"],
    "profile": ["a screenshot of a dating profile", "a screenshot of a social media profile",
                "a screenshot of a photo of a person"],
    "music": ["a screenshot of the Shazam app showing a song", "a screenshot of a song in a music app",
              "a screenshot of an album cover"],
    "movie": ["a screenshot of a movie poster", "a screenshot of a film page", "a screenshot of a TV series"],
    "other": ["a screenshot", "a screenshot of a phone screen", "a screenshot of settings"],
}

TIME = re.compile(r"\b\d{1,2}:\d{2}\b")


def kind_from_text(text: str, labels: list[str]) -> str:
    """The kind whose keywords hit most often; 'other' when none hit."""
    t = text.lower()
    hits = Counter({k: sum(t.count(w) for w in words) for k, words in WORDS.items()})
    # Chats show a time on every message; the status bar adds one more.
    if len(TIME.findall(text)) >= 4:
        hits["chat"] += 2
    # A person's photo with little text looks like a profile.
    if "People" in labels and len(text) < 150:
        hits["profile"] += 2
    kind, n = max(hits.items(), key=lambda kv: kv[1])
    return kind if n > 0 else "other"


def image_vectors(model, preprocess, paths: list[str], device: str):
    import torch
    from PIL import Image

    vectors = []
    with torch.no_grad():
        for i in range(0, len(paths), 32):
            batch = torch.stack([preprocess(Image.open(p).convert("RGB")) for p in paths[i:i + 32]])
            v = model.encode_image(batch.to(device)).float()
            vectors.append((v / v.norm(dim=-1, keepdim=True)).cpu().numpy())
    return np.concatenate(vectors)


def prompt_vectors(model, tokenizer, device: str):
    import torch

    rows = []
    with torch.no_grad():
        for kind in KINDS:
            v = model.encode_text(tokenizer(PROMPTS[kind]).to(device)).float()
            v = (v / v.norm(dim=-1, keepdim=True)).mean(0)
            rows.append((v / v.norm()).cpu().numpy())
    return np.stack(rows)


def report(name: str, truth: list[str], guess: list[str]):
    right = sum(t == g for t, g in zip(truth, guess))
    print(f"\n{name}: {right}/{len(truth)} right ({right / len(truth):.0%})")
    for k in KINDS:
        n = sum(t == k for t in truth)
        found = sum(t == g == k for t, g in zip(truth, guess))
        said = sum(g == k for g in guess)
        print(f"  {k:<11} {n:>3} labelled, {found:>3} found, {said:>3} guessed"
              f" (precision {found / said if said else 0:.0%})")


def main():
    import open_clip
    import torch
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import StratifiedKFold, cross_val_predict

    sample = json.loads(SAMPLE.read_text())
    labels = json.loads(LABELS.read_text())
    rows = [s for s in sample if s["uuid"] in labels]
    truth = [labels[s["uuid"]] for s in rows]
    print("Labelled per kind:", dict(Counter(truth).most_common()))
    most = Counter(truth).most_common(1)[0]
    print(f"Always guessing '{most[0]}' is right {most[1]}/{len(truth)} ({most[1] / len(truth):.0%})")

    report("Text rules", truth, [kind_from_text(s["text"], s["labels"]) for s in rows])

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms(MODEL, pretrained=WEIGHTS, device=device)
    model.eval()
    images = image_vectors(model, preprocess, [s["image"] for s in rows], device)
    prompts = prompt_vectors(model, open_clip.get_tokenizer(MODEL), device)
    kinds = list(KINDS)
    report("CLIP zero-shot", truth, [kinds[i] for i in (images @ prompts.T).argmax(1)])

    # Kinds with fewer photos than folds cannot be split; the probe guesses nothing for them (wrong).
    folds = 5
    keep = [i for i, t in enumerate(truth) if Counter(truth)[t] >= folds]
    cv = StratifiedKFold(folds, shuffle=True, random_state=6)
    y = [truth[i] for i in keep]

    def probe(features, name):
        guess = cross_val_predict(LogisticRegression(max_iter=3000, C=10), features[keep], y, cv=cv)
        full = ["none"] * len(truth)
        for i, g in zip(keep, guess):
            full[i] = g
        report(f"{name} ({folds}-fold; kinds under {folds} photos count as wrong)", truth, full)

    probe(images, "CLIP probe")
    # Words of the recognised text beside the image: character pieces work across the four languages.
    from scipy.sparse import csr_matrix, hstack
    from sklearn.feature_extraction.text import TfidfVectorizer
    words = TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 4), min_df=2, sublinear_tf=True)
    text = words.fit_transform([s["text"].lower() for s in rows])
    probe(hstack([csr_matrix(images), text]).tocsr(), "CLIP probe + text")

if __name__ == "__main__":
    main()
