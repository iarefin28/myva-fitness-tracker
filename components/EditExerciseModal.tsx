// components/EditExerciseModal.tsx

import { useWorkoutStore } from "@/store/workoutStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { typography } from "@/theme/typography";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useExerciseLibrary } from "@/store/exerciseLibrary";


type Props = {
    visible: boolean;
    exerciseId: string | null;
    onClose: () => void;
    onDiscard?: () => void;
    onSave?: () => void;
    onShowExerciseDetail?: (exerciseId: string) => void;
};

export default function EditExerciseModal({
    visible,
    exerciseId,
    onClose,
    onDiscard,
    onSave,
    onShowExerciseDetail,
}: Props) {
    // store selectors
    const getExercise = useWorkoutStore((s) => s.getExercise);
    const addExerciseSet = useWorkoutStore((s) => s.addExerciseSet);
    const addExerciseGeneralNote = useWorkoutStore((s) => (s as any).addExerciseGeneralNote) as (
        exerciseId: string,
        note: { id: string; text: string; createdAt: number }
    ) => boolean;
    const updateExerciseGeneralNote = useWorkoutStore((s) => (s as any).updateExerciseGeneralNote) as (
        exerciseId: string,
        noteId: string,
        text: string
    ) => boolean;
    const removeExerciseGeneralNote = useWorkoutStore((s) => (s as any).removeExerciseGeneralNote) as (
        exerciseId: string,
        noteId: string
    ) => boolean;
    const addExerciseSetNote = useWorkoutStore((s) => (s as any).addExerciseSetNote) as (
        exerciseId: string,
        setId: string,
        note: { id: string; text: string; createdAt: number }
    ) => boolean;
    const updateExerciseSetNote = useWorkoutStore((s) => (s as any).updateExerciseSetNote) as (
        exerciseId: string,
        setId: string,
        noteId: string,
        text: string
    ) => boolean;
    const removeExerciseSetNote = useWorkoutStore((s) => (s as any).removeExerciseSetNote) as (
        exerciseId: string,
        setId: string,
        noteId: string
    ) => boolean;
    const updateExerciseSet = useWorkoutStore((s) => (s as any).updateExerciseSet) as (
        exerciseId: string,
        setId: string,
        next: { actualWeight?: number; actualReps?: number }
    ) => boolean;
    const undoLastAction = useWorkoutStore((s) => s.undoLastAction);
    const lastActionAt = useWorkoutStore((s) => s.draft?.lastActionAt);
    const exercisesById = useExerciseLibrary((s) => s.exercises);

    const ex = exerciseId ? getExercise(exerciseId) : null;
    const exerciseType = ex?.exerciseType ?? (ex?.libId ? exercisesById[ex.libId]?.type : undefined);
    const isBodyweight = exerciseType === 'bodyweight';

    const isCompleted = ex?.status === 'completed';
    const hasSets = (ex?.sets?.length ?? 0) > 0;
    const hasNotes = (ex?.generalNotes?.length ?? 0) > 0;
    const hasUndoableAction = hasSets || hasNotes;
    const nextSetNumber = (ex?.sets?.length ?? 0) + 1;
    // ----- Local UI state (unchanged look) -----
    const [activeSetId, setActiveSetId] = useState<string | null>(null);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [noteEditId, setNoteEditId] = useState<string | null>(null);
    const [activeSetNoteId, setActiveSetNoteId] = useState<string | null>(null);
    const [activeSetNoteEditId, setActiveSetNoteEditId] = useState<string | null>(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const listRef = React.useRef<FlatList<any>>(null);
    const [focusedField, setFocusedField] = useState<{ setId: string; field: "weight" | "reps" } | null>(null);
    const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
    const [repsDrafts, setRepsDrafts] = useState<Record<string, string>>({});
    const noteInputRefs = React.useRef<Record<string, TextInput | null>>({});
    const weightInputRefs = React.useRef<Record<string, TextInput | null>>({});
    const repsInputRefs = React.useRef<Record<string, TextInput | null>>({});
    const scheme = useColorScheme();
    const isDark = scheme === "dark";
    const insets = useSafeAreaInsets();
    const C = useMemo(
        () => ({
            bg: isDark ? "#0b0b0b" : "#F8FAFC",
            surface: isDark ? "#111" : "#FFFFFF",
            surfaceAlt: isDark ? "#0f0f10" : "#FFFFFF",
            border: isDark ? "#2a2a2a" : "#E2E8F0",
            borderStrong: isDark ? "#222" : "#CBD5E1",
            text: isDark ? "#FFFFFF" : "#0F172A",
            subText: isDark ? "#9ca3af" : "#64748B",
            muted: isDark ? "#6b7280" : "#94A3B8",
            grabber: isDark ? "#1f2937" : "#CBD5E1",
        }),
        [isDark]
    );

    useEffect(() => {
        if (!visible) return;
        setActiveSetId(null);
    }, [visible]);
    useEffect(() => {
        const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);
    // Do not auto-focus inputs on entry to avoid popping the keyboard.

    // ----- Header actions -----
    const confirmDiscardExercise = () => {
        Alert.alert("Discard exercise?", "This will remove the exercise from your list.", [
            { text: "Cancel", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: () => { onDiscard?.(); onClose(); } },
        ]);
    };

    // ----- Panel flows: Add / Complete Set (now writing to store) -----
    const addSet = (w: number, r: number) => {
        if (!exerciseId) return null;
        setActiveNoteId(null);
        const newSetId = addExerciseSet(exerciseId, w, r);
        setActiveSetId(newSetId);
        return newSetId;
    };

    // ----- Descriptor (unchanged copy, but reading from store) -----
    const orderedSets = useMemo(() => {
        if (!ex?.sets?.length) return [];
        return isCompleted ? ex.sets : [...ex.sets].slice().reverse();
    }, [ex?.sets, isCompleted]);
    const listItems = useMemo(() => {
        const sets = orderedSets.map((s) => ({ kind: "set" as const, createdAt: s.createdAt, set: s }));
        const notes = (ex?.generalNotes ?? []).map((n) => ({ kind: "note" as const, createdAt: n.createdAt, note: n }));
        const all = [...sets, ...notes];
        return all.sort((a, b) => (isCompleted ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
    }, [orderedSets, ex?.generalNotes, isCompleted]);
    const visibleItems = useMemo(() => {
        if (noteEditId) {
            return listItems.filter((it) => it.kind === "note" && it.note.id === noteEditId);
        }
        if (activeSetNoteEditId && activeSetId) {
            return listItems.filter((it) => it.kind === "set" && it.set.id === activeSetId);
        }
        if (keyboardVisible && activeNoteId) {
            return listItems.filter((it) => it.kind === "note" && it.note.id === activeNoteId);
        }
        if (!activeNoteId) return listItems;
        const activeNote = (ex?.generalNotes ?? []).find((n) => n.id === activeNoteId);
        if (!activeNote) return listItems;
        const isEmpty = !activeNote.text || activeNote.text.trim().length === 0;
        if (!isEmpty) return listItems;
        return listItems.filter((it) => it.kind === "note" && it.note.id === activeNoteId);
    }, [listItems, activeNoteId, noteEditId, ex?.generalNotes, keyboardVisible, activeSetNoteEditId, activeSetId]);
    const selectedOrdinal = useMemo(() => {
        if (!activeSetId) return null;
        const idx = orderedSets.findIndex((s) => s.id === activeSetId);
        if (idx < 0) return null;
        return isCompleted ? idx + 1 : orderedSets.length - idx;
    }, [activeSetId, orderedSets, isCompleted]);
    const noteNumberMap = useMemo(() => {
        const notes = [...(ex?.generalNotes ?? [])].sort((a, b) => a.createdAt - b.createdAt);
        const map: Record<string, number> = {};
        notes.forEach((n, i) => { map[n.id] = i + 1; });
        return map;
    }, [ex?.generalNotes]);
    const lastActionLabel = useMemo(() => {
        if (!ex) return "last action";
        let latestSet: { id: string; createdAt: number } | null = null;
        let latestNote: { id: string; createdAt: number } | null = null;
        let latestSetNote: { setId: string; noteId: string; createdAt: number } | null = null;
        ex.sets.forEach((s) => {
            if (!latestSet || s.createdAt > latestSet.createdAt) latestSet = { id: s.id, createdAt: s.createdAt };
            (s.setNotes ?? []).forEach((n) => {
                if (!latestSetNote || n.createdAt > latestSetNote.createdAt) {
                    latestSetNote = { setId: s.id, noteId: n.id, createdAt: n.createdAt };
                }
            });
        });
        (ex.generalNotes ?? []).forEach((n) => {
            if (!latestNote || n.createdAt > latestNote.createdAt) latestNote = { id: n.id, createdAt: n.createdAt };
        });
        if (!latestSet && !latestNote && !latestSetNote) return "last action";
        const latestGeneral = latestNote?.createdAt ?? -1;
        const latestSetCreated = latestSet?.createdAt ?? -1;
        const latestSetNoteCreated = latestSetNote?.createdAt ?? -1;
        const latest = Math.max(latestGeneral, latestSetCreated, latestSetNoteCreated);
        if (latestSetNote && latestSetNote.createdAt === latest) {
            const setIdx = orderedSets.findIndex((s) => s.id === latestSetNote.setId);
            const ordinal = setIdx >= 0 ? (isCompleted ? setIdx + 1 : orderedSets.length - setIdx) : "?";
            return `Note on Set ${ordinal}`;
        }
        if (latestNote && latestNote.createdAt === latest) {
            const num = noteNumberMap[latestNote.id] ?? "?";
            return `General Note ${num}`;
        }
        if (latestSet) {
            const idx = orderedSets.findIndex((s) => s.id === latestSet.id);
            const ordinal = idx >= 0 ? (isCompleted ? idx + 1 : orderedSets.length - idx) : "?";
            return `Set ${ordinal}`;
        }
        return "last action";
    }, [ex, orderedSets, isCompleted, noteNumberMap]);
    const scrollToSet = (setId: string) => {
        const idx = orderedSets.findIndex((s) => s.id === setId);
        if (idx < 0 || !listRef.current) return;
        listRef.current.scrollToIndex({ index: idx, animated: true, viewPosition: 0.2 });
    };
    const lastActionTime = useMemo(() => {
        if (lastActionAt) {
            return new Date(lastActionAt).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
            });
        }
        const fallback = ex?.sets?.reduce((latest, s) => (s.createdAt > latest ? s.createdAt : latest), 0);
        if (!fallback) return "--";
        return new Date(fallback).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
        });
    }, [lastActionAt, ex?.sets]);

    const handleHoldForInfo = () => {
        if (!ex?.libId) return;
        onShowExerciseDetail?.(ex.libId);
    };
    const handleAddSet = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        addSet(isBodyweight ? 0 : -1, -1);
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    };
    const handleAddGeneralNote = () => {
        if (!exerciseId) return;
        const now = Date.now();
        const id = `${now.toString(36)}-${Math.random().toString(36).slice(2)}`;
        addExerciseGeneralNote(exerciseId, { id, text: "", createdAt: now });
        setActiveSetId(null);
        setActiveNoteId(id);
        setNoteEditId(null);
        setActiveSetNoteId(null);
        setActiveSetNoteEditId(null);
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
    };
    const handleAddSetNote = () => {
        if (!exerciseId || !activeSetId) return;
        const now = Date.now();
        const id = `${now.toString(36)}-${Math.random().toString(36).slice(2)}`;
        addExerciseSetNote(exerciseId, activeSetId, { id, text: "", createdAt: now });
        setActiveNoteId(null);
        setNoteEditId(null);
        setActiveSetNoteId(id);
        setActiveSetNoteEditId(id);
    };
    const confirmUndoLastSet = () => {
        if (!undoLastAction || !hasUndoableAction) return;
        Alert.alert(`Undo ${lastActionLabel}?`, "This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Undo",
                style: "destructive",
                onPress: () => {
                    const ok = undoLastAction();
                    if (activeNoteId) {
                        setActiveNoteId(null);
                        setNoteEditId(null);
                    }
                    if (activeSetNoteId) {
                        setActiveSetNoteId(null);
                        setActiveSetNoteEditId(null);
                    }
                    if (ok) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                },
            },
        ]);
    };

    return (
        <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.root, { backgroundColor: C.bg }]}>
                <View className="grabber" style={[styles.grabber, { backgroundColor: C.grabber }]} />

                {/* Header */}
                <View style={styles.topBar}>
                    <View style={styles.barSide}>
                        {!isCompleted && (
                            <Pressable
                                onPress={confirmDiscardExercise}
                                hitSlop={10}
                                style={styles.iconBtn}
                                accessibilityLabel="Discard exercise"
                            >
                                <Ionicons name="trash-outline" size={22} color="#ef4444" />
                            </Pressable>
                        )}
                        {!isCompleted && (
                            <Pressable
                                onPress={confirmUndoLastSet}
                                hitSlop={10}
                                style={styles.undoTextBtn}
                                accessibilityLabel="Undo last set"
                                disabled={!hasUndoableAction}
                            >
                                <Text style={[styles.undoText, !hasUndoableAction && styles.undoTextDisabled]}>Undo</Text>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.barCenter}>
                        <Text style={[styles.topTitle, { color: C.text }]} numberOfLines={1}>
                            Edit Exercise
                        </Text>
                    </View>

                    <View style={[styles.barSide, { alignItems: "flex-end" }]}>
                        <View style={styles.autoSaveWrap}>
                            <Text style={styles.autoSaveTitle}>Auto Saved</Text>
                            <Text style={styles.autoSaveTime}>{lastActionTime}</Text>
                        </View>
                    </View>

                </View>

                <View style={{ flex: 1 }}>
                    <View style={styles.splitWrap}>
                        <KeyboardAvoidingView
                            style={styles.topSection}
                            behavior={Platform.select({ ios: "padding", android: "height" })}
                            keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 }) as number}
                        >
                            <View style={[styles.headerDivider, { backgroundColor: C.border }]} />
                            <LinearGradient
                                colors={isDark ? ["#0B1D4D", "#1D4ED8"] : ["#93C5FD", "#3B82F6"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.exerciseHeaderGradient}
                            >
                                <Pressable
                                    onLongPress={handleHoldForInfo}
                                    delayLongPress={300}
                                    style={styles.exerciseNameBlockTop}
                                >
                                    <Text style={[styles.exerciseNameText, { color: "#fff" }, typography.body]} numberOfLines={1}>
                                        {ex?.name ?? "Exercise"}
                                    </Text>
                                    <Text style={[styles.exerciseHintText, { color: "#E5E7EB" }, typography.body]}>
                                        Press and hold for more details
                                    </Text>
                                </Pressable>
                            </LinearGradient>
                            <View style={[styles.headerDivider, { backgroundColor: C.border }]} />

                            {/* Sets list */}
                            <View style={styles.listWrap}>
                                <FlatList
                                    ref={listRef}
                                    data={visibleItems}
                                    keyExtractor={(item) => (item.kind === "set" ? item.set.id : item.note.id)}
                                    keyboardShouldPersistTaps="always"
                                    onScrollToIndexFailed={({ averageItemLength, index }) => {
                                        listRef.current?.scrollToOffset({
                                            offset: Math.max(0, averageItemLength * index),
                                            animated: true,
                                        });
                                    }}
                                    ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                                    contentContainerStyle={{ paddingBottom: 140 }}
                                    renderItem={({ item, index }) => {
                                        if (item.kind === "note") {
                                            const noteNumber = noteNumberMap[item.note.id] ?? "?";
                                            const isActiveNote = activeNoteId === item.note.id;
                                            return (
                                                <Pressable
                                                    onPress={() => {
                                                        if (keyboardVisible) return;
                                                        setActiveSetId(null);
                                                        setActiveNoteId(item.note.id);
                                                        setNoteEditId(null);
                                                    }}
                                                    style={[
                                                        styles.setCard,
                                                        { backgroundColor: C.surface, borderColor: C.border },
                                                        isActiveNote && styles.setCardActive,
                                                    ]}
                                                >
                                                    <Text style={[styles.setCardTitle, { color: C.text }]}>
                                                        {`General Note ${noteNumber}`}
                                                    </Text>
                                                    <View style={[styles.setCardDivider, { backgroundColor: C.border }]} />
                                                    <TextInput
                                                        ref={(ref) => {
                                                            noteInputRefs.current[item.note.id] = ref;
                                                        }}
                                                        value={item.note.text}
                                                        onChangeText={(val) => {
                                                            if (!exerciseId) return;
                                                            updateExerciseGeneralNote(exerciseId, item.note.id, val);
                                                        }}
                                                        onSubmitEditing={() => {
                                                            if (!exerciseId) return;
                                                            const trimmed = (item.note.text ?? "").trim();
                                                            if (!trimmed) {
                                                                removeExerciseGeneralNote(exerciseId, item.note.id);
                                                            }
                                                            setNoteEditId(null);
                                                            setActiveNoteId(null);
                                                        }}
                                                        onEndEditing={() => {
                                                            if (!exerciseId) return;
                                                            const trimmed = (item.note.text ?? "").trim();
                                                            if (!trimmed) {
                                                                removeExerciseGeneralNote(exerciseId, item.note.id);
                                                            }
                                                            setNoteEditId(null);
                                                            setActiveNoteId(null);
                                                        }}
                                                        placeholder="Type your note..."
                                                        placeholderTextColor={C.subText}
                                                        autoFocus={isActiveNote}
                                                        keyboardType="default"
                                                        pointerEvents="none"
                                                        style={[styles.noteInput, { color: C.text }]}
                                                    />
                                                </Pressable>
                                            );
                                        }
                                        const setItem = item.set;
                                        const setNotes = setItem.setNotes ?? [];
                                        const setNoteNumberMap: Record<string, number> = {};
                                        [...setNotes].sort((a, b) => a.createdAt - b.createdAt).forEach((n, i) => {
                                            setNoteNumberMap[n.id] = i + 1;
                                        });
                                        const activeSetNote = activeSetNoteId
                                            ? setNotes.find((n) => n.id === activeSetNoteId)
                                            : undefined;
                                        const isEditingSetNote = activeSetNoteEditId && activeSetNote;
                                        const setIndex = orderedSets.findIndex((s) => s.id === setItem.id);
                                        const total = orderedSets.length;
                                        const ordinal = isCompleted ? setIndex + 1 : total - setIndex;
                                        const isDone = !!setItem.completedAt;
                                        const isActive = setItem.id === activeSetId;
                                        return (
                                            <>
                                                <Pressable
                                                    onPress={() => {
                                                        if (keyboardVisible) return;
                                                        setActiveNoteId(null);
                                                        setActiveSetId(setItem.id);
                                                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                                    }}
                                                    style={[
                                                        styles.setCard,
                                                        { backgroundColor: C.surface, borderColor: C.border },
                                                        isActive && styles.setCardActive,
                                                    ]}
                                                >
                                                    <Text style={[styles.setCardTitle, { color: C.text }]}>
                                                        {`${isDone ? "Completed" : "Working"} Set ${ordinal}`}
                                                    </Text>
                                                    <View style={[styles.setCardDivider, { backgroundColor: C.border }]} />
                                                    <View style={styles.setCardMetricsCentered}>
                                                        {!isBodyweight && (
                                                            <Pressable
                                                                onPress={() => {
                                                                    setActiveNoteId(null);
                                                                    setActiveSetId(setItem.id);
                                                                    weightInputRefs.current[setItem.id]?.focus();
                                                                }}
                                                                style={[
                                                                    styles.metricBlockCentered,
                                                                    { backgroundColor: C.surfaceAlt },
                                                                    focusedField?.setId === setItem.id &&
                                                                        focusedField.field === "weight" &&
                                                                        styles.metricBlockFocused,
                                                                ]}
                                                            >
                                                                <Text style={[styles.metricLabel, { color: C.subText }]}>Weight</Text>
                                                                <TextInput
                                                                    ref={(ref) => {
                                                                        weightInputRefs.current[setItem.id] = ref;
                                                                    }}
                                                                    value={
                                                                        weightDrafts[setItem.id] ??
                                                                        (setItem.actualWeight < 0 ? "" : String(setItem.actualWeight))
                                                                    }
                                                                    returnKeyType="done"
                                                                    onFocus={() => {
                                                                        setActiveNoteId(null);
                                                                        setActiveSetId(setItem.id);
                                                                        setFocusedField({ setId: setItem.id, field: "weight" });
                                                                        scrollToSet(setItem.id);
                                                                        setWeightDrafts((prev) => {
                                                                            if (prev[setItem.id] !== undefined) return prev;
                                                                            return {
                                                                                ...prev,
                                                                                [setItem.id]:
                                                                                    setItem.actualWeight < 0 ? "" : String(setItem.actualWeight),
                                                                            };
                                                                        });
                                                                    }}
                                                                    onBlur={() =>
                                                                        setFocusedField((prev) =>
                                                                            prev?.setId === setItem.id && prev.field === "weight" ? null : prev
                                                                        )
                                                                    }
                                                                    onChangeText={(val) =>
                                                                        setWeightDrafts((prev) => ({ ...prev, [setItem.id]: val }))
                                                                    }
                                                                    onEndEditing={(e) => {
                                                                        if (!exerciseId) return;
                                                                        const t = (e.nativeEvent.text ?? "").trim();
                                                                        if (t === "") {
                                                                            updateExerciseSet(exerciseId, setItem.id, { actualWeight: -1 });
                                                                        } else {
                                                                            const n = Number(t);
                                                                            if (Number.isFinite(n)) {
                                                                                updateExerciseSet(exerciseId, setItem.id, { actualWeight: n });
                                                                            }
                                                                        }
                                                                        setWeightDrafts((prev) => {
                                                                            const next = { ...prev };
                                                                            delete next[setItem.id];
                                                                            return next;
                                                                        });
                                                                    }}
                                                                    placeholder="Not Set"
                                                                    placeholderTextColor={C.subText}
                                                                    keyboardType="number-pad"
                                                                    style={[styles.metricValue, { color: C.text }]}
                                                                />
                                                            </Pressable>
                                                        )}
                                                        {!isBodyweight && (
                                                            <View
                                                                style={[
                                                                    styles.metricDivider,
                                                                    { backgroundColor: isDark ? "#e5e7eb" : "#94A3B8", opacity: isDark ? 0.25 : 0.6 },
                                                                ]}
                                                            />
                                                        )}
                                                        <Pressable
                                                            onPress={() => {
                                                                setActiveNoteId(null);
                                                                setActiveSetId(setItem.id);
                                                                repsInputRefs.current[setItem.id]?.focus();
                                                            }}
                                                            style={[
                                                                styles.metricBlockCentered,
                                                                { backgroundColor: C.surfaceAlt },
                                                                isBodyweight && styles.metricBlockSingle,
                                                                focusedField?.setId === setItem.id &&
                                                                    focusedField.field === "reps" &&
                                                                    styles.metricBlockFocused,
                                                            ]}
                                                        >
                                                            <Text style={[styles.metricLabel, { color: C.subText }]}>Reps</Text>
                                                            <TextInput
                                                                ref={(ref) => {
                                                                    repsInputRefs.current[setItem.id] = ref;
                                                                }}
                                                                value={
                                                                    repsDrafts[setItem.id] ??
                                                                    (setItem.actualReps < 0 ? "" : String(setItem.actualReps))
                                                                }
                                                                returnKeyType="done"
                                                                onFocus={() => {
                                                                    setActiveNoteId(null);
                                                                    setActiveSetId(setItem.id);
                                                                    setFocusedField({ setId: setItem.id, field: "reps" });
                                                                    scrollToSet(setItem.id);
                                                                    setRepsDrafts((prev) => {
                                                                        if (prev[setItem.id] !== undefined) return prev;
                                                                        return {
                                                                            ...prev,
                                                                            [setItem.id]:
                                                                                setItem.actualReps < 0 ? "" : String(setItem.actualReps),
                                                                        };
                                                                    });
                                                                }}
                                                                onBlur={() =>
                                                                    setFocusedField((prev) =>
                                                                        prev?.setId === setItem.id && prev.field === "reps" ? null : prev
                                                                    )
                                                                }
                                                                onChangeText={(val) =>
                                                                    setRepsDrafts((prev) => ({ ...prev, [setItem.id]: val }))
                                                                }
                                                                onEndEditing={(e) => {
                                                                    if (!exerciseId) return;
                                                                    const t = (e.nativeEvent.text ?? "").trim();
                                                                    if (t === "") {
                                                                        updateExerciseSet(exerciseId, setItem.id, { actualReps: -1 });
                                                                    } else {
                                                                        const n = Number(t);
                                                                        if (Number.isFinite(n)) {
                                                                            updateExerciseSet(exerciseId, setItem.id, { actualReps: n });
                                                                        }
                                                                    }
                                                                    setRepsDrafts((prev) => {
                                                                        const next = { ...prev };
                                                                        delete next[setItem.id];
                                                                        return next;
                                                                    });
                                                                }}
                                                                placeholder="Not Set"
                                                                placeholderTextColor={C.subText}
                                                                keyboardType="number-pad"
                                                                style={[styles.metricValue, { color: C.text }]}
                                                            />
                                                        </Pressable>
                                                    </View>
                                                </Pressable>
                                                {isEditingSetNote && (
                                                    <View style={[styles.setCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                                                        <Text style={[styles.setCardTitle, { color: C.text }]}>
                                                            {`Note ${setNoteNumberMap[activeSetNote!.id] ?? "?"} on Set ${ordinal}`}
                                                        </Text>
                                                        <View style={[styles.setCardDivider, { backgroundColor: C.border }]} />
                                                        <TextInput
                                                            value={activeSetNote!.text}
                                                            onChangeText={(val) => {
                                                                if (!exerciseId) return;
                                                                updateExerciseSetNote(exerciseId, setItem.id, activeSetNote!.id, val);
                                                            }}
                                                            onSubmitEditing={() => {
                                                                if (!exerciseId) return;
                                                                const trimmed = (activeSetNote!.text ?? "").trim();
                                                                if (!trimmed) {
                                                                    removeExerciseSetNote(exerciseId, setItem.id, activeSetNote!.id);
                                                                }
                                                                setActiveSetNoteEditId(null);
                                                                setActiveSetNoteId(null);
                                                            }}
                                                            onEndEditing={() => {
                                                                if (!exerciseId) return;
                                                                const trimmed = (activeSetNote!.text ?? "").trim();
                                                                if (!trimmed) {
                                                                    removeExerciseSetNote(exerciseId, setItem.id, activeSetNote!.id);
                                                                }
                                                                setActiveSetNoteEditId(null);
                                                                setActiveSetNoteId(null);
                                                            }}
                                                            placeholder="Type your note..."
                                                            placeholderTextColor={C.subText}
                                                            autoFocus
                                                            keyboardType="default"
                                                            style={[styles.noteInput, { color: C.text }]}
                                                        />
                                                    </View>
                                                )}
                                            </>
                                        );
                                    }}
                                />
                            </View>
                        </KeyboardAvoidingView>

                        <View style={[styles.bottomSection, { borderTopColor: C.border }]}>
                            <LinearGradient
                                colors={isDark ? ["#0B1D4D", "#1D4ED8"] : ["#93C5FD", "#3B82F6"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[
                                    styles.bottomFooter,
                                    {
                                        borderTopColor: isDark ? "#222" : "#E2E8F0",
                                        paddingBottom: 12 + insets.bottom,
                                    },
                                ]}
                            >
                                <Text style={[styles.exerciseNameText, { color: "#fff", textAlign: "center" }, typography.body]}>
                                    {activeNoteId
                                        ? `General Note ${noteNumberMap[activeNoteId] ?? "?"} selected`
                                        : selectedOrdinal !== null
                                            ? `Set ${selectedOrdinal} selected`
                                            : "No sets selected"}
                                </Text>
                                {activeNoteId ? (
                                    <Pressable
                                        style={[styles.finishBtn, { backgroundColor: "#ef4444" }]}
                                        hitSlop={10}
                                        onPress={() => setActiveNoteId(null)}
                                    >
                                        <Text style={[styles.finishText, { color: "#ffffff" }, typography.button]}>
                                            Unselect
                                        </Text>
                                    </Pressable>
                                ) : selectedOrdinal !== null ? (
                                    <Pressable
                                        style={[styles.finishBtn, { backgroundColor: "#ef4444" }]}
                                        hitSlop={10}
                                        onPress={() => setActiveSetId(null)}
                                    >
                                        <Text style={[styles.finishText, { color: "#ffffff" }, typography.button]}>
                                            {`Unselect Set ${selectedOrdinal}`}
                                        </Text>
                                    </Pressable>
                                ) : null}
                                <Pressable
                                    style={[styles.finishBtn, { backgroundColor: "#FBBF24" }]}
                                    hitSlop={10}
                                    onPress={() => {
                                        if (activeNoteId) {
                                            if (keyboardVisible) return;
                                            setNoteEditId(activeNoteId);
                                            requestAnimationFrame(() => noteInputRefs.current[activeNoteId]?.focus());
                                            return;
                                        }
                                        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                                        if (selectedOrdinal === null) {
                                            handleAddGeneralNote();
                                        } else {
                                            handleAddSetNote();
                                        }
                                    }}
                                >
                                    <Text style={[styles.finishText, { color: "#111827" }, typography.button]}>
                                        {activeNoteId
                                            ? "Edit"
                                            : selectedOrdinal !== null
                                                ? "+ Set Specific Note"
                                                : "+ General Note"}
                                    </Text>
                                </Pressable>
                                <Pressable
                                    onPress={handleAddSet}
                                    style={[styles.finishBtn, { backgroundColor: "#0A84FF" }]}
                                    hitSlop={10}
                                >
                                    <Text style={[styles.finishText, typography.button]}>
                                        {`+ Set ${nextSetNumber}`}
                                    </Text>
                                </Pressable>
                            </LinearGradient>
                        </View>
                    </View>
                </View>

                {/* No accessory bar needed */}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#0b0b0b" },
    grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "#1f2937", marginTop: 8, marginBottom: 4 },

    topBar: { height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
    barSide: { width: 110, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
    barCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
    topTitle: { color: "white", fontSize: 16, fontWeight: "800" },
    iconBtn: { padding: 8, borderRadius: 10 },
    undoTextBtn: { paddingVertical: 4, paddingHorizontal: 4 },
    undoText: { color: "#ef4444", fontWeight: "400", fontSize: 13 },
    undoTextDisabled: { color: "#6b7280" },
    autoSaveWrap: { alignItems: "flex-end" },
    autoSaveTitle: { color: "#9ca3af", fontSize: 11 },
    autoSaveTime: { color: "#9ca3af", fontSize: 11 },

    exerciseHeaderGradient: { marginHorizontal: 14, borderRadius: 14, paddingVertical: 10, marginTop: 8 },
    exerciseNameBlockTop: { alignItems: "center", gap: 4, paddingHorizontal: 16 },
    headerDivider: { height: 1, alignSelf: "stretch", opacity: 0.6, marginTop: 8, marginHorizontal: 16 },

    listWrap: { flex: 1, marginTop: 8 },
    splitWrap: { flex: 1 },
    topSection: { flex: 1 },
    bottomSection: {
        flexShrink: 0,
        borderTopWidth: 1,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        alignItems: "stretch",
        justifyContent: "flex-start",
        paddingTop: 0,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.22,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: -6 },
        elevation: 8,
    },
    bottomFooter: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, gap: 8 },

    setCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 10,
        marginHorizontal: 14,
    },
    setCardActive: { borderColor: "#22C55E", shadowColor: "#22C55E", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    setCardTitle: { fontSize: 14, fontWeight: "800", textAlign: "center", marginBottom: 6, ...typography.body },
    setCardDivider: { height: 1.5, alignSelf: "stretch", opacity: 0.6, marginBottom: 8 },
    setCardMetricsCentered: { flexDirection: "row", alignItems: "stretch", justifyContent: "center", gap: 8 },
    metricBlockCentered: { alignItems: "center", width: 88, paddingVertical: 8, borderRadius: 10 },
    metricBlockSingle: { width: 140 },
    metricDivider: { width: 1, height: "100%", backgroundColor: "#e5e7eb", opacity: 0.25 },
    metricBlockFocused: { borderWidth: 1, borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.15)" },
    metricLabel: { fontSize: 12, fontWeight: "700", marginBottom: 2, ...typography.body },
    metricValue: { fontSize: 20, fontWeight: "800", ...typography.body },
    metricInputWrap: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, minWidth: 80 },
    metricInput: { fontSize: 20, fontWeight: "800", textAlign: "center" },
    metricInputActive: { borderWidth: 1, borderColor: "#22C55E", backgroundColor: "rgba(34, 197, 94, 0.15)" },
    finishBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", width: "100%" },
    finishText: { color: "white", fontSize: 16, ...typography.body },
    exerciseNameText: { fontSize: 16, fontWeight: "700" },
    exerciseHintText: { fontSize: 12 },
    noteInput: { fontSize: 14, fontWeight: "600", paddingVertical: 4, textAlign: "center" },
});
