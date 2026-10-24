// Reads the phone's photo library and builds the groups.

import Constants from 'expo-constants';
import { Album, AssetField, MediaType, Query, SortDescriptor } from 'expo-media-library';
import { AlbumIds, buildGroups, Group, Item } from './groups';
import { macKey, MacFile, match, matchCounts, Shape } from './mac';

export type Library = { groups: Group[]; durations: Record<string, number> };

// iOS smart albums with no media subtype to query instead. Expo returns titles, not album kinds, so
// they are matched by title (English, the language Expo Go shows them in: estimate, see the log).
const SMART_ALBUMS = ['Bursts', 'Selfies'];
// Apps that save the photos they receive into an album of their own.
const MESSENGERS = /whatsapp|telegram|instagram|viber|signal|messenger/i;

const oldestFirst: SortDescriptor = { key: AssetField.CREATION_TIME, ascending: true };

export async function loadLibrary(): Promise<Library> {
  const assets = await new Query().orderBy(oldestFirst).exeForMetadata();
  const items: Item[] = assets
    .filter((a) => a.mediaType === MediaType.IMAGE || a.mediaType === MediaType.VIDEO)
    .map((a) => ({
      id: a.id,
      mediaType: a.mediaType === MediaType.VIDEO ? 'video' : 'image',
      creationTime: a.creationTime,
      duration: a.duration,
      subtypes: a.mediaSubtypes ?? [],
    }));
  // Not awaited: the check only logs, so the groups need not wait for the Mac.
  logMacMatch(assets.filter((a) => a.mediaType === MediaType.IMAGE || a.mediaType === MediaType.VIDEO));

  const smart = await Promise.all(
    (await Album.getSmartAlbums()).map(async (album) => ({ album, title: await album.getTitle().catch(() => '') })),
  );
  const user = (await Album.getAlbumsMetadata()).map((m) => ({ album: new Album(m.id), title: m.title }));
  await logAlbums([...smart, ...user]);

  const wanted = [
    ...SMART_ALBUMS.flatMap((t) => smart.filter((s) => s.title === t)),
    ...user.filter((u) => MESSENGERS.test(u.title)),
  ];
  const albums: AlbumIds[] = await Promise.all(
    wanted.map(async ({ album, title }) => ({
      title,
      ids: (await new Query().album(album).orderBy(oldestFirst).exeForMetadata()).map((a) => a.id),
    })),
  );

  const durations: Record<string, number> = {};
  for (const i of items) if (i.duration) durations[i.id] = i.duration;
  return { groups: buildGroups(items, albums), durations };
}

// Shows in the terminal running `npx expo start`: every album title and its count, to match by
// title and to compare counts with the Photos app.
async function logAlbums(albums: { album: Album; title: string }[]) {
  const counts = await Promise.all(albums.map((a) => a.album.getAssetCount().catch(() => -1)));
  console.log(`Albums:\n${albums.map((a, i) => `  ${a.title}: ${counts[i]}`).join('\n')}`);
}

// The Mac serves groups.json on the same address as the dev server, port 8765 (see README).
async function fetchMacFile(): Promise<MacFile> {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (!host) throw new Error('no dev server address');
  // A Mac that is off the Wi-Fi would leave the request hanging.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), 5000);
  try {
    const res = await fetch(`http://${host}:8765/groups.json`, { signal: abort.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as MacFile;
  } finally {
    clearTimeout(timer);
  }
}

// Shows in the terminal how many phone photos find exactly one Mac photo, plus a few that find none.
async function logMacMatch(shapes: Shape[]) {
  try {
    const mac = await fetchMacFile();
    const c = matchCounts(shapes, mac);
    const missing = shapes.filter((s) => match(s, mac) === 'none').slice(0, 5);
    console.log(
      `Mac match of ${shapes.length} phone items (Mac has ${Object.keys(mac.photos).length} keys): ` +
        `one ${c.one}, none ${c.none}, several ${c.several}. No match, first few: ${missing.map(macKey).join(', ')}`,
    );
  } catch (e) {
    console.log(`Mac match: no groups.json from the Mac (${String(e)})`);
  }
}
