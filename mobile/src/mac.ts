// The bridge to the Mac: photos there were analysed by Apple's Photos and written to groups.json by
// mac/probe.py. Ids differ between devices, so a photo is found by a key both sides know.

// What the phone knows about a photo that the Mac knows too.
export type Shape = { creationTime: number | null; width: number | null; height: number | null };

// groups.json: every Mac photo by key, with its groups; keys more than one Mac photo has are in shared.
export type MacFile = { photos: Record<string, string[]>; shared: string[] };

// Creation time in whole milliseconds, then width x height: the same string mac/probe.py builds.
export function macKey(s: Shape): string | null {
  return s.creationTime === null ? null : `${s.creationTime}:${s.width}x${s.height}`;
}

export type Match = 'one' | 'none' | 'several';

export function match(s: Shape, mac: MacFile, shared = new Set(mac.shared)): Match {
  const key = macKey(s);
  if (key === null || !(key in mac.photos)) return 'none';
  return shared.has(key) ? 'several' : 'one';
}

// How many phone photos find exactly one Mac photo, none, or several.
export function matchCounts(shapes: Shape[], mac: MacFile): Record<Match, number> {
  const shared = new Set(mac.shared);
  const counts = { one: 0, none: 0, several: 0 };
  for (const s of shapes) counts[match(s, mac, shared)]++;
  return counts;
}
