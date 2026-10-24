import { useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text } from 'react-native';
import { PhotoImage } from './PhotoImage';
import type { Choice } from './session';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

// One photo card. Drag right past the threshold to keep, left to delete; a short drag springs back.
// A video shows as a still frame, with its duration as the label.
export function SwipeCard({
  photoId,
  label,
  onSwipe,
}: {
  photoId: string;
  label?: string;
  onSwipe: (c: Choice) => void;
}) {
  const [x] = useState(() => new Animated.Value(0));
  // The responder is created once and keeps the first onSwipe. That is safe: each photo gets a new
  // card (key={photo}), and the caller updates state with a function, so it never reads stale state.

  const [pan] = useState(() =>
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
        }).start(() => onSwipe(choice));
      },
    }),
  );

  const rotate = x.interpolate({ inputRange: [-SCREEN_WIDTH, SCREEN_WIDTH], outputRange: ['-15deg', '15deg'] });

  return (
    <Animated.View style={[styles.card, { transform: [{ translateX: x }, { rotate }] }]} {...pan.panHandlers}>
      <PhotoImage photoId={photoId} style={styles.image} contentFit="contain" />
      {label && <Text style={styles.label}>{label}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Cards fill the same box and stack; the last one rendered is on top.
  card: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 16, overflow: 'hidden', backgroundColor: '#111' },
  image: { flex: 1 },
  label: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#fff',
    fontSize: 17,
  },
});
