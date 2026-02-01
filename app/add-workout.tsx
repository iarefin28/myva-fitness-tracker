import { useWorkoutStore } from '@/store/workoutStore';
import type { WorkoutExercise, WorkoutItem } from '@/types/workout';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AddExerciseModal from "@/components/AddExerciseModal";
import CustomModal from "@/components/CustomModal";
import EditExerciseModal from "@/components/EditExerciseModal";
import FinishWorkoutModal from "@/components/FinishWorkoutModal";
import NoteModal from "@/components/NoteModal";
import { InteractionManager } from "react-native";
import { typography } from "@/theme/typography";
import { useExerciseLibrary } from "@/store/exerciseLibrary";

type SheetKind = 'exercise' | 'note' | 'custom';

export default function AddWorkout() {
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();
    const isDark = scheme === "dark";

    const C = useMemo(
        () => ({
            bg: isDark ? "#0b0b0b" : "#F8FAFC",
            surface: isDark ? "#111" : "#FFFFFF",
            surfaceAlt: isDark ? "#121212" : "#FFFFFF",
            border: isDark ? "#222" : "#E2E8F0",
            borderStrong: isDark ? "#262626" : "#CBD5E1",
            text: isDark ? "#FFFFFF" : "#0F172A",
            subText: isDark ? "#9ca3af" : "#64748B",
            placeholder: isDark ? "#71717a" : "#94A3B8",
            cardType: isDark ? "#a3a3a3" : "#475569",
            cardTime: isDark ? "#6b7280" : "#94A3B8",
            empty: isDark ? "#6b7280" : "#94A3B8",
            blue: isDark ? "#0A84FF" : "#2563EB",
            yellow: isDark ? "#FFD60A" : "#FBBF24",
            grayBtn: isDark ? "#2b2b2b" : "#E2E8F0",
            grayBorder: isDark ? "#3a3a3a" : "#CBD5E1",
            success: isDark ? "#22C55E" : "#16A34A",
            danger: isDark ? "#F87171" : "#DC2626",
        }),
        [isDark]
    );
    const exerciseCardGradient = useMemo(
        () => (isDark ? ["#1E3A8A", "#2563EB"] : ["#60A5FA", "#3B82F6"]),
        [isDark]
    );

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

    const elapsedSeconds = useWorkoutStore((s) => s.elapsedSeconds);
    const pause = useWorkoutStore((s) => (s as any).pause);
    const resume = useWorkoutStore((s) => (s as any).resume);
    const clearDraft = useWorkoutStore((s) => (s as any).clearDraft) as () => void;
    const isFinishingRef = useRef(false);
    const bumpUsage = useExerciseLibrary((s) => s.bumpUsage);
    const exercisesById = useExerciseLibrary((s) => s.exercises);


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
            contentStyle: { backgroundColor: C.bg },
            headerRight: () => (
                <Pressable onPress={onDiscard} hitSlop={10} accessibilityLabel="Discard workout">
                    <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </Pressable>
            ),
        });
    }, [navigation]);

    const isDiscardingRef = useRef(false);
    const isPaused = !!draft?.pausedAt;

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
    const [reopenEditOnFocus, setReopenEditOnFocus] = useState(false);

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

    const pausedForFinishRef = useRef(false);
    useEffect(() => {
        if (finishOpen) {
            pausedForFinishRef.current = true;
            pause();
            return;
        }
        if (pausedForFinishRef.current) {
            pausedForFinishRef.current = false;
            resume();
        }
    }, [finishOpen, pause, resume]);
    useFocusEffect(
        useCallback(() => {
            if (reopenEditOnFocus && selectedExerciseId) {
                setEditExerciseOpen(true);
                setReopenEditOnFocus(false);
            }
        }, [reopenEditOnFocus, selectedExerciseId])
    );

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
        if (kind === 'exercise') newId = addExercise(v, undefined, 'free weight');
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
        const exerciseIds = (draft?.items ?? [])
            .filter((it) => it.type === 'exercise')
            .map((it: any) => it.libId)
            .filter((id): id is string => !!id);
        if (exerciseIds.length) bumpUsage(exerciseIds);
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
        <View style={[styles.root, { backgroundColor: C.bg }]}>
            <View style={styles.container}>
                {/* Timer */}
                <Pressable
                    onPress={() => {
                        if (isPaused) {
                            resume();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } else {
                            pause();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={isPaused ? "Resume workout timer" : "Pause workout timer"}
                    style={[
                        styles.timerCard,
                        { backgroundColor: isPaused ? C.danger : C.success, borderColor: isPaused ? C.danger : C.success },
                    ]}
                >
                    <Text style={[styles.timerSubtext, { color: "white" }]}>
                        {isPaused ? "Paused - tap to resume" : "Running - tap to pause"}
                    </Text>
                    <Text style={[styles.timerText, { color: "white" }]}>{mmss}</Text>
                </Pressable>

                {/* Workout name */}
                <TextInput
                    value={draft?.name ?? ''}
                    onChangeText={setDraftName}
                    placeholder="Write the name of your workout here"
                    placeholderTextColor={C.placeholder}
                    style={[
                        styles.nameInput,
                        { borderColor: C.borderStrong, backgroundColor: C.surfaceAlt, color: C.text },
                    ]}
                />

                {/* Feed */}
                <FlatList
                    ref={flatListRef}
                    data={items}
                    keyExtractor={(it) => it.id}
                    contentContainerStyle={{ paddingTop: 12, paddingBottom: 12, gap: 10 }}
                    renderItem={({ item }) => {
                        const primaryText = item.type === 'exercise' ? (item as WorkoutExercise).name : (item as any).text;
                        const isCompleted = item.type === 'exercise' && (item as WorkoutExercise).status === 'completed';
                        const setCount = item.type === 'exercise' ? (item as WorkoutExercise).sets?.length ?? 0 : 0;
                        const setLabel =
                            item.type === 'exercise'
                                ? setCount === 0
                                    ? 'Press to start'
                                    : `${setCount} set${setCount === 1 ? '' : 's'}`
                                : '';
                        return (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
                                {item.type === 'exercise' ? (
                                    <LinearGradient
                                        colors={exerciseCardGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={[styles.exerciseCard, { borderColor: C.border }]}
                                    >
                                        <Text style={[styles.exerciseTitle, { color: "#fff" }, isCompleted && { opacity: 0.7 }]}>
                                            {primaryText}
                                        </Text>
                                        <Text style={[styles.exerciseSub, { color: "#E5E7EB" }]}>
                                            {setLabel}
                                        </Text>
                                    </LinearGradient>
                                ) : (
                                    <View style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}>
                                        <View style={styles.cardHeader}>
                                            <Text style={[styles.cardType, { color: C.cardType }]}>
                                                {item.type.toUpperCase()} {isCompleted ? '· COMPLETED' : ''}
                                            </Text>
                                            <Text style={[styles.cardTime, { color: C.cardTime }]}>
                                                {new Date(item.createdAt).toLocaleTimeString()}
                                            </Text>
                                        </View>
                                        <Text style={[styles.cardText, { color: C.text }, isCompleted && { opacity: 0.7 }]}>
                                            {primaryText}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={<Text style={[styles.empty, { color: C.empty }]}>Add something to get started.</Text>}
                />

                {/* Actions + Save container */}
                <View
                    style={[
                        styles.actionsFooter,
                        {
                            paddingBottom: 12 + insets.bottom,
                            backgroundColor: isDark ? "#111" : "#F1F5F9",
                            borderTopColor: isDark ? "#222" : "#E2E8F0",
                            shadowColor: "#000",
                            shadowOpacity: isDark ? 0 : 0.12,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: -2 },
                            elevation: isDark ? 0 : 3,
                        },
                    ]}
                >
                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: C.blue, borderColor: C.blue }]}
                            onPress={() => {
                                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                openNew('exercise');
                            }}
                            activeOpacity={0.9}
                        >
                            <Text style={styles.actionTextWhite}>+ Exercise</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: C.yellow, borderColor: C.yellow }, styles.btnDisabled]}
                            onPress={() => openNew('note')}
                            activeOpacity={0.9}
                            disabled
                        >
                            <Text style={[styles.actionTextMuted, { color: C.subText }]}>+ Note</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: C.grayBtn, borderColor: C.grayBorder }, styles.btnDisabled]}
                            onPress={() => openNew('custom')}
                            activeOpacity={0.9}
                            disabled
                        >
                            <Text style={[styles.actionTextMuted, { color: C.subText }]}>+ Custom</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Save (disabled, opens preview & pauses) */}
                    <TouchableOpacity
                        style={[styles.finishBtn, { backgroundColor: C.success }]}
                        onPress={() => setFinishOpen(true)}
                        activeOpacity={0.95}
                    >
                        <Text style={styles.finishText}>Save & Finish</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* --------- ADD EXERCISE MODAL (no autofocus, no set/rest) --------- */}
            <AddExerciseModal
                open={addExerciseOpen}
                onClose={() => setAddExerciseOpen(false)}
                onSelectExercise={({ name, id }) => {
                    // Reuse your existing store action
                    const exerciseType = exercisesById[id]?.type ?? 'free weight';
                    addExercise(name, id, exerciseType);
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
                onShowExerciseDetail={(exerciseId) => {
                    setEditExerciseOpen(false);
                    setReopenEditOnFocus(true);
                    (navigation as any).navigate("exercise-detail", { exerciseId });
                }}
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
        </View>
    );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
    root: { flex: 1 },
    container: { flex: 1, paddingTop: 8, paddingHorizontal: 16, gap: 12 },

    nameInput: {
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 12,
        fontSize: 16,
        fontWeight: '600',
    },

    timerCard: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    timerText: { fontSize: 36, fontWeight: '800', letterSpacing: 1 },
    timerSubtext: { marginBottom: 4, fontSize: 12, fontWeight: '600' },

    actionsRow: { flexDirection: 'row', gap: 10 },
    actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    actionTextWhite: { color: 'white', fontSize: 15, ...typography.button },
    actionTextDark: { color: '#111', fontSize: 15, ...typography.button },
    actionTextMuted: { color: '#9ca3af', fontSize: 15, ...typography.button },

    card: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    cardType: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
    cardTime: { fontSize: 12 },
    cardText: { fontSize: 15 },

    empty: { textAlign: 'center', marginTop: 8 },

    actionsFooter: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderTopWidth: 1,
        padding: 12,
        gap: 10,
        alignSelf: "stretch",
        marginHorizontal: -16,
        paddingHorizontal: 16,
        marginTop: -12,
    },

    exerciseCard: {
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    exerciseTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
    exerciseSub: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

    finishBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    finishText: { color: 'white', fontSize: 16, ...typography.button },

    segment: {
        flexDirection: 'row',
        borderRadius: 10,
        padding: 4,
        gap: 6,
        borderWidth: 1,
    },
    segmentChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
    segmentChipActive: { backgroundColor: '#0A84FF' },
    segmentText: { fontWeight: '700', textTransform: 'capitalize' },
    segmentTextActive: { color: 'white' },


    entryRow: { borderWidth: 1, borderRadius: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between' },
    entryText: { fontWeight: '700' },
    entryTime: { fontSize: 12 },

    nextBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
    nextBtnText: { color: 'white', fontSize: 15, ...typography.button },
    duoRow: { flexDirection: 'row', gap: 8 },
    duoBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
    duoBtnText: { color: 'white', fontSize: 15, ...typography.button },
    btnPrimary: { backgroundColor: '#0A84FF' },
    btnSuccess: { backgroundColor: '#22C55E' },
    btnDisabled: { opacity: 0.5 },
});
