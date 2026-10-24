// Decisions saved across app restarts, kept free of React Native so they can be unit-tested.

import { Choice, Session } from './session';

// Photo id → the choice made for it. A photo with no entry has not been swiped yet.
export type Decisions = Record<string, Choice>;

// Marked photos come first, still marked, so they reach the review screen; kept photos are left out.
// Ids gone from the library (deleted outside the app) are dropped by building from libraryIds.
export function resumeSession(libraryIds: string[], saved: Decisions): Session {
  const marked = libraryIds.filter((id) => saved[id] === 'delete');
  const fresh = libraryIds.filter((id) => saved[id] === undefined);
  return { photoIds: [...marked, ...fresh], choices: marked.map(() => 'delete') };
}

// The session's choices win over saved ones; a photo whose swipe was undone loses its entry.
export function recordSession(saved: Decisions, s: Session): Decisions {
  const next = { ...saved };
  s.photoIds.forEach((id, i) => {
    if (s.choices[i]) next[id] = s.choices[i];
    else delete next[id];
  });
  return next;
}

// After Done: deleted photos are forgotten, photos unchecked on the review screen are kept.
export function recordReview(saved: Decisions, deleted: string[], spared: string[]): Decisions {
  const next = { ...saved };
  for (const id of deleted) delete next[id];
  for (const id of spared) next[id] = 'keep';
  return next;
}
