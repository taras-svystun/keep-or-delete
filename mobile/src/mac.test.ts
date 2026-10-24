import { expect, test } from '@jest/globals';
import { macGroups, macKey, MacFile, matchCounts } from './mac';

const shape = (creationTime: number | null, width = 4032, height = 3024) => ({ creationTime, width, height });
const photo = (id: string, creationTime: number | null, width = 4032) => ({ id, ...shape(creationTime, width) });
const mac = (photos: string[], shared: string[] = [], groups: MacFile['groups'] = []): MacFile => ({
  photos,
  shared,
  groups,
});

test('the key is whole milliseconds, then width x height, as mac/probe.py writes it', () => {
  expect(macKey(shape(1700000000123))).toBe('1700000000123:4032x3024');
  expect(macKey(shape(null))).toBeNull();
});

test('a photo matches one Mac photo, none, or several that share its key', () => {
  const file = mac(['1:4032x3024', '2:4032x3024'], ['2:4032x3024']);
  const shapes = [shape(1), shape(2), shape(3), shape(1, 3024, 4032), shape(null)];
  expect(matchCounts(shapes, file)).toEqual({ one: 1, several: 1, none: 3 });
});

test("the Mac's groups become phone ids in the Mac's order", () => {
  const file = mac(['1:4032x3024', '2:4032x3024'], [], [{ title: 'Worst shots first', keys: ['2:4032x3024', '1:4032x3024'] }]);
  expect(macGroups([photo('a', 1), photo('b', 2)], file)).toEqual([
    { key: 'mac:0', title: 'Worst shots first', ids: ['b', 'a'] },
  ]);
});

test('a key several phone or Mac photos share is left out, and so are empty groups', () => {
  const file = mac(['1:4032x3024', '2:4032x3024', '3:4032x3024'], ['3:4032x3024'], [
    { title: 'Photos with text', keys: ['1:4032x3024', '2:4032x3024', '3:4032x3024'] },
    { title: 'Not on the phone', keys: ['9:4032x3024'] },
  ]);
  const phone = [photo('a', 1), photo('b', 2), photo('b2', 2), photo('c', 3), photo('x', null)];
  expect(macGroups(phone, file)).toEqual([{ key: 'mac:0', title: 'Photos with text', ids: ['a'] }]);
});
