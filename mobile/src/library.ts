// Reads the phone's photo library and builds the groups.

import { Album, AssetField, MediaType, Query, SortDescriptor } from 'expo-media-library';
import { AlbumIds, buildGroups, Group, Item } from './groups';

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
