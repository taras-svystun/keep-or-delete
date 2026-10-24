# Plan

## Idea (as Taras dictated it, 2026-10-24)

An app or utility to clean the photo gallery on Taras's iPhone in the style of Tinder: each photo
appears as a card, and a swipe decides whether it stays or goes.

## Agreed (2026-10-24)

- **Users**: only Taras, on his own iPhone, for now.
- **Goal**: a clean gallery first. Second, experience of a new project built with the AI. Taras wants
  a rough, big-picture understanding of how iOS apps work, not to become an iOS engineer. The AI writes the code.
- **Photo order**: by groups, not one long stream. First ideas for groups:
  - screenshots of events and invitations (usually outdated, so shown first);
  - screenshots of memes, jokes or interesting facts (maybe save their text, then delete);
  - duplicates (needs its own screen: pick the best one of several, remove the rest, with checkboxes).
- **Deleting**: each swipe only marks a photo, with an undo button for a wrong swipe. At the end of
  a session a review screen shows every photo marked for delete, all checked; Taras can uncheck a few
  and press Done. Then they go to the iPhone's Recently Deleted album.

## Facts found (2026-10-24)

- A free Apple ID can install your own app on your iPhone, but it stops opening after 7 days and must
  be reinstalled from the Mac. Max 3 apps per device. ([Apple](https://developer.apple.com/support/compare-memberships/))
- The Mac runs macOS 14.7.6 (Sonoma), has no Xcode (only Command Line Tools), and has 39 GB free.
  Current Xcode 26.x needs macOS 15.6 or newer, later 26.x releases need macOS 26.2.

## Open questions

- Native Swift app (needs Xcode, so a macOS upgrade and disk space) or a JavaScript app run inside
  Expo Go (no Xcode)?
- Which iOS version runs on the iPhone?
- How are groups found: photo metadata only, on-device ML, or a cloud model (photos leave the phone)?

## Steps

(none yet)
