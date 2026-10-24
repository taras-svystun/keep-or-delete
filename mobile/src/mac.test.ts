import { expect, test } from '@jest/globals';
import { macKey, MacFile, matchCounts } from './mac';

const shape = (creationTime: number | null, width = 4032, height = 3024) => ({ creationTime, width, height });

test('the key is whole milliseconds, then width x height, as mac/probe.py writes it', () => {
  expect(macKey(shape(1700000000123))).toBe('1700000000123:4032x3024');
  expect(macKey(shape(null))).toBeNull();
});

test('a photo matches one Mac photo, none, or several that share its key', () => {
  const mac: MacFile = { photos: { '1:4032x3024': [], '2:4032x3024': ['Worst shots'] }, shared: ['2:4032x3024'] };
  const shapes = [shape(1), shape(2), shape(3), shape(1, 3024, 4032), shape(null)];
  expect(matchCounts(shapes, mac)).toEqual({ one: 1, several: 1, none: 3 });
});
