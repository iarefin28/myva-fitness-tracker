import { useWorkoutStore } from '@/store/workoutStore';
import type { WorkoutItem } from '@/types/workout';
import { useEffect, useMemo, useRef, useState } from 'react';
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

type SheetKind = 'exercise' | 'note' | 'custom';

export default function AddWorkout() {
  // ---------- Store ----------
  const draft = useWorkoutStore((s) => s.draft);
  const history = useWorkoutStore((s) => s.history);
  const startDraft = useWorkoutStore((s) => s.startDraft);
  const setDraftName = useWorkoutStore((s) => s.setDraftName);
  const addNote = useWorkoutStore((s) => s.addNote);
  const addExercise = useWorkoutStore((s) => s.addExercise);
  const addCustom = useWorkoutStore((s) => s.addCustom);
  const updateItem = useWorkoutStore((s) => (s as any).updateItem) as (id: string, next: { name?: string; text?: string }) => boolean;
  const setActiveItem = useWorkoutStore((s) => s.setActiveItem);
  const elapsedSeconds = useWorkoutStore((s) => s.elapsedSeconds);
  const pause = useWorkoutStore((s) => (s as any).pause);
  const resume = useWorkoutStore((s) => (s as any).resume);

  useEffect(() => { if (!draft) startDraft(''); }, [draft, startDraft]);

  // ---------- Live tick ----------
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(id); }, []);
  const mmss = useMemo(() => {
    const total = elapsedSeconds();
    const mm = Math.floor(total / 60).toString().padStart(2, '0');
    const ss = (total % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  }, [elapsedSeconds, tick]);

  // ---------- Modal state ----------
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  // New: editing context
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKind, setEditingKind] = useState<SheetKind | null>(null);
  const [initialValue, setInitialValue] = useState(''); // to detect changes

  // ---------- Modal inputs ----------
  const [exerciseName, setExerciseName] = useState('');
  const [noteText, setNoteText] = useState('');
  const [customText, setCustomText] = useState('');

  // ---------- Refs ----------
  const exerciseInputRef = useRef<TextInput | null>(null);
  const noteInputRef = useRef<TextInput | null>(null);
  const customInputRef = useRef<TextInput | null>(null);

  const isClosingRef = useRef(false);
  const lastSavedRef = useRef<{ exercise?: string; note?: string; custom?: string }>({});

  // Focus after sheet entrance animation
  useEffect(() => { if (exerciseOpen) { const t = setTimeout(() => exerciseInputRef.current?.focus(), 250); return () => clearTimeout(t); } }, [exerciseOpen]);
  useEffect(() => { if (noteOpen)     { const t = setTimeout(() => noteInputRef.current?.focus(), 250);     return () => clearTimeout(t); } }, [noteOpen]);
  useEffect(() => { if (customOpen)   { const t = setTimeout(() => customInputRef.current?.focus(), 250);   return () => clearTimeout(t); } }, [customOpen]);

  // Pause timer when finish sheet opens; resume when it closes
  useEffect(() => { if (finishOpen) pause(); else resume(); }, [finishOpen, pause, resume]);

  // ---------- Items & list ----------
  const items = useMemo<WorkoutItem[]>(
    () => [...(draft?.items ?? [])].sort((a, b) => a.createdAt - b.createdAt),
    [draft?.items]
  );
  const flatListRef = useRef<FlatList<WorkoutItem>>(null);

  // Only auto-scroll when list grows
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (items.length > prevCountRef.current) {
      const t = setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
      prevCountRef.current = items.length;
      return () => clearTimeout(t);
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  // ---------- Open modals (new vs edit) ----------
  const openNew = (kind: SheetKind) => {
    setEditingId(null);
    setEditingKind(kind);
    setInitialValue('');
    if (kind === 'exercise') { setExerciseName(''); setExerciseOpen(true); }
    if (kind === 'note')     { setNoteText('');     setNoteOpen(true); }
    if (kind === 'custom')   { setCustomText('');   setCustomOpen(true); }
  };

  const openEdit = (item: WorkoutItem) => {
    setEditingId(item.id);
    setEditingKind(item.type);
    if (item.type === 'exercise') {
      const val = (item as any).name ?? '';
      setExerciseName(val); setInitialValue(val); setExerciseOpen(true);
    } else {
      const val = (item as any).text ?? '';
      setInitialValue(val);
      if (item.type === 'note') { setNoteText(val); setNoteOpen(true); }
      else { setCustomText(val); setCustomOpen(true); }
    }
  };

  // ---------- Save helpers ----------
  const performSave = (kind: SheetKind, rawValue: string, setOpen: (v: boolean) => void, clearInput: () => void) => {
    const v = (rawValue ?? '').trim();
    if (!v) { setOpen(false); return; }

    // EDIT MODE
    if (editingId && editingKind === kind) {
      const changed = v !== (initialValue ?? '');
      if (changed) {
        if (kind === 'exercise') updateItem(editingId, { name: v });
        else updateItem(editingId, { text: v });
        setActiveItem(editingId);
      }
      clearInput();
      setOpen(false);
      setEditingId(null);
      setEditingKind(null);
      setInitialValue('');
      return;
    }

    // ADD MODE
    let newId = '';
    if (kind === 'exercise') newId = addExercise(v);
    else if (kind === 'note') newId = addNote(v);
    else newId = addCustom(v);
    lastSavedRef.current[kind] = v;
    clearInput(); setOpen(false);
    if (newId) setActiveItem(newId);
  };

  const handleSheetClose = (kind: SheetKind, rawValue: string, setOpen: (v: boolean) => void, clearInput: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    try { performSave(kind, rawValue, setOpen, clearInput); }
    finally { setTimeout(() => { isClosingRef.current = false; }, 300); }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        {/* Workout name */}
        <TextInput
          value={draft?.name ?? ''}
          onChangeText={setDraftName}
          placeholder="Write the name of your workout here"
          placeholderTextColor="#71717a"
          style={styles.nameInput}
        />

        {/* Timer */}
        <View style={styles.timerCard}><Text style={styles.timerText}>{mmss}</Text></View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.btnBlue]}  onPress={() => openNew('exercise')} activeOpacity={0.9}>
            <Text style={styles.actionTextWhite}>+ Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnYellow]} onPress={() => openNew('note')} activeOpacity={0.9}>
            <Text style={styles.actionTextDark}>+ Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnGray]}   onPress={() => openNew('custom')} activeOpacity={0.9}>
            <Text style={styles.actionTextWhite}>+ Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Feed */}
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingVertical: 12, gap: 10 }}
          renderItem={({ item }) => {
            const isActive = draft?.activeItemId
              ? draft.activeItemId === item.id
              : items.length > 0 && items[items.length - 1].id === item.id;
            const primaryText = item.type === 'exercise' ? (item as any).name : (item as any).text;
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveItem(item.id)}
                onLongPress={() => openEdit(item)} // ← long press to edit
              >
                <View style={[styles.card, isActive && styles.cardActive]}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardType}>{item.type.toUpperCase()}</Text>
                    <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
                  </View>
                  <Text style={styles.cardText}>{primaryText}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Add something to get started.</Text>}
        />

        {/* Save (disabled, opens preview & pauses) */}
        <TouchableOpacity style={styles.finishBtn} onPress={() => setFinishOpen(true)} activeOpacity={0.95}>
          <Text style={styles.finishText}>Save & Finish</Text>
        </TouchableOpacity>
      </View>

      {/* --------- SHEETS --------- */}

      {/* Exercise */}
      <Modal
        visible={exerciseOpen}
        onRequestClose={() => handleSheetClose('exercise', exerciseName, setExerciseOpen, () => setExerciseName(''))}
        onDismiss={() => { if (!exerciseOpen) handleSheetClose('exercise', exerciseName, setExerciseOpen, () => setExerciseName('')); }}
        animationType="slide" presentationStyle="pageSheet"
      >
        <Sheet
          title={editingId && editingKind === 'exercise' ? 'Edit Exercise' : 'Add Exercise'}
          rightLabel={(exerciseName.trim().length ? 'Save' : 'Close')}
          onRightPress={() => {
            if (exerciseName.trim().length) performSave('exercise', exerciseName, setExerciseOpen, () => setExerciseName(''));
            else setExerciseOpen(false);
          }}
        >
          <TextInput
            ref={exerciseInputRef}
            value={exerciseName}
            onChangeText={setExerciseName}
            placeholder="Exercise name"
            placeholderTextColor="#777"
            style={styles.sheetInput}
            autoFocus
          />
          {/* Keep primary CTA for add as well */}
          <TouchableOpacity
            style={[styles.sheetPrimary, { opacity: exerciseName.trim().length ? 1 : 0.65 }]}
            disabled={!exerciseName.trim().length}
            onPress={() => performSave('exercise', exerciseName, setExerciseOpen, () => setExerciseName(''))}
          >
            <Text style={styles.sheetPrimaryText}>{editingId && editingKind === 'exercise' ? 'Save Changes' : 'Add Exercise'}</Text>
          </TouchableOpacity>
        </Sheet>
      </Modal>

      {/* Note */}
      <Modal
        visible={noteOpen}
        onRequestClose={() => handleSheetClose('note', noteText, setNoteOpen, () => setNoteText(''))}
        onDismiss={() => { if (!noteOpen) handleSheetClose('note', noteText, setNoteOpen, () => setNoteText('')); }}
        animationType="slide" presentationStyle="pageSheet"
      >
        <Sheet
          title={editingId && editingKind === 'note' ? 'Edit Note' : 'Add Note'}
          rightLabel={(noteText.trim().length ? 'Save' : 'Close')}
          onRightPress={() => {
            if (noteText.trim().length) performSave('note', noteText, setNoteOpen, () => setNoteText(''));
            else setNoteOpen(false);
          }}
        >
          <TextInput
            ref={noteInputRef}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Type your note…"
            placeholderTextColor="#777"
            multiline
            style={[styles.sheetInput, { minHeight: 120, textAlignVertical: 'top' }]}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.sheetPrimary, { opacity: noteText.trim().length ? 1 : 0.65 }]}
            disabled={!noteText.trim().length}
            onPress={() => performSave('note', noteText, setNoteOpen, () => setNoteText(''))}
          >
            <Text style={styles.sheetPrimaryText}>{editingId && editingKind === 'note' ? 'Save Changes' : 'Save Note'}</Text>
          </TouchableOpacity>
        </Sheet>
      </Modal>

      {/* Custom */}
      <Modal
        visible={customOpen}
        onRequestClose={() => handleSheetClose('custom', customText, setCustomOpen, () => setCustomText(''))}
        onDismiss={() => { if (!customOpen) handleSheetClose('custom', customText, setCustomOpen, () => setCustomText('')); }}
        animationType="slide" presentationStyle="pageSheet"
      >
        <Sheet
          title={editingId && editingKind === 'custom' ? 'Edit Custom' : 'Add Custom'}
          rightLabel={(customText.trim().length ? 'Save' : 'Close')}
          onRightPress={() => {
            if (customText.trim().length) performSave('custom', customText, setCustomOpen, () => setCustomText(''));
            else setCustomOpen(false);
          }}
        >
          <TextInput
            ref={customInputRef}
            value={customText}
            onChangeText={setCustomText}
            placeholder="What do you want to log?"
            placeholderTextColor="#777"
            style={styles.sheetInput}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.sheetPrimary, { opacity: customText.trim().length ? 1 : 0.65 }]}
            disabled={!customText.trim().length}
            onPress={() => performSave('custom', customText, setCustomOpen, () => setCustomText(''))}
          >
            <Text style={styles.sheetPrimaryText}>{editingId && editingKind === 'custom' ? 'Save Changes' : 'Add Custom'}</Text>
          </TouchableOpacity>
        </Sheet>
      </Modal>

      {/* Finish (paused + JSON preview, saving disabled) */}
      <Modal visible={finishOpen} onRequestClose={() => setFinishOpen(false)} animationType="slide" presentationStyle="pageSheet">
        <Sheet title="Finish Workout (Preview)" rightLabel="Close" onRightPress={() => setFinishOpen(false)}>
          <Text style={styles.summary}>{items.length} item(s) • Time {mmss} • (timer paused)</Text>
          <View style={styles.jsonBox}>
            <ScrollView><Text style={styles.jsonText}>{JSON.stringify({ draft, history }, null, 2)}</Text></ScrollView>
          </View>
          <TouchableOpacity style={[styles.finishConfirm, { opacity: 0.5 }]} activeOpacity={1} onPress={() => Alert.alert('Disabled','Saving is disabled for now. Close this sheet to resume the timer.')}>
            <Text style={styles.finishConfirmText}>Save Disabled</Text>
          </TouchableOpacity>
        </Sheet>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- Reusable Sheet ----------
function Sheet({
  title,
  rightLabel = 'Close',
  onRightPress,
  children,
}: {
  title: string;
  rightLabel?: string;
  onRightPress?: () => void;
  children: React.ReactNode;
}) {
  const isSave = rightLabel.toLowerCase() === 'save';
  return (
    <SafeAreaView style={styles.sheetRoot}>
      <View style={styles.grabber} />
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <Pressable onPress={onRightPress} style={[styles.closeBtn, isSave && styles.saveBtn]}>
          <Text style={[styles.closeText, isSave && styles.saveText]}>{rightLabel}</Text>
        </Pressable>
      </View>
      <View style={styles.sheetBody}>{children}</View>
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b0b' },
  container: { flex: 1, padding: 16, gap: 12 },

  nameInput: { borderWidth: 1, borderColor: '#262626', backgroundColor: '#121212', color: 'white',
    paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, fontSize: 16, fontWeight: '600' },

  timerCard: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center' },
  timerText: { color: 'white', fontSize: 36, fontWeight: '800', letterSpacing: 1 },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnBlue: { backgroundColor: '#0A84FF', borderColor: '#0A84FF' },
  btnYellow: { backgroundColor: '#FFD60A', borderColor: '#FFD60A' },
  btnGray: { backgroundColor: '#2b2b2b', borderColor: '#3a3a3a' },
  actionTextWhite: { color: 'white', fontSize: 15, fontWeight: '800' },
  actionTextDark: { color: '#111', fontSize: 15, fontWeight: '800' },

  card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, gap: 6 },
  cardActive: { borderColor: '#0A84FF', shadowColor: '#0A84FF', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  cardType: { color: '#a3a3a3', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  cardTime: { color: '#6b7280', fontSize: 12 },
  cardText: { color: 'white', fontSize: 15 },

  empty: { color: '#6b7280', textAlign: 'center', marginTop: 8 },

  finishBtn: { backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  finishText: { color: 'white', fontSize: 16, fontWeight: '800' },

  // Sheet
  sheetRoot: { flex: 1, backgroundColor: '#0b0b0b' },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#333', marginTop: 8, marginBottom: 4 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  sheetTitle: { color: 'white', fontSize: 18, fontWeight: '800', flex: 1 },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#151515' },
  closeText: { color: '#0A84FF', fontWeight: '800' },
  saveBtn: { backgroundColor: '#0A84FF' },
  saveText: { color: 'white' },
  sheetBody: { flex: 1, padding: 16, gap: 12 },

  sheetInput: { borderWidth: 1, borderColor: '#333', backgroundColor: '#141414', color: 'white',
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  sheetPrimary: { backgroundColor: '#0A84FF', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  sheetPrimaryText: { color: 'white', fontSize: 16, fontWeight: '800' },

  summary: { color: '#d1d5db', marginBottom: 12, fontSize: 15 },

  jsonBox: { flex: 1, borderWidth: 1, borderColor: '#262626', backgroundColor: '#0f0f0f', borderRadius: 10, padding: 10, marginBottom: 12 },
  jsonText: { color: '#cbd5e1', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) as any, fontSize: 12 },

  finishConfirm: { backgroundColor: '#22C55E', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  finishConfirmText: { color: 'white', fontSize: 16, fontWeight: '800' },
});
