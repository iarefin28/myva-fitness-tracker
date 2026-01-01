import { useWorkoutStore } from '@/store/workoutStore';
import type { WorkoutExercise, WorkoutItem } from '@/types/workout';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import AddExerciseModal from "@/components/AddExerciseModal";
import CustomModal from "@/components/CustomModal";
import EditExerciseModal from "@/components/EditExerciseModal";
import FinishWorkoutModal from "@/components/FinishWorkoutModal";
import NoteModal from "@/components/NoteModal";
import { InteractionManager } from "react-native";

type SheetKind = 'exercise' | 'note' | 'custom';

export default function AddWorkout() {
    const navigation = useNavigation();
    const router = useRouter();

    // ---------- Store ----------
    const draft = useWorkoutStore((s) => s.draft);
    const history = useWorkoutStore((s) => s.history);
    const finishAndSave = useWorkoutStore((s) => s.finishAndSave);
    const startDraft = useWorkoutStore((s) => s.startDraft);
    const setDraftName = useWorkoutStore((s) => s.setDraftName);
    const addNote = useWorkoutStore((s) => s.addNote);
    const addExercise = useWorkoutStore((s) => s.addExercise);
    const addCustom = useWorkoutStore((s) => s.addCustom);
    const updateItem = useWorkoutStore((s) => (s as any).updateItem) as (id: string, next: { name?: string; text?: string }) => boolean;
    const deleteItem = useWorkoutStore((s) => (s as any).deleteItem) as (id: string) => boolean;
    const completeItem = useWorkoutStore((s) => (s as any).completeItem) as (id: string) => boolean;

    const elapsedSeconds = useWorkoutStore((s) => s.elapsedSeconds);
    const pause = useWorkoutStore((s) => (s as any).pause);
    const resume = useWorkoutStore((s) => (s as any).resume);
    const clearDraft = useWorkoutStore((s) => (s as any).clearDraft) as () => void;
    const isFinishingRef = useRef(false);


    // ---------- Header ----------
    const onDiscard = () => {
        Alert.alert(
            'Discard workout?',
            'This will permanently delete the current draft, timer, and action log.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => {
                        try {
                            isDiscardingRef.current = true;
                            clearDraft();
                            router.back();
                        } finally {
                            setTimeout(() => { isDiscardingRef.current = false; }, 500);
                        }
                    },
                },
            ]
        );
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: 'Add Workout',
            headerRight: () => (
                <Pressable onPress={onDiscard} hitSlop={10} accessibilityLabel="Discard workout">
                    <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </Pressable>
            ),
        });
    }, [navigation]);

    const isDiscardingRef = useRef(false);

    useEffect(() => {
        if (!draft && !isDiscardingRef.current && !isFinishingRef.current) startDraft('');
    }, [draft, startDraft]);

    // ---------- Live tick ----------
    const [tick, setTick] = useState(0);
    useEffect(() => { const id = setInterval(() => setTick((t) => t + 1), 1000); return () => clearInterval(id); }, []);
    const mmss = useMemo(() => {
        const total = elapsedSeconds();
        const mm = Math.floor(total / 60).toString().padStart(2, '0');
        const ss = (total % 60).toString().padStart(2, '0');
        return `${mm}:${ss}`;
    }, [elapsedSeconds, tick]);

    // ---------- Modal state (SPLIT) ----------
    // Add modal (adds an exercise into the workout)
    const [addExerciseOpen, setAddExerciseOpen] = useState(false);

    // Edit modal (tap an existing exercise to edit sets/rest/name)
    const [editExerciseOpen, setEditExerciseOpen] = useState(false);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

    // Other modals unchanged
    const [noteOpen, setNoteOpen] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);
    const [finishOpen, setFinishOpen] = useState(false);


    // Editing context (used by EDIT modal)
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingKind, setEditingKind] = useState<SheetKind | null>(null);

    // Inputs
    const [noteText, setNoteText] = useState('');
    const [customText, setCustomText] = useState('');

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

    // Openers
    const openNew = (kind: SheetKind) => {
        if (kind === 'exercise') {
            // ADD modal
            setEditingId(null);
            setEditingKind(null);
            setAddExerciseOpen(true);
            return;
        }
        if (kind === 'note') { setEditingId(null); setEditingKind('note'); setNoteText(''); setNoteOpen(true); }
        if (kind === 'custom') { setEditingId(null); setEditingKind('custom'); setCustomText(''); setCustomOpen(true); }
    };

    const handleAddNewFromModal = (name: string) => {
        const q = name.trim();
        if (!q) return;
        setAddExerciseOpen(false);

        // For iOS pageSheet, a tiny timeout still helps before runAfterInteractions
        const delay = Platform.OS === "ios" ? 150 : 0;

        setTimeout(() => {
            InteractionManager.runAfterInteractions(() => {
                router.push({ pathname: "/addNewExercise", params: { name: q, addToDraft: "1" } });
            });
        }, delay);
    };

    const openEditExercise = (item: WorkoutItem) => {
        if (item.type !== 'exercise') return;
        setSelectedExerciseId(item.id);
        setEditExerciseOpen(true);
    };

    // Save helpers
    const performSave = (
        kind: SheetKind,
        rawValue: string,
        setOpen: (v: boolean) => void,
        clearInput: () => void
    ) => {
        const v = (rawValue ?? '').trim();
        if (!v) { setOpen(false); return; }

        if (editingId && editingKind === kind && kind !== 'exercise') {
            const from = (items.find(i => i.id === editingId) as any)?.text ?? '';
            if (v !== from) updateItem(editingId, { text: v });
            clearInput(); setOpen(false);
            setEditingId(null); setEditingKind(null);
            return;
        }

        // ADD flows
        let newId = '';
        if (kind === 'exercise') newId = addExercise(v);
        else if (kind === 'note') newId = addNote(v);
        else newId = addCustom(v);

        clearInput(); setOpen(false);
        // no setActiveItem — selection UX removed
    };

    const confirmDelete = (
        id: string,
        kind: SheetKind,
        setOpen: (v: boolean) => void,
        clearInput: () => void
    ) => {
        Alert.alert(
            'Delete item?',
            kind === 'exercise' ? 'This will remove the exercise.' : (kind === 'note' ? 'This will remove the note.' : 'This will remove the custom entry.'),
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteItem(id);
                        clearInput();
                        setOpen(false);
                        setEditingId(null);
                        setEditingKind(null);
                        if (selectedExerciseId === id) setSelectedExerciseId(null);
                    },
                },
            ]
        );
    };

    const handleFinishConfirm = () => {
        isFinishingRef.current = true;
        const saved = finishAndSave();
        if (saved.id) {
            setFinishOpen(false);
            navigation.goBack();
        } else {
            Alert.alert('Unable to save', 'No active workout to save.');
        }
    };

    const isEditingNote = !!(editingId && editingKind === 'note');
    const isEditingCustom = !!(editingId && editingKind === 'custom');

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
                    <TouchableOpacity style={[styles.actionBtn, styles.btnBlue]} onPress={() => openNew('exercise')} activeOpacity={0.9}>
                        <Text style={styles.actionTextWhite}>+ Exercise</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.btnYellow, styles.btnDisabled]}
                        onPress={() => openNew('note')}
                        activeOpacity={0.9}
                        disabled
                    >
                        <Text style={styles.actionTextMuted}>+ Note</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.btnGray, styles.btnDisabled]}
                        onPress={() => openNew('custom')}
                        activeOpacity={0.9}
                        disabled
                    >
                        <Text style={styles.actionTextMuted}>+ Custom</Text>
                    </TouchableOpacity>
                </View>

                {/* Feed */}
                <FlatList
                    ref={flatListRef}
                    data={items}
                    keyExtractor={(it) => it.id}
                    contentContainerStyle={{ paddingVertical: 12, gap: 10 }}
                    renderItem={({ item }) => {
                        const primaryText = item.type === 'exercise' ? (item as WorkoutExercise).name : (item as any).text;
                        const isCompleted = item.type === 'exercise' && (item as WorkoutExercise).status === 'completed';
                        return (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    if (item.type === 'exercise') {
                                        openEditExercise(item);
                                        return;
                                    }
                                    // unchanged for note/custom
                                    setEditingId(item.id);
                                    setEditingKind(item.type as any);
                                    item.type === 'note' ? setNoteOpen(true) : setCustomOpen(true);
                                }}
                            >
                                <View style={[styles.card /* no active border */]}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardType}>
                                            {item.type.toUpperCase()} {isCompleted ? '· COMPLETED' : ''}
                                        </Text>
                                        <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
                                    </View>
                                    <Text style={[styles.cardText, isCompleted && { opacity: 0.7 }]}>{primaryText}</Text>
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

            {/* --------- ADD EXERCISE MODAL (no autofocus, no set/rest) --------- */}
            <AddExerciseModal
                open={addExerciseOpen}
                onClose={() => setAddExerciseOpen(false)}
                onSelectExercise={({ name, id }) => {
                    // Reuse your existing store action
                    addExercise(name, id);
                    // any post-add cleanup if you want
                }}
                onAddNew={handleAddNewFromModal}
            />

            {/* --------- EDIT EXERCISE MODAL (tap to open on top) --------- */}
            <EditExerciseModal
                visible={editExerciseOpen}
                exerciseId={selectedExerciseId}
                onClose={() => setEditExerciseOpen(false)}
                onDiscard={() => { if (selectedExerciseId) deleteItem(selectedExerciseId); }}
                onCompleteExercise={() => { if (selectedExerciseId) completeItem(selectedExerciseId); }}
            />

            {/* --------- NOTE MODAL --------- */}
            {/* Phase 1: Note/Custom modals are wired but inactive; enable in phase two. */}
            <NoteModal
                visible={noteOpen}
                text={noteText}
                onChangeText={setNoteText}
                onClose={() => setNoteOpen(false)}
                onSave={() => performSave('note', noteText, setNoteOpen, () => setNoteText(''))}
                onDelete={isEditingNote ? () => confirmDelete(editingId as string, 'note', setNoteOpen, () => setNoteText('')) : undefined}
                isEditing={isEditingNote}
            />

            {/* --------- CUSTOM MODAL --------- */}
            <CustomModal
                visible={customOpen}
                text={customText}
                onChangeText={setCustomText}
                onClose={() => setCustomOpen(false)}
                onSave={() => performSave('custom', customText, setCustomOpen, () => setCustomText(''))}
                onDelete={isEditingCustom ? () => confirmDelete(editingId as string, 'custom', setCustomOpen, () => setCustomText('')) : undefined}
                isEditing={isEditingCustom}
            />

            {/* --------- FINISH (paused preview) --------- */}
            <FinishWorkoutModal
                visible={finishOpen}
                itemsCount={items.length}
                mmss={mmss}
                draft={draft}
                history={history}
                onClose={() => setFinishOpen(false)}
                onConfirm={handleFinishConfirm}
            />
        </SafeAreaView>
    );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0b0b0b' },
    container: { flex: 1, padding: 16, gap: 12 },

    nameInput: {
        borderWidth: 1, borderColor: '#262626', backgroundColor: '#121212', color: 'white',
        paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, fontSize: 16, fontWeight: '600'
    },

    timerCard: {
        backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12,
        paddingVertical: 14, alignItems: 'center'
    },
    timerText: { color: 'white', fontSize: 36, fontWeight: '800', letterSpacing: 1 },

    actionsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    btnBlue: { backgroundColor: '#0A84FF', borderColor: '#0A84FF' },
    btnYellow: { backgroundColor: '#FFD60A', borderColor: '#FFD60A' },
    btnGray: { backgroundColor: '#2b2b2b', borderColor: '#3a3a3a' },
    actionTextWhite: { color: 'white', fontSize: 15, fontWeight: '800' },
    actionTextDark: { color: '#111', fontSize: 15, fontWeight: '800' },
    actionTextMuted: { color: '#9ca3af', fontSize: 15, fontWeight: '800' },

    card: { backgroundColor: '#111', borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, gap: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    cardType: { color: '#a3a3a3', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    cardTime: { color: '#6b7280', fontSize: 12 },
    cardText: { color: 'white', fontSize: 15 },

    empty: { color: '#6b7280', textAlign: 'center', marginTop: 8 },

    finishBtn: { backgroundColor: '#22C55E', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    finishText: { color: 'white', fontSize: 16, fontWeight: '800' },

    segment: {
        flexDirection: 'row', backgroundColor: '#111', borderRadius: 10, padding: 4, gap: 6,
        borderWidth: 1, borderColor: '#2a2a2a',
    },
    segmentChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
    segmentChipActive: { backgroundColor: '#0A84FF' },
    segmentText: { color: '#9ca3af', fontWeight: '700', textTransform: 'capitalize' },
    segmentTextActive: { color: 'white' },


    entryRow: { backgroundColor: '#111', borderWidth: 1, borderColor: '#242424', borderRadius: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between' },
    entryText: { color: 'white', fontWeight: '700' },
    entryTime: { color: '#9ca3af', fontSize: 12 },

    nextBtn: { backgroundColor: '#22C55E', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
    nextBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
    duoRow: { flexDirection: 'row', gap: 8 },
    duoBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    duoBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
    btnPrimary: { backgroundColor: '#0A84FF' },
    btnSuccess: { backgroundColor: '#22C55E' },
    btnDisabled: { opacity: 0.5 },
});
