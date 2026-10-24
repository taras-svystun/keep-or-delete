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
