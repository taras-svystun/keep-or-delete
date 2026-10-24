import { expect, test } from '@jest/globals';
import { buildGroups, formatDuration, Item, toGo } from './groups';

const photo = (id: string, date: Date, subtypes: string[] = []): Item => ({
  id,
  mediaType: 'image',
  creationTime: date.getTime(),
  duration: null,
  subtypes,
});
const video = (id: string, duration: number, subtypes: string[] = []): Item => ({
  id,
  mediaType: 'video',
  creationTime: new Date(2024, 0, 1).getTime(),
  duration,
  subtypes,
});

const keys = (items: Item[], albums = []) => buildGroups(items, albums).map((g) => g.key);

test('screenshots go in their own group and not in a month', () => {
  const groups = buildGroups([photo('s', new Date(2024, 0, 5), ['screenshot']), photo('p', new Date(2024, 0, 6))], []);
  expect(groups).toEqual([
    { key: 'screenshots', title: 'Screenshots', ids: ['s'] },
    { key: '2024-01', title: 'Jan 2024', ids: ['p'] },
  ]);
});

test('videos come longest first; screen recordings also get their own group', () => {
  const groups = buildGroups([video('short', 5), video('rec', 30, ['screenRecording']), video('long', 600)], []);
  expect(groups.find((g) => g.key === 'videos')?.ids).toEqual(['long', 'rec', 'short']);
  expect(groups.find((g) => g.key === 'screen-recordings')?.ids).toEqual(['rec']);
});

test('months are sorted oldest first, also across years', () => {
  const items = [photo('a', new Date(2023, 11, 31)), photo('b', new Date(2024, 1, 1)), photo('c', new Date(2023, 1, 1))];
  expect(keys(items)).toEqual(['2023-02', '2023-12', '2024-02']);
});

test('a photo with no date still gets a group, after the months', () => {
  const items: Item[] = [{ ...photo('x', new Date()), creationTime: null }, photo('a', new Date(2020, 0, 1))];
  expect(keys(items)).toEqual(['2020-01', 'no-date']);
});

test('albums come after videos and before months, in the order given; empty groups are left out', () => {
  const groups = buildGroups(
    [photo('a', new Date(2024, 0, 1))],
    [
      { title: 'Bursts', ids: ['b'] },
      { title: 'Selfies', ids: [] },
      { title: 'WhatsApp', ids: ['a'] },
    ],
  );
  expect(groups.map((g) => g.title)).toEqual(['Bursts', 'WhatsApp', 'Jan 2024']);
});

test('to go counts only photos with no decision yet', () => {
  const g = { key: 'k', title: 't', ids: ['a', 'b', 'c'] };
  expect(toGo(g, { a: 'keep', b: 'delete' })).toBe(1);
});

test('durations read as minutes and seconds', () => {
  expect(formatDuration(4.6)).toBe('0:05');
  expect(formatDuration(600)).toBe('10:00');
});
