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
