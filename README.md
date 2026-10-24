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

## Test

```bash
cd mobile
npm test            # session logic
npx tsc --noEmit    # typecheck
npx expo-doctor     # Expo setup check
```
