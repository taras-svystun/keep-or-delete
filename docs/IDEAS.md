# Ideas and backlog

Ideas for later. Nothing here is agreed or planned yet. When an idea becomes the next thing to build,
move it into `docs/PLAN.md`.

- Save the text of a meme or fact screenshot (as a note), then delete the image.
- Tell photo kinds apart: Taras, other people, landscapes.
- Use Apple's ML labels and captions from the Mac Photos library (`osxphotos`) to build groups.
- Run a small local model on the Mac (for example CLIP, which matches images to text like
  "invitation" or "meme") and send its results to the phone over the home Wi-Fi.
- A smarter duplicates finder: compare image content, not only size and date.
- A way to see kept photos again (today a kept photo never shows again; the only reset is deleting the app data).
- Split screenshots into events/invitations and memes/facts. Needs text recognition on the Mac, and the
  open question of matching Mac photo ids to phone ids.
- Select text on a photo, save it as text, delete the photo (Taras, 2026-10-24). iOS Live Text needs a
  native module that Expo Go lacks, so a standalone app (Xcode, macOS upgrade). Free path: text recognised
  on the Mac (see above).
- Pinch to zoom a photo before deciding (Taras, 2026-10-24). Cheap: `react-native-gesture-handler` and
  `react-native-reanimated` are in Expo Go. The pinch must not fight the swipe.
- Mac level groups (see `docs/research/photo-metadata.md`): worst shots first by Apple's quality score,
  receipts and documents, events, burst frames never picked, Shared with You.
