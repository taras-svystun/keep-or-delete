// Groups of photos to go through one at a time, kept free of React Native so they can be unit-tested.

import type { Decisions } from './decisions';

// What the phone tells about one photo or video, read cheaply for the whole library at once.
export type Item = {
  id: string;
  mediaType: 'image' | 'video';
  creationTime: number | null;
  duration: number | null;
  subtypes: string[];
};

// An album read from the phone, its photos already in the order to show.
export type AlbumIds = { title: string; ids: string[] };

// ids are in the order the cards show. A photo can be in several groups; decisions are shared, so a
// photo decided in one group does not show again in another.
export type Group = { key: string; title: string; ids: string[] };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// items come oldest first. Order on the start screen: screenshots (usually outdated, so first),
// screen recordings, videos longest first (duration stands in for file size), the albums as given,
// then the other photos by month, oldest first. Empty groups are left out.
export function buildGroups(items: Item[], albums: AlbumIds[]): Group[] {
  const images = items.filter((i) => i.mediaType === 'image');
  const videos = items.filter((i) => i.mediaType === 'video');
  const isScreenshot = (i: Item) => i.subtypes.includes('screenshot');

  const months = new Map<string, Group>();
  for (const i of images.filter((i) => !isScreenshot(i))) {
    const d = i.creationTime === null ? null : new Date(i.creationTime);
    // Zero-padded month, so the keys sort in time order.
    const key = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : 'no-date';
    const title = d ? `${MONTHS[d.getMonth()]} ${d.getFullYear()}` : 'No date';
    if (!months.has(key)) months.set(key, { key, title, ids: [] });
    months.get(key)!.ids.push(i.id);
  }

  const groups: Group[] = [
    { key: 'screenshots', title: 'Screenshots', ids: images.filter(isScreenshot).map((i) => i.id) },
    {
      key: 'screen-recordings',
      title: 'Screen recordings',
      ids: videos.filter((i) => i.subtypes.includes('screenRecording')).map((i) => i.id),
    },
    {
      key: 'videos',
      title: 'Videos, longest first',
      ids: [...videos].sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0)).map((i) => i.id),
    },
    // The index keeps keys unique when two albums share a title.
    ...albums.map((a, n) => ({ key: `album:${n}`, title: a.title, ids: a.ids })),
    ...[...months.values()].sort((a, b) => a.key.localeCompare(b.key)),
  ];
  return groups.filter((g) => g.ids.length > 0);
}

// Photos in the group not swiped yet.
export function toGo(g: Group, saved: Decisions): number {
  return g.ids.filter((id) => saved[id] === undefined).length;
}

// Seconds to "m:ss", shown on a video's card.
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
