// Session logic, kept free of React Native so it can be unit-tested.

export type Choice = 'keep' | 'delete';

// choices[i] is the choice made for photoIds[i]; its length is how far the swiping got.
export type Session = { photoIds: string[]; choices: Choice[] };

export function startSession(photoIds: string[]): Session {
  return { photoIds, choices: [] };
}

export function currentPhoto(s: Session): string | null {
  return s.photoIds[s.choices.length] ?? null;
}

// The photo under the current card, loaded ahead so it shows at once after a swipe.
export function nextPhoto(s: Session): string | null {
  return s.photoIds[s.choices.length + 1] ?? null;
}

export function swipe(s: Session, choice: Choice): Session {
  if (currentPhoto(s) === null) return s;
  return { ...s, choices: [...s.choices, choice] };
}

export function undo(s: Session): Session {
  return { ...s, choices: s.choices.slice(0, -1) };
}

export function markedForDelete(s: Session): string[] {
  return s.photoIds.filter((_, i) => s.choices[i] === 'delete');
}

// Photos not swiped yet, to start the next session with.
export function remaining(s: Session): string[] {
  return s.photoIds.slice(s.choices.length);
}

// On the review screen every marked photo starts checked; unchecked ones are spared.
export function toDelete(marked: string[], unchecked: Set<string>): string[] {
  return marked.filter((id) => !unchecked.has(id));
}
