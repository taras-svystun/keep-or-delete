# What photo metadata we can use for groups

Checked 2026-10-24. Question: which facts about a photo can group the gallery into meaningful piles
to clean, and what each costs.

Labels: **fact** = read in source or docs (linked); **estimate** = reasoned, not yet tried.

## Level 1: on the phone, in Expo Go (free, works today)

Source: `expo-media-library` 58.0.12, read in `mobile/node_modules/expo-media-library`
(`build/legacy/MediaLibrary.d.ts`, `ios/MediaLibraryUtilities.swift`, `ios/MediaLibraryModule.swift`).

Per photo, in the list call (cheap, thousands at once):

| Field | Groups it gives |
|---|---|
| `mediaType` | photos vs videos |
| `mediaSubtypes` | screenshot, livePhoto, panorama, hdr, depthEffect (portrait), highFrameRate (slo-mo), timelapse, stream, spatialMedia, videoCinematic |
| `duration` (sortable) | longest videos first: a stand-in for file size |
| `creationTime` | by month, by year, "older than N years" |
| `width`, `height` | odd sizes: images saved from messengers and the web are often small or non-camera ratios (estimate) |
| `location` (iOS: in the list call) | by place; "far from home" = trips (estimate) |
| `filename` | camera photos are `IMG_xxxx`; saved or received images often are not (estimate) |

Per photo, one extra call each (slow for thousands, fine for a few hundred):
`exif` (camera make and model: no camera means received or downloaded), `isFavorite`, `isNetworkAsset`.

Not available: file size, burst flag, cloud identifier (no `cloudIdentifier` in the module).

**iOS smart albums** (fact: `getAlbumsAsync({ includeSmartAlbums: true })` fetches every
`.smartAlbum` collection; list from [Apple, PHAssetCollectionSubtype](https://developer.apple.com/documentation/photos/phassetcollectionsubtype)):
Bursts, Screen Recordings, Selfies, Videos, Slo-mo, Time-lapse, Live Photos, Portrait (DepthEffect),
Panoramas, Long Exposures, Animated, RAW, Cinematic, Spatial, Favorites, Hidden, Recently Added,
Unable to Upload. So **bursts and screen recordings are reachable after all**, as albums. Not yet
tried on the device.

**User and app albums**: WhatsApp, Telegram, Instagram and others save into their own albums, so
"saved from WhatsApp" is a group for free (estimate: depends on Taras's settings).

**Moments** (`getMomentsAsync`): Apple's old clusters of photos by time and place, with place names.
Ready-made "events" (estimate: Apple deprecated moments in iOS 13; may return little).

## Level 2: on the Mac, through the synced iCloud library (free, needs a Mac script)

Source: [osxphotos API](https://rhettbull.github.io/osxphotos/API_README.html). Apple's Photos already
ran its own models on every photo; osxphotos reads the results from the library database.

| Field | Groups it gives |
|---|---|
| `search_info.detected_text`, `text_found` | text already recognised by Apple: invitations, tickets, memes |
| `search_info.document_types`, `id_document_types` | receipts, documents, ID cards (keep these!) |
| `search_info.events`, `event_types`, `venues`, `holidays` | concerts, weddings, events |
| `labels`, `pets`, `landmarks`, `activities` | "food", "dog", "mountain", "snowboarding" |
| `persons`, `face_info` | photos with a named person; photos of no one |
| `score.overall`, `failure`, `noise`, `well_timed_shot`, ... | **blurry, failed, boring shots first**: the strongest cleanup signal |
| `ai_caption` | a one-line description of the photo |
| `burst`, `burst_selected` | burst frames Taras never picked |
| `duplicates`, `fingerprint` | same size, date and dimensions; same file hash |
| `syndicated`, `shared` | "Shared with You" photos from messages |
| `original_filesize` | real size: biggest files first |

Many `search_info` fields need recent Photos versions (the docs mark them macOS 13+ or newer); the
Mac runs macOS 14.7.6, so most should be there (estimate).

**The bridge problem**: ids differ between devices. Apple says a local identifier is valid only on
its device, and a cloud identifier works across iCloud devices
([Apple, PHCloudIdentifier](https://developer.apple.com/documentation/photos/phcloudidentifier)), but
Expo Go cannot read cloud identifiers. Cheap way out (estimate): match on creation time to the
millisecond plus width and height, which both sides know. A collision needs two photos taken in the
same millisecond at the same size. To test: run the match on the real library and count misses.

## Level 3: our own models (later, costs effort)

CLIP-style "is this a meme / an invitation" on the Mac, or on-phone ML (needs a standalone app).
Only worth it where levels 1-2 leave a gap.

## What this means

- Level 1 alone gives about a dozen groups, more than first thought: screenshots, screen recordings,
  videos by length, bursts, selfies, live photos, messenger albums, months, places.
- The biggest jump in meaning (blurry shots, receipts, events, memes) is level 2, and it is mostly
  already computed by Apple; our cost is a Mac script and the id bridge above.
- Side finding: Apple warns local identifiers can change (device transfer, some iOS updates). Our
  `decisions.json` is keyed by them; if that happens, kept photos show again. Acceptable for now.
