import { useWorkoutStore } from '@/store/workoutStore';
import type { WorkoutItem } from '@/types/workout';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddWorkout() {
  const draft = useWorkoutStore((s) => s.draft);
  const history = useWorkoutStore((s) => s.history);
  const startDraft = useWorkoutStore((s) => s.startDraft);
  const setDraftName = useWorkoutStore((s) => s.setDraftName);
  const addNote = useWorkoutStore((s) => s.addNote);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const addCustom = useWorkoutStore((s) => s.addCustom);
  const elapsedSeconds = useWorkoutStore((s) => s.elapsedSeconds);
  const pause = useWorkoutStore((s) => (s as any).pause);
  const resume = useWorkoutStore((s) => (s as any).resume);
  // const finishAndSave = useWorkoutStore((s) => s.finishAndSave); // disabled for now

  useEffect(() => {
    if (!draft) startDraft('');
  }, [draft, startDraft]);

  // live tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mmss = useMemo(() => {
    const total = elapsedSeconds();
    const mm = Math.floor(total / 60).toString().padStart(2, '0');
    const ss = (total % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
    // NOTE: depend on tick so the display updates every second
  }, [elapsedSeconds, tick]);

  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  const [exerciseName, setExerciseName] = useState('');
  const [noteText, setNoteText] = useState('');
  const [customText, setCustomText] = useState('');

  const items = useMemo<WorkoutItem[]>(
    () => [...(draft?.items ?? [])].sort((a, b) => a.createdAt - b.createdAt),
    [draft?.items]
  );

  // Pause timer when finish sheet opens; resume when it closes
  useEffect(() => {
    if (finishOpen) pause();
    else resume();
  }, [finishOpen, pause, resume]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <TextInput
          value={draft?.name ?? ''}
          onChangeText={setDraftName}
          placeholder="Write the name of your workout here"
          placeholderTextColor="#71717a"
          style={styles.nameInput}
        />

        <View style={styles.timerCard}>
          <Text style={styles.timerText}>{mmss}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.btnBlue]} onPress={() => setExerciseOpen(true)} activeOpacity={0.9}>
            <Text style={styles.actionTextWhite}>+ Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnYellow]} onPress={() => setNoteOpen(true)} activeOpacity={0.9}>
            <Text style={styles.actionTextDark}>+ Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnGray]} onPress={() => setCustomOpen(true)} activeOpacity={0.9}>
            <Text style={styles.actionTextWhite}>+ Custom</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingVertical: 12, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{item.type.toUpperCase()}</Text>
                <Text style={styles.cardTime}>
                  {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
              </View>
              {'name' in item && <Text style={styles.cardText}>{item.name}</Text>}
              {'text' in item && <Text style={styles.cardText}>{item.text}</Text>}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Add something to get started.</Text>}
        />

        <TouchableOpacity style={styles.finishBtn} onPress={() => setFinishOpen(true)} activeOpacity={0.95}>
          <Text style={styles.finishText}>Save & Finish</Text>
        </TouchableOpacity>
      </View>

      {/* Sheets */}
      <Modal visible={exerciseOpen} onRequestClose={() => setExerciseOpen(false)} animationType="slide" presentationStyle="pageSheet">
        <Sheet title="Add Exercise" onClose={() => setExerciseOpen(false)}>
          <TextInput
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="Exercise name"
            placeholderTextColor="#777"
            style={styles.sheetInput}
          />
          <TouchableOpacity
            style={styles.sheetPrimary}
            onPress={() => {
              const t = exerciseName.trim();
              if (t) addExercise(t);
              setExerciseName('');
              setExerciseOpen(false);
            }}
          >
            <Text style={styles.sheetPrimaryText}>Add Exercise</Text>
          </TouchableOpacity>
        </Sheet>
      </Modal>

      <Modal visible={noteOpen} onRequestClose={() => setNoteOpen(false)} animationType="slide" presentationStyle="pageSheet">
        <Sheet title="Add Note" onClose={() => setNoteOpen(false)}>
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Type your note…"
            placeholderTextColor="#777"
            multiline
            style={[styles.sheetInput, { minHeight: 120, textAlignVertical: 'top' }]}
          />
          <TouchableOpacity
            style={styles.sheetPrimary}
            onPress={() => {
              const t = noteText.trim();
              if (t) addNote(t);
              setNoteText('');
              setNoteOpen(false);
            }}
          >
            <Text style={styles.sheetPrimaryText}>Save Note</Text>
          </TouchableOpacity>
        </Sheet>
      </Modal>

      <Modal visible={customOpen} onRequestClose={() => setCustomOpen(false)} animationType="slide" presentationStyle="pageSheet">
        <Sheet title="Add Custom" onClose={() => setCustomOpen(false)}>
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="What do you want to log?"
            placeholderTextColor="#777"
            style={styles.sheetInput}
          />
          <TouchableOpacity
            style={styles.sheetPrimary}
            onPress={() => {
              const t = customText.trim();
              if (t) addCustom(t);
              setCustomText('');
              setCustomOpen(false);
            }}
          >
            <Text style={styles.sheetPrimaryText}>Add Custom</Text>
          </TouchableOpacity>
        </Sheet>
      </Modal>

      {/* Finish (paused + JSON preview, saving disabled) */}
      <Modal visible={finishOpen} onRequestClose={() => setFinishOpen(false)} animationType="slide" presentationStyle="pageSheet">
        <Sheet title="Finish Workout (Preview)" onClose={() => setFinishOpen(false)}>
          <Text style={styles.summary}>
            {items.length} item(s) • Time {mmss} • (timer paused)
          </Text>
          <View style={styles.jsonBox}>
            <ScrollView>
              <Text style={styles.jsonText}>
                {JSON.stringify({ draft, history }, null, 2)}
              </Text>
            </ScrollView>
          </View>
          <TouchableOpacity
            style={[styles.finishConfirm, { opacity: 0.5 }]}
            activeOpacity={1}
            onPress={() => {
              Alert.alert('Disabled', 'Saving is disabled for now. Close this sheet to resume the timer.');
            }}
          >
            <Text style={styles.finishConfirmText}>Save Disabled</Text>
          </TouchableOpacity>
        </Sheet>
      </Modal>
    </SafeAreaView>
  );
}

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.sheetRoot}>
      <View style={styles.grabber} />
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>
      <View style={styles.sheetBody}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b0b' },
  container: { flex: 1, padding: 16, gap: 12 },

  nameInput: {
    borderWidth: 1, borderColor: '#262626', backgroundColor: '#121212', color: 'white',
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, fontSize: 16, fontWeight: '600',
  },

  timerCard: {
    backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  timerText: { color: 'white', fontSize: 36, fontWeight: '800', letterSpacing: 1 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnBlue: { backgroundColor: '#0A84FF', borderColor: '#0A84FF' },
  btnYellow: { backgroundColor: '#FFD60A', borderColor: '#FFD60A' },
  btnGray: { backgroundColor: '#2b2b2b', borderColor: '#3a3a3a' },

  actionTextWhite: { color: 'white', fontSize: 15, fontWeight: '800' },
  actionTextDark: { color: '#111', fontSize: 15, fontWeight: '800' },

  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, gap: 6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardType: { color: '#a3a3a3', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cardTime: { color: '#6b7280', fontSize: 12 },
  cardText: { color: 'white', fontSize: 15 },

  empty: { color: '#6b7280', textAlign: 'center', marginTop: 8 },

  finishBtn: { backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  finishText: { color: 'white', fontSize: 16, fontWeight: '800' },

  sheetRoot: { flex: 1, backgroundColor: '#0b0b0b' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#333', marginTop: 8, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  sheetTitle: { color: 'white', fontSize: 18, fontWeight: '800', flex: 1 },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#151515' },
  closeText: { color: '#0A84FF', fontWeight: '800' },
  sheetBody: { flex: 1, padding: 16, gap: 12 },

  sheetInput: {
    borderWidth: 1, borderColor: '#333', backgroundColor: '#141414', color: 'white',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10,
  },
  sheetPrimary: { backgroundColor: '#0A84FF', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  sheetPrimaryText: { color: 'white', fontSize: 16, fontWeight: '800' },

  summary: { color: '#d1d5db', marginBottom: 12, fontSize: 15 },

  jsonBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#262626',
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  jsonText: { color: '#cbd5e1', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as any, fontSize: 12 },

  finishConfirm: { backgroundColor: '#22C55E', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  finishConfirmText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
