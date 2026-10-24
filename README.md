# Keep or Delete

Clean your iPhone photo gallery Tinder-style: swipe right to keep a photo, left to delete it.
Status: MVP, screenshots only. See `docs/PLAN.md`.

## Run on the iPhone

Once: install **Expo Go** from the App Store on the iPhone. The Mac and the iPhone must share the same Wi-Fi.

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the iPhone camera; it opens the app in Expo Go. Allow access to all photos.

## Groups from the Mac (plan step 5)

Apple's Photos on the Mac already analysed every photo (quality scores, labels, recognised text).
A script reads that and serves it to the app on the home Wi-Fi. The Mac library must sync with the
iPhone through iCloud Photos.

```bash
python3 -m venv mac/.venv && mac/.venv/bin/pip install osxphotos   # once
mac/.venv/bin/python mac/probe.py                                  # report; writes mac/out/ (git-ignored)
mac/.venv/bin/python -m http.server 8765 -d mac/out/public         # leave running beside expo start
```

The app logs in the `expo start` terminal how many phone photos match a Mac photo. `mac/out/` is
personal data: never commit it. The server shares `mac/out/public/` with anyone on the same Wi-Fi.

## Test

```bash
cd mobile
npm test            # session logic
npx tsc --noEmit    # typecheck
npx expo-doctor     # Expo setup check
```
