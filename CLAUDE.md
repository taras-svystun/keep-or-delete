# Keep or Delete

An iPhone app to clean the photo gallery Tinder-style: swipe each photo to keep it or delete it.

- `GLOSSARY.md`: the project's words. Use them in code, docs and commits.
- `docs/PLAN.md`: the idea, the plan and what we agreed. Read it when starting a step.
- `docs/IDEAS.md`: ideas and backlog for later. Add new ideas here, not to the plan.
- `mobile/`: the Expo app. `mobile/AGENTS.md` has Expo's rules: read it before touching Expo APIs (we skip its Expo Router rule while the app has one screen).
- `docs/journal.md`: what each finished step did and why.
- `docs/adr/`: decisions that are hard to undo (created when the first one is needed). Read before changing the stack or how photos get deleted.

## Users and where it runs

Taras first, on his own iPhone. Whether others will use it is still open (see `docs/PLAN.md`).

## Finishing a step

Tests come with the first code. The app must never delete a photo without the user confirming it.
