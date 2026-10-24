import { expect, test } from '@jest/globals';
import {
  currentPhoto,
  markedForDelete,
  nextPhoto,
  remaining,
  startSession,
  swipe,
  toDelete,
  undo,
} from './session';

test('swiping walks through the photos in order', () => {
  let s = startSession(['a', 'b', 'c']);
  expect(currentPhoto(s)).toBe('a');
  s = swipe(s, 'keep');
  expect(currentPhoto(s)).toBe('b');
});

test('the next photo is the one after the current', () => {
  let s = startSession(['a', 'b']);
  expect(nextPhoto(s)).toBe('b');
  s = swipe(s, 'keep');
  expect(nextPhoto(s)).toBeNull();
});

test('only photos swiped to delete are marked', () => {
  let s = startSession(['a', 'b', 'c']);
  s = swipe(swipe(swipe(s, 'delete'), 'keep'), 'delete');
  expect(markedForDelete(s)).toEqual(['a', 'c']);
});

test('undo takes back the last swipe', () => {
  let s = startSession(['a', 'b']);
  s = undo(swipe(s, 'delete'));
  expect(currentPhoto(s)).toBe('a');
  expect(markedForDelete(s)).toEqual([]);
});

test('undo at the start changes nothing', () => {
  const s = startSession(['a']);
  expect(undo(s)).toEqual(s);
});

test('swiping past the last photo changes nothing', () => {
  const s = swipe(startSession(['a']), 'keep');
  expect(currentPhoto(s)).toBeNull();
  expect(swipe(s, 'delete')).toEqual(s);
});

test('remaining holds the photos not swiped yet', () => {
  const s = swipe(startSession(['a', 'b', 'c']), 'keep');
  expect(remaining(s)).toEqual(['b', 'c']);
});

test('unchecked photos on the review screen are spared', () => {
  expect(toDelete(['a', 'b', 'c'], new Set(['b']))).toEqual(['a', 'c']);
});
