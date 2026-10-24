import { Image, ImageProps } from 'expo-image';

// expo-image loads ph:// photo ids itself, at the size of the view (a small cell gets a small
// image, not the full file). Memory cache only: the photos are already on the phone, so a disk
// cache would just keep extra copies of them.
export function PhotoImage({ photoId, ...props }: { photoId: string } & Omit<ImageProps, 'source'>) {
  return <Image {...props} source={{ uri: photoId }} cachePolicy="memory" />;
}
