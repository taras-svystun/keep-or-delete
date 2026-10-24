import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import type { Decisions } from './decisions';
import { Group, toGo } from './groups';

// The start screen: every group with how many photos are left to swipe; tap one to go through it.
export function GroupsScreen({
  groups,
  saved,
  onOpen,
}: {
  groups: Group[];
  saved: Decisions;
  onOpen: (g: Group) => void;
}) {
  return (
    <FlatList
      data={groups}
      keyExtractor={(g) => g.key}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const left = toGo(item, saved);
        return (
          <Pressable style={[styles.row, left === 0 && styles.done]} onPress={() => onOpen(item)}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.count}>
              {left} to go · {item.ids.length}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#222',
  },
  done: { opacity: 0.4 },
  title: { color: '#fff', fontSize: 17 },
  count: { color: '#aaa', fontSize: 15 },
});
