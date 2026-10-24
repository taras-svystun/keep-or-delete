// The bridge to the Mac: photos there were analysed by Apple's Photos and written to groups.json by
// mac/probe.py. Ids differ between devices, so a photo is found by a key both sides know.

import type { Group } from './groups';

// What the phone knows about a photo that the Mac knows too.
export type Shape = { creationTime: number | null; width: number | null; height: number | null };

// groups.json: every Mac photo's key, the keys more than one Mac photo has, and the groups, each
// with its keys in the order the cards show.
export type MacFile = { photos: string[]; shared: string[]; groups: { title: string; keys: string[] }[] };

// Creation time in whole milliseconds, then width x height: the same string mac/probe.py builds.
export function macKey(s: Shape): string | null {
  return s.creationTime === null ? null : `${s.creationTime}:${s.width}x${s.height}`;
}

export type Match = 'one' | 'none' | 'several';

// How many phone photos find exactly one Mac photo, none, or several.
export function matchCounts(shapes: Shape[], mac: MacFile): Record<Match, number> {
  const all = new Set(mac.photos);
  const shared = new Set(mac.shared);
  const counts = { one: 0, none: 0, several: 0 };
  for (const s of shapes) {
    const key = macKey(s);
    counts[key === null || !all.has(key) ? 'none' : shared.has(key) ? 'several' : 'one']++;
  }
  return counts;
}

// The Mac's groups as phone photo ids. A photo whose key several phone or Mac photos have is left
// out: it could be the wrong one. Empty groups are left out.
export function macGroups(photos: (Shape & { id: string })[], mac: MacFile): Group[] {
  const ids = new Map<string, string>();
  const shared = new Set(mac.shared);
  for (const p of photos) {
    const key = macKey(p);
    if (key === null) continue;
    if (ids.has(key)) shared.add(key);
    ids.set(key, p.id);
  }
  return mac.groups
    .map((g, n) => ({
      key: `mac:${n}`,
      title: g.title,
      ids: g.keys.filter((k) => !shared.has(k) && ids.has(k)).map((k) => ids.get(k)!),
    }))
    .filter((g) => g.ids.length > 0);
}
