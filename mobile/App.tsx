import { StatusBar } from 'expo-status-bar';
import { Asset, AssetField, MediaSubtype, Query, requestPermissionsAsync } from 'expo-media-library';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Decisions, recordReview, recordSession, resumeSession } from './src/decisions';
import { ReviewScreen } from './src/ReviewScreen';
import { SwipeCard } from './src/SwipeCard';
import { currentPhoto, markedForDelete, nextPhoto, Session, startSession, swipe, undo } from './src/session';
import { loadDecisions, saveDecisions } from './src/storage';

type Phase = 'loading' | 'swiping' | 'review';

// Screenshots only for the MVP, oldest first.
async function loadScreenshots(): Promise<string[]> {
  const assets = await new Query()
    .contains(AssetField.MEDIA_SUBTYPES, MediaSubtype.SCREENSHOT)
    .orderBy({ key: AssetField.CREATION_TIME, ascending: true })
    .exeForMetadata();
  return assets.map((a) => a.id);
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [session, setSession] = useState<Session>(startSession([]));
  const [message, setMessage] = useState('Loading screenshots…');
  // Decisions from earlier runs plus this session's, written to the phone after every change.
  const saved = useRef<Decisions>({});

  useEffect(() => {
    if (phase === 'loading') return;
    saved.current = recordSession(saved.current, session);
    saveDecisions(saved.current);
  }, [session, phase]);

  // Resumes from the library as it is now, so photos deleted anywhere never come back.
  const resume = async (): Promise<Session> => resumeSession(await loadScreenshots(), saved.current);

  useEffect(() => {
    (async () => {
      const { granted } = await requestPermissionsAsync();
      if (!granted) {
        setMessage('No access to photos. Allow it in Settings → Expo Go → Photos.');
        return;
      }
      saved.current = loadDecisions();
      const s = await resume();
      setSession(s);
      setMessage(`${s.photoIds.length} screenshots to go through.`);
      setPhase('swiping');
    })().catch((e) => setMessage(`Error: ${String(e)}`));
  }, []);

  const deletePhotos = async (ids: string[]) => {
    try {
      // iOS asks to confirm, then moves the photos to Recently Deleted.
      if (ids.length > 0) await Asset.delete(ids.map((id) => new Asset(id)));
      const spared = marked.filter((id) => !ids.includes(id));
      saved.current = recordReview(saved.current, ids, spared);
      saveDecisions(saved.current);
      const s = await resume();
      setMessage(`Deleted ${ids.length}. ${s.photoIds.length} screenshots left.`);
      setSession(s);
      setPhase('swiping');
    } catch (e) {
      setMessage(`Not deleted: ${String(e)}`);
    }
  };

  const photo = currentPhoto(session);
  const marked = markedForDelete(session);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <Text style={styles.message}>{message}</Text>
        {phase === 'swiping' && (
          <>
            {photo ? (
              <View style={styles.deck}>
                {/* Keyed by photo, so after a swipe the card underneath becomes the top one with its
                    photo already loaded. It is fully covered, so only the top card gets touches. */}
                {[nextPhoto(session), photo].map(
                  (id) =>
                    id && <SwipeCard key={id} photoId={id} onSwipe={(c) => setSession((s) => swipe(s, c))} />,
                )}
              </View>
            ) : (
              <Text style={styles.empty}>No more screenshots in this session.</Text>
            )}
            <Text style={styles.message}>
              ← delete · keep → · {session.choices.length}/{session.photoIds.length} · marked {marked.length}
            </Text>
            <View style={styles.row}>
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
