import { expect, test } from '@jest/globals';
import { recordReview, recordSession, resumeSession } from './decisions';
import { currentPhoto, markedForDelete, startSession, swipe, undo } from './session';

test('kept photos do not show again, marked ones are still marked', () => {
  const s = resumeSession(['a', 'b', 'c', 'd'], { a: 'keep', c: 'delete' });
  expect(markedForDelete(s)).toEqual(['c']);
  expect(currentPhoto(s)).toBe('b');
  expect(s.photoIds).not.toContain('a');
});

test('photos gone from the library are dropped', () => {
  const s = resumeSession(['b'], { a: 'delete' });
  expect(s.photoIds).toEqual(['b']);
  expect(markedForDelete(s)).toEqual([]);
});

test('a restart gives back the same swipes', () => {
  const s = swipe(swipe(startSession(['a', 'b', 'c']), 'keep'), 'delete');
  const resumed = resumeSession(['a', 'b', 'c'], recordSession({}, s));
  expect(markedForDelete(resumed)).toEqual(['b']);
  expect(currentPhoto(resumed)).toBe('c');
});

test('an undone swipe is forgotten', () => {
  const s = undo(swipe(startSession(['a']), 'delete'));
  expect(recordSession({ a: 'delete' }, s)).toEqual({});
});

test('choices from earlier runs survive', () => {
  const s = swipe(startSession(['b']), 'delete');
  expect(recordSession({ a: 'keep' }, s)).toEqual({ a: 'keep', b: 'delete' });
});

test('after Done deleted photos are forgotten and spared ones kept', () => {
  const saved = { a: 'delete', b: 'delete', c: 'keep' } as const;
  expect(recordReview(saved, ['a'], ['b'])).toEqual({ b: 'keep', c: 'keep' });
});
