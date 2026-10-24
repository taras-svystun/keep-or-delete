import { Image, ImageProps } from 'expo-image';
import { useEffect, useRef } from 'react';

// expo-image loads ph:// photo ids itself, at the size of the view (a small cell gets a small
// image, not the full file). Memory cache only: the photos are already on the phone, so a disk
// cache would just keep extra copies of them.
export function PhotoImage({ photoId, ...props }: { photoId: string } & Omit<ImageProps, 'source'>) {
  // Diagnosis of photos that stay black (step 5b): logs in the `expo start` terminal why a photo
  // failed, or that it is still loading after 10 s.
  const loaded = useRef(false);
  useEffect(() => {
    loaded.current = false;
    const timer = setTimeout(() => !loaded.current && console.log(`Photo still loading after 10 s: ${photoId}`), 10000);
    return () => clearTimeout(timer);
  }, [photoId]);

  return (
    <Image
      {...props}
      source={{ uri: photoId }}
      cachePolicy="memory"
      onLoad={() => (loaded.current = true)}
      onError={(e) => {
        loaded.current = true;
        console.log(`Photo failed: ${photoId}: ${e.error}`);
      }}
    />
  );
}
