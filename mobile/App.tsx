import { StatusBar } from 'expo-status-bar';
import { Asset, AssetField, MediaSubtype, Query, requestPermissionsAsync } from 'expo-media-library';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ReviewScreen } from './src/ReviewScreen';
import { SwipeCard } from './src/SwipeCard';
import { currentPhoto, markedForDelete, remaining, Session, startSession, swipe, undo } from './src/session';

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

  useEffect(() => {
    (async () => {
      const { granted } = await requestPermissionsAsync();
      if (!granted) {
        setMessage('No access to photos. Allow it in Settings → Expo Go → Photos.');
        return;
      }
      const ids = await loadScreenshots();
      setSession(startSession(ids));
      setMessage(`${ids.length} screenshots found.`);
      setPhase('swiping');
    })().catch((e) => setMessage(`Error: ${String(e)}`));
  }, []);

  const deletePhotos = async (ids: string[]) => {
    try {
      // iOS asks to confirm, then moves the photos to Recently Deleted.
      if (ids.length > 0) await Asset.delete(ids.map((id) => new Asset(id)));
      setMessage(`Deleted ${ids.length}. ${remaining(session).length} screenshots left.`);
      setSession(startSession(remaining(session)));
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
              <SwipeCard key={photo} photoId={photo} onSwipe={(c) => setSession((s) => swipe(s, c))} />
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
  row: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#333', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 17 },
});
