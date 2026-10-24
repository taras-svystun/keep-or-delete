import { Asset } from 'expo-media-library';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, View } from 'react-native';

// React Native's Image has no loader for ph:// photo ids in Expo Go, so ask
// the media library for a file:// URI of the photo first, then show that.
export function PhotoImage({ photoId, ...props }: { photoId: string } & Omit<ImageProps, 'source'>) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    new Asset(photoId)
      .getUri()
      .then((u) => alive && setUri(u))
      .catch((e) => console.warn(`No URI for ${photoId}: ${String(e)}`));
    return () => {
      alive = false;
    };
  }, [photoId]);

  if (!uri) {
    return (
      <View style={[props.style, { justifyContent: 'center' }]}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Image {...props} source={{ uri }} />;
}
