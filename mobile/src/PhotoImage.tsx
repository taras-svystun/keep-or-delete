import { Image, ImageProps } from 'expo-image';
import { Asset } from 'expo-media-library';
import { useEffect, useRef } from 'react';
import { macKey } from './mac';

// expo-image loads ph:// photo ids itself, at the size of the view (a small cell gets a small
// image, not the full file). Memory cache only: the photos are already on the phone, so a disk
// cache would just keep extra copies of them.
export function PhotoImage({ photoId, ...props }: { photoId: string } & Omit<ImageProps, 'source'>) {
  // Diagnosis of photos that stay black (step 5b): logs in the `expo start` terminal why a photo
  // failed, or that it is still loading after 10 s, with what the phone knows about it. The key
  // finds the photo in groups.json on the Mac.
  const loaded = useRef(false);
  const progress = useRef<number | null>(null);
  useEffect(() => {
    loaded.current = false;
    progress.current = null;
    const timer = setTimeout(() => !loaded.current && logStalled(photoId, progress.current), 10000);
    return () => clearTimeout(timer);
  }, [photoId]);

  return (
    <Image
      {...props}
      source={{ uri: photoId }}
      cachePolicy="memory"
      onProgress={(e) => (progress.current = Math.round((100 * e.loaded) / e.total))}
      onLoad={() => (loaded.current = true)}
      onError={(e) => {
        loaded.current = true;
        console.log(`Photo failed: ${photoId}: ${e.error}`);
      }}
    />
  );
}

async function logStalled(photoId: string, progress: number | null) {
  const asset = new Asset(photoId);
  const [info, inCloud] = await Promise.all([asset.getInfo(), asset.getIsInCloud()]).catch((e) => {
    console.log(`Photo still loading after 10 s: ${photoId} (no info: ${String(e)})`);
    return [null, null];
  });
  if (!info) return;
  console.log(
    `Photo still loading after 10 s: ${photoId} ${info.filename} ${info.mediaType} ` +
      `${info.width}x${info.height} key ${macKey(info)} in iCloud ${inCloud} ` +
      `downloaded ${progress === null ? 'no progress reported' : `${progress}%`}`,
  );
}
