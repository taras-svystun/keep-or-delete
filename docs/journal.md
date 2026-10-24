# Journal

Newest at the bottom.

## 2026-10-24: photos did not show on the iPhone

The card was empty and Expo Go showed "No suitable image URL loader found ph://…" (RCTImageLoader).
Cause: we passed the photo id (`ph://…`) straight to React Native's `Image`, and Expo Go has no image
loader for that scheme. Fix: new `mobile/src/PhotoImage.tsx` gets a `file://` URI with
`Asset.getUri()` (expo-media-library, reads the full-size file) and shows that. Used by the card and
the review grid. Tests and typecheck pass; device check pending. Drawback: the review grid loads
full-size files, not thumbnails; fine for the MVP, revisit if it is slow.

## 2026-10-24: review check mark readable on any photo

Taras could not see the white ✓ on light photos. Now each cell has a round badge with a white ring:
red with ✓ when marked for delete, empty when spared. A ring plus a filled badge contrasts with both
light and dark photos; a colour change alone would fail on photos of that colour.

## 2026-10-24: step 1 done, next steps planned

The screenshot count matches the Photos album, so all step 1 checks passed. Planned steps 2 (remember
decisions across restarts) and 3 (faster photos). Agreed to plan only 2-3 steps ahead, and to use
`--tunnel` instead of a standalone app for now.

## 2026-10-24: step 2, decisions survive a restart (device check pending)

Every swipe and undo now writes all decisions (photo id → keep or delete) to `decisions.json` in the
app's documents folder (`expo-file-system`, included in Expo Go). On start the app rebuilds the session
from the library as it is now: kept photos are left out, marked ones come first and stay marked, new
ones follow. Building from the live library means photos deleted anywhere never come back. On Done,
deleted photos are forgotten and photos unchecked on the review screen count as kept.
Why one JSON file, not SQLite: a few thousand ids is a few hundred KB, so rewriting it per swipe is
cheap, and there is nothing to query. Accepted risk: if the app dies mid-write the file breaks, the app
starts empty and kept photos show again. Revisit if it ever happens.
Also: first `expo lint` run added ESLint; fixed its errors in `SwipeCard` (refs read during render)
by dropping the callback ref, which was not needed.

## 2026-10-24: step 2 done

Taras checked on the iPhone: kept photos stay hidden after a restart, marked ones stay marked, an
undone swipe shows again, spared and deleted photos do not come back, nor do photos deleted in Photos.

## 2026-10-24: step 3, faster photos (device check pending)

Cause of the wait: `PhotoImage` asked expo-media-library for the full-size file (`getUri()`), then
React Native's `Image` decoded all of it, even for a small review cell. Fix: `expo-image` (in Expo Go)
loads `ph://` ids itself through `PHImageManager`, asking for the view's size times the screen scale,
so a review cell gets a thumbnail (checked in its source, `ios/Loaders/PhotoLibraryAssetLoader.swift`,
v58.0.17). Memory cache only, so it keeps no extra copies of photos on disk.
Also a card stack: the next photo is rendered under the current card, keyed by photo id, so after a
swipe React keeps that same card, already loaded, as the new top card.

## 2026-10-24: step 3 done

Taras checked on the iPhone: cards appear with no visible wait, and 100+ photos scroll smoothly.
Added to ideas: screenshot split by meaning, select text then delete, pinch to zoom.
Checked free metadata for the next step: no burst flag and no file size in `expo-media-library`, so
"longest videos first" uses duration as a stand-in for size.

## 2026-10-24: research, metadata for groups

Checked what can group photos (`docs/research/photo-metadata.md`). Verdict: the phone alone gives about a
dozen groups, including bursts and screen recordings through iOS smart albums; the big jump in meaning
(blurry shots, receipts, events, recognised text) is already computed by Apple and readable on the Mac
with osxphotos. Sources: expo-media-library 58.0.12 source, Apple PHAssetCollectionSubtype, osxphotos API.
Planned step 4 (groups from phone metadata) and step 5 (a week of use).

## 2026-10-24: plan steps 4-6 follow the three metadata levels

Taras wants levels 1 and 2 built now and CLIP decided after them, on evidence. Dropped the "week of use"
step: Taras tests each step at once and reports ideas as they come. The Mac probe (5a) goes before the
Mac-to-phone pipeline, so we learn whether the id match and Apple's fields hold before building on them.

## 2026-10-24: step 4, groups from phone metadata (device check pending)

A start screen lists groups with "to go · total"; tapping one opens the same swipe and review for that
group. One metadata query reads the whole library (id, type, date, duration, subtypes), and pure code
in `mobile/src/groups.ts` builds: screenshots, screen recordings (Expo 58's new `screenRecording`
subtype, so no album needed), videos longest first with the duration on the card, then albums, then
the other photos by month, oldest first. Selfies and Bursts have no subtype, so they come from iOS smart
albums matched by English title; messenger albums by name (WhatsApp, Telegram, ...). Titles are a guess
about the language Expo Go uses, so the app logs every album title and count instead of a separate
logging step first.
Decisions stay one shared map, so overlap between groups (a selfie is also in its month) is harmless.
Fixed on the way: decisions were saved in every phase, which would write a finished session's marks
back after Done once the app returns to groups; now they are saved only while swiping.
Untested risk: the Bursts album returns one photo per burst; what deleting it does to the other frames
is not checked.

## 2026-10-24: step 4 done

Taras checked on the iPhone: group counts match Photos, and a photo decided in one group does not show
in another. The album log showed English titles (the guess held), no Telegram album, three albums named
Instagram (the index in group keys keeps them apart). Ideas recorded: smarter time groups (merge small
months, trips and events from Photos' Memories) and a "Recently Saved" group.

## 2026-10-24: step 5a, Mac probe (phone match pending)

`mac/probe.py` reads the Mac Photos library with osxphotos 0.77.2 in `mac/.venv` (8 s for 7276 items:
6758 photos, 518 videos, 2018 to today). Full Disk Access was not needed for the script, though `ls`
on the library is blocked. Filled fields: quality score 100%, labels 84%, recognised text 40%, faces
50%, named persons 21%, activities 15%, place 49%, moment 86% (1360 of 2286 moments have a place
title). Empty or near: document types, ID documents, events, trips, landmarks, AI captions (all 0),
holidays 29, venues 12, bursts 3 with none picked. Likely cause (estimate): these come with newer
Photos than 9.6 on macOS 14, or bursts are not synced. The "Document" label stands in for documents:
1919 screenshots and 338 camera photos; "Receipt" 28, "Handwriting" 43. Score deciles on camera photos
run 0.16 to 0.59, so it spreads enough to sort by.
Key: the phone (expo-media-library 58 `toMetadata`) rounds `creationDate` to whole milliseconds and
gives `pixelWidth` x `pixelHeight`; the probe builds the same string. On the Mac 34 keys are shared by
77 items, 14 even with the same filename (duplicate imports, estimate). The app fetches
`mac/out/public/groups.json` from the Mac (port 8765, address from Expo's `hostUri`) and logs the
match counts; logic in `mobile/src/mac.ts`, 2 unit tests. Chosen over bundling the file into the app:
a git-ignored file that the app imports breaks the bundle on a fresh clone, and the fetch fails softly.
Cost: the served file (keys only, no text or labels) is readable by anyone on the same Wi-Fi.

First phone match: 6146 phone items, one 6043 (98.3%), none 78, several 25; under the 99% check.
Cause of the first five misses: keys 1 ms off. osxphotos' `date` keeps only microseconds, so a time
like 51.4998 ms became 51.5 and rounded up, while the phone rounds the full value down. Fix: the probe
builds the key from the raw database time (`imageDate_timestamp`, seconds since 2001); checked that
it gives the phone's key for all five. The other misses are not yet explained.
