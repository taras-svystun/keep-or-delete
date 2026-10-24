# Plan

## Idea (as Taras dictated it, 2026-10-24)

An app or utility to clean the photo gallery on Taras's iPhone in the style of Tinder: each photo
appears as a card, and a swipe decides whether it stays or goes.

## Agreed (2026-10-24)

- **Users**: only Taras, on his own iPhone, for now.
- **Goal**: a clean gallery first. Second, experience of a new project built with the AI. Taras wants
  a rough, big-picture understanding of how iOS apps work, not to become an iOS engineer. The AI writes
  the code (vibe coding) and explains it at the big-picture level.
- **Money**: spend nothing. Free tools first; a paid service only if nothing free works, and only after asking.
- **Stack**: start with Expo Go (JavaScript/TypeScript, no Xcode). Do not upgrade the Mac or the iPhone
  unless a blocker forces it.
- **Order of work**: first the smallest MVP that tests the idea. Then fundamentals (for example, working
  away from the home Wi-Fi). Features come last, and only few: simple and working beats many features.
- **Photo order**: by groups, not one long stream. First ideas for groups:
  - screenshots of events and invitations (usually outdated, so shown first);
  - screenshots of memes, jokes or interesting facts;
  - duplicates (needs its own screen: pick the best one of several, remove the rest, with checkboxes).
  Start with what metadata gives for free (the screenshot flag). Smarter groups come later, see `docs/IDEAS.md`.
- **Deleting**: each swipe only marks a photo, with an undo button for a wrong swipe. At the end of
  a session a review screen shows every photo marked for delete, all checked; Taras can uncheck a few
  and press Done. Then they go to the iPhone's Recently Deleted album.

- **How we plan**: only the next 2-3 steps are written in detail. Further ahead, what each step teaches
  would rewrite the plan anyway; one step at a time hides where we are going. When a step is done,
  add the next one.
- **Away from home Wi-Fi**: when needed, use `npx expo start --tunnel` (free; the Mac must still run).
  No standalone app for now: it needs Xcode, so a macOS upgrade that cannot be undone, and a clean
  gallery matters more.

## Facts found (2026-10-24)

- A free Apple ID can install your own app on your iPhone, but it stops opening after 7 days and must
  be reinstalled from the Mac. Max 3 apps per device. ([Apple](https://developer.apple.com/support/compare-memberships/))
- The iPhone runs iOS 18.7.8. The Mac is an M1 with 16 GB RAM, Node 22 and Python 3.11.
- The Mac runs macOS 14.7.6 (Sonoma), has no Xcode (only Command Line Tools), and has 39 GB free.
  Current Xcode 26.x needs macOS 15.6 or newer, later 26.x releases need macOS 26.2.

- Expo's `expo-media-library` is included in Expo Go. It can delete assets (`Asset.delete`) and, on iOS,
  read each asset's subtypes, including `SCREENSHOT`. ([Expo docs](https://docs.expo.dev/versions/latest/sdk/media-library/))
- With Expo Go the code is served from the Mac (`npx expo start`), so the Mac must run and share the Wi-Fi.
- The Mac can read the Mac Photos library with `osxphotos` (Python), including Apple's own ML labels
  and AI captions, and can run Apple's text recognition per photo. This only helps if iCloud Photos
  syncs the iPhone's photos to the Mac, and it does: Taras pays for iCloud and the libraries sync. ([osxphotos API](https://rhettbull.github.io/osxphotos/API_README.html))
- Closest open-source project found: sWipe (Expo, swipe to clean, Android only). ([FOSS Hack](https://fossunited.org/hack/fosshack25/p/naiadj2htq))

- `expo-media-library` 58.0.12 gives for free: media type, `duration` (sortable), `creationTime`,
  subtypes (screenshot, livePhoto, panorama, hdr and a few more). It does **not** give a burst flag or
  the file size (read in `build/legacy/MediaLibrary.d.ts`).

## Known risks

- Apple says phone photo ids can change (new iPhone, some iOS updates); then saved decisions are lost
  and kept photos show again. Too narrow to act on now.

## Open questions

- How does the phone match a photo the Mac analysed (ids differ between devices)? Likely answer, untested:
  creation time to the millisecond plus width and height. See `docs/research/photo-metadata.md`.

## Steps

1. **Swipe MVP in Expo Go, screenshots only.** Cards of screenshots; swipe right keeps, left marks for
   delete; undo; a review screen with every marked photo checked; Done deletes them.
   Checks:
   - the app opens in Expo Go on the iPhone (iOS 18.7.8);
   - it shows only screenshots, as many as the Photos "Screenshots" album;
   - swipe, undo and the review screen behave as above (session logic covered by unit tests);
   - after Done and the iOS prompt, the photos are in Recently Deleted.

   Status: **done** (2026-10-24). All four checks passed on the iPhone; the count matches the album.
   Fixed on the way: Expo login; photos did not show (React Native's Image cannot load `ph://` ids in
   Expo Go, so `PhotoImage` gets a `file://` URI first); the review check mark was invisible on light
   photos. Details in `docs/journal.md`.

2. **Remember decisions across restarts.** Today kept photos show again after the app restarts.
   Checks:
   - every swipe is saved at once, on the phone;
   - after closing and reopening, kept photos do not show again and marked ones are still marked;
   - deleted photos never come back; the saving logic is covered by unit tests.

   Status: **done** (2026-10-24). All checks passed on the iPhone. Decisions live in `decisions.json` in the
   app's documents folder; logic in `mobile/src/decisions.ts`, 6 unit tests. Details in `docs/journal.md`.

3. **Faster photos.** Each card loads the full-size file (up to a second); the review grid loads
   full-size files for small cells.
   Checks:
   - a card appears with no visible wait on the iPhone;
   - the review grid with 100+ marked photos scrolls without stutter.

   Status: **done** (2026-10-24). Taras checked on the iPhone: cards load fast, 100+ photos scroll
   smoothly. `PhotoImage` uses `expo-image`, which loads `ph://` ids at the view's size; the next card
   is loaded under the current one.

Steps 4-6 follow the three levels in `docs/research/photo-metadata.md`: what the phone knows, what
Apple's Photos on the Mac already computed, and our own model only where the first two leave a gap.

4. **Groups from phone metadata (level 1).** A start screen lists groups with their photo counts;
   tapping one opens the same swipe and review for that group only. First, log which smart and app
   albums Expo returns on the iPhone, then build: screenshots, screen recordings, videos (longest first,
   a still frame with the duration), bursts, selfies, messenger albums (WhatsApp, Telegram), the rest
   of the photos by month, oldest first.
   Checks:
   - each group's count matches its album in Photos;
   - a photo decided in one group does not show again in another;
   - grouping logic covered by unit tests.

   Status: **done** (2026-10-24). Taras checked on the iPhone: counts match Photos (checked 2-3 groups),
   a selfie kept in its month no longer shows in Selfies. The album log confirmed English titles; there
   is no Telegram album; "Recently Saved" (2572) is a smart album of photos saved from other apps.

5. **Groups from Apple's analysis on the Mac (level 2).** Two parts.
   a. Probe (needs no phone, can start any time): a Python script with osxphotos reads the Mac library,
      reports which fields are filled (quality scores, recognised text, document types, events, labels,
      and the trips and Memories Photos builds, such as "Hiking on Borzhava")
      and matches Mac photos to phone photos by creation time plus width and height.
   b. If the probe holds: the script writes `groups.json` (photo key → groups) into the app's folder,
      git-ignored because it is personal data; the app shows these groups beside level 1. First
      candidates: worst shots first, receipts and documents, events, burst frames never picked.
   Status of 5a: Mac part **done** (2026-10-24), phone match pending. Apple's fields on this Mac
   (Photos 9.6, macOS 14): quality score 100%, labels 84% ("Document" on 338 camera photos, "Receipt"
   28), recognised text 40%, named persons 21%, moments with a place title 1360 of 2286. Empty: document
   types, events, trips, AI captions, burst picks (3 burst photos only). Key (ms time + size) is unique
   for 7199 of 7276 Mac items. Details in `docs/journal.md`.
   Checks:
   - the probe matches at least 99% of phone photos to exactly one Mac photo;
   - a sample of 20 photos per new group looks right to Taras;
   - `groups.json` is never committed.

6. **Decide on our own model (level 3, CLIP).** After 4 and 5, list what is still badly grouped (for
   example memes vs invitations among screenshots, if Apple's text and labels do not split them).
   CLIP is a model that scores how well an image matches a short text ("a meme", "an invitation");
   it runs on the Mac's M1. Use it only on that gap, delivered through the same `groups.json`.
   Check: on 50 hand-labelled photos, CLIP sorts clearly better than level 1-2 alone; else drop it.
