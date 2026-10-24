import { StatusBar } from 'expo-status-bar';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Decisions, recordReview, recordSession, resumeSession } from './src/decisions';
import { formatDuration, Group } from './src/groups';
import { GroupsScreen } from './src/GroupsScreen';
import { Library, loadLibrary } from './src/library';
import { ReviewScreen } from './src/ReviewScreen';
import { SwipeCard } from './src/SwipeCard';
import { currentPhoto, markedForDelete, nextPhoto, Session, startSession, swipe, undo } from './src/session';
import { loadDecisions, saveDecisions } from './src/storage';

type Phase = 'loading' | 'groups' | 'swiping' | 'review';

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [library, setLibrary] = useState<Library>({ groups: [], durations: {} });
  const [group, setGroup] = useState<Group | null>(null);
  const [session, setSession] = useState<Session>(startSession([]));
  const [message, setMessage] = useState('Loading photos…');
  // Decisions from earlier runs plus this session's, written to the phone after every change.
  const saved = useRef<Decisions>({});

  // Only swipes and undos change decisions, and both happen while swiping. Saving in other phases
  // would write back a finished session's choices over the review's.
  useEffect(() => {
    if (phase !== 'swiping') return;
    saved.current = recordSession(saved.current, session);
    saveDecisions(saved.current);
  }, [session, phase]);

  // Built from the library as it is now, so photos deleted anywhere never come back.
  const showGroups = async (msg: string) => {
    setLibrary(await loadLibrary());
    setSession(startSession([]));
    setMessage(msg);
    setPhase('groups');
  };

  useEffect(() => {
    (async () => {
      const { granted } = await requestPermissionsAsync();
      if (!granted) {
        setMessage('No access to photos. Allow it in Settings → Expo Go → Photos.');
        return;
      }
      saved.current = loadDecisions();
      await showGroups('Pick a group.');
    })().catch((e) => setMessage(`Error: ${String(e)}`));
    // showGroups only sets state, so running this once on start is right.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openGroup = (g: Group) => {
    setGroup(g);
    setSession(resumeSession(g.ids, saved.current));
    setMessage(g.title);
    setPhase('swiping');
  };

  const deletePhotos = async (ids: string[]) => {
    try {
      // iOS asks to confirm, then moves the photos to Recently Deleted.
      if (ids.length > 0) await Asset.delete(ids.map((id) => new Asset(id)));
      const spared = marked.filter((id) => !ids.includes(id));
      saved.current = recordReview(saved.current, ids, spared);
      saveDecisions(saved.current);
      await showGroups(`Deleted ${ids.length}.`);
    } catch (e) {
      setMessage(`Not deleted: ${String(e)}`);
    }
  };

  const photo = currentPhoto(session);
  const marked = markedForDelete(session);
  const label = (id: string) => (library.durations[id] ? formatDuration(library.durations[id]) : undefined);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <Text style={styles.message}>{message}</Text>
        {phase === 'groups' && <GroupsScreen groups={library.groups} saved={saved.current} onOpen={openGroup} />}
        {phase === 'swiping' && (
          <>
            {photo ? (
              <View style={styles.deck}>
                {/* Keyed by photo, so after a swipe the card underneath becomes the top one with its
                    photo already loaded. It is fully covered, so only the top card gets touches. */}
                {[nextPhoto(session), photo].map(
                  (id) =>
                    id && (
                      <SwipeCard
                        key={id}
                        photoId={id}
                        label={label(id)}
                        onSwipe={(c) => setSession((s) => swipe(s, c))}
                      />
                    ),
                )}
              </View>
            ) : (
              <Text style={styles.empty}>No more photos in {group?.title}.</Text>
            )}
            <Text style={styles.message}>
              ← delete · keep → · {session.choices.length}/{session.photoIds.length} · marked {marked.length}
            </Text>
            <View style={styles.row}>
              {/* Leaving without review keeps the marks; they show first next time in this group. */}
              <Pressable style={styles.button} onPress={() => setPhase('groups')}>
                <Text style={styles.buttonText}>Groups</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={() => setSession(undo)}>
                <Text style={styles.buttonText}>Undo</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={() => setPhase('review')}>
                <Text style={styles.buttonText}>Finish</Text>
              </Pressable>
            </View>
          </>
        )}
        {phase === 'review' && (
          <ReviewScreen marked={marked} onDone={deletePhotos} onBack={() => setPhase('swiping')} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000', padding: 16, gap: 12 },
  message: { color: '#aaa', textAlign: 'center' },
  empty: { flex: 1, color: '#fff', fontSize: 18, textAlign: 'center', textAlignVertical: 'center' },
  deck: { flex: 1 },
  row: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#333', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17 },
});
