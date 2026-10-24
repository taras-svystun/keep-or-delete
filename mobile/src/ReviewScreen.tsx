import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { PhotoImage } from './PhotoImage';
import { toDelete } from './session';

// End of a session: every marked photo is checked; tap one to spare it, then press Done.
export function ReviewScreen({
  marked,
  onDone,
  onBack,
}: {
  marked: string[];
  onDone: (ids: string[]) => void;
  onBack: () => void;
}) {
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const ids = toDelete(marked, unchecked);

  const toggle = (id: string) =>
    setUnchecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Delete {ids.length} of {marked.length}?</Text>
      <FlatList
        data={marked}
        numColumns={3}
        keyExtractor={(id) => id}
        renderItem={({ item }) => (
          <Pressable style={styles.cell} onPress={() => toggle(item)}>
            <PhotoImage photoId={item} style={[styles.thumb, unchecked.has(item) && styles.spared]} />
            {/* A filled badge with a white ring stays visible on any photo, light or dark. */}
            <View style={[styles.badge, !unchecked.has(item) && styles.badgeOn]}>
              {!unchecked.has(item) && <Text style={styles.check}>✓</Text>}
            </View>
          </Pressable>
        )}
      />
      <View style={styles.row}>
        <Pressable style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.danger]} onPress={() => onDone(ids)}>
          <Text style={styles.buttonText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, gap: 12 },
  title: { color: '#fff', fontSize: 20, textAlign: 'center' },
  cell: { flex: 1 / 3, aspectRatio: 1, padding: 2 },
  thumb: { flex: 1, borderRadius: 6 },
  spared: { opacity: 0.3 },
  badge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOn: { backgroundColor: '#c0392b' },
  check: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  row: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#333', alignItems: 'center' },
  danger: { backgroundColor: '#c0392b' },
  buttonText: { color: '#fff', fontSize: 17 },
});
