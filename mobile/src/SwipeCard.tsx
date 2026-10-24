import { useRef } from 'react';
import { Animated, Dimensions, Image, PanResponder, StyleSheet } from 'react-native';
import type { Choice } from './session';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

// One photo card. Drag right past the threshold to keep, left to delete; a short drag springs back.
export function SwipeCard({ photoId, onSwipe }: { photoId: string; onSwipe: (c: Choice) => void }) {
  const x = useRef(new Animated.Value(0)).current;
  // The responder is created once, so it reads the latest callback through a ref.
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderMove: (_, g) => x.setValue(g.dx),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < SWIPE_THRESHOLD) {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
          return;
        }
        const choice: Choice = g.dx > 0 ? 'keep' : 'delete';
        Animated.timing(x, {
          toValue: Math.sign(g.dx) * SCREEN_WIDTH * 1.5,
          duration: 150,
          useNativeDriver: true,
        }).start(() => onSwipeRef.current(choice));
      },
    }),
  ).current;

  const rotate = x.interpolate({ inputRange: [-SCREEN_WIDTH, SCREEN_WIDTH], outputRange: ['-15deg', '15deg'] });

  return (
    <Animated.View style={[styles.card, { transform: [{ translateX: x }, { rotate }] }]} {...pan.panHandlers}>
      {/* expo-media-library lets Image load iOS photos by their ph:// id. */}
      <Image source={{ uri: photoId }} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111' },
  image: { flex: 1 },
});
