# Ideas and backlog

Ideas for later. Nothing here is agreed or planned yet. When an idea becomes the next thing to build,
move it into `docs/PLAN.md`.

- Save the text of a meme or fact screenshot (as a note), then delete the image.
- Tell photo kinds apart: Taras, other people, landscapes.
- A smarter duplicates finder: compare image content, not only size and date.
- A way to see kept photos again (today a kept photo never shows again; the only reset is deleting the app data).
- Select text on a photo, save it as text, delete the photo (Taras, 2026-10-24). iOS Live Text needs a
  native module that Expo Go lacks, so a standalone app (Xcode, macOS upgrade). Free path: text recognised
  on the Mac (plan step 5).
- Pinch to zoom a photo before deciding (Taras, 2026-10-24). Cheap: `react-native-gesture-handler` and
  `react-native-reanimated` are in Expo Go. The pinch must not fight the swipe.
- Smarter time groups (Taras, 2026-10-24). One group per month gives 48+ groups over 4 years: old months
  hold ~10 photos, recent ones 100-200. Merge small months until a group has about 100-200 photos (for
  example "Spring 2022"). Better still for recent photos: group by trips and events, like the Memories
  iPhone Photos makes ("Hiking on Borzhava", "Holidays in the Carpathians"). Expo cannot read those;
  the Mac probe (plan step 5a) checks whether osxphotos can.
- A "Recently Saved" group: iOS smart album of photos saved from other apps (2572 on Taras's iPhone),
  likely memes and downloads. It is reachable by title, like Selfies.
