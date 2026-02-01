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
    const nextSetNumber = (ex?.sets?.length ?? 0) + 1;
    // ----- Local UI state (unchanged look) -----
    const [activeSetId, setActiveSetId] = useState<string | null>(null);
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const listRef = React.useRef<FlatList<any>>(null);
    const [focusedField, setFocusedField] = useState<{ setId: string; field: "weight" | "reps" } | null>(null);
    const [weightDrafts, setWeightDrafts] = useState<Record<string, string>>({});
    const [repsDrafts, setRepsDrafts] = useState<Record<string, string>>({});
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
        const newSetId = addExerciseSet(exerciseId, w, r);
        setActiveSetId(newSetId);
        return newSetId;
    };

    // ----- Descriptor (unchanged copy, but reading from store) -----
    const orderedSets = useMemo(() => {
        if (!ex?.sets?.length) return [];
        return isCompleted ? ex.sets : [...ex.sets].slice().reverse();
    }, [ex?.sets, isCompleted]);
    const selectedOrdinal = useMemo(() => {
        if (!activeSetId) return null;
        const idx = orderedSets.findIndex((s) => s.id === activeSetId);
        if (idx < 0) return null;
        return isCompleted ? idx + 1 : orderedSets.length - idx;
    }, [activeSetId, orderedSets, isCompleted]);
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
    const confirmUndoLastSet = () => {
        if (!undoLastAction || !hasSets) return;
        Alert.alert("Undo last action? This cannot be undone.", "", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Undo",
                style: "destructive",
                onPress: () => {
                    const ok = undoLastAction();
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
                                disabled={!hasSets}
                            >
                                <Text style={[styles.undoText, !hasSets && styles.undoTextDisabled]}>Undo</Text>
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
                                    data={orderedSets}
                                    keyExtractor={(s) => s.id}
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
                                        const total = orderedSets.length;
                                        const ordinal = isCompleted ? index + 1 : total - index;
                                        const isDone = !!item.completedAt;
                                        const isActive = item.id === activeSetId;
                                        return (
                                            <Pressable
                                                onPress={() => {
                                                    if (keyboardVisible) return;
                                                    setActiveSetId(item.id);
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
                                                                setActiveSetId(item.id);
                                                                weightInputRefs.current[item.id]?.focus();
                                                            }}
                                                            style={[
                                                                styles.metricBlockCentered,
                                                                { backgroundColor: C.surfaceAlt },
                                                                focusedField?.setId === item.id &&
                                                                    focusedField.field === "weight" &&
                                                                    styles.metricBlockFocused,
                                                            ]}
                                                        >
                                                            <Text style={[styles.metricLabel, { color: C.subText }]}>Weight</Text>
                                                            <TextInput
                                                                ref={(ref) => {
                                                                    weightInputRefs.current[item.id] = ref;
                                                                }}
                                                                value={
                                                                    weightDrafts[item.id] ??
                                                                    (item.actualWeight < 0 ? "" : String(item.actualWeight))
                                                                }
                                                                returnKeyType="done"
                                                                onFocus={() => {
                                                                    setActiveSetId(item.id);
                                                                    setFocusedField({ setId: item.id, field: "weight" });
                                                                    scrollToSet(item.id);
                                                                    setWeightDrafts((prev) => {
                                                                        if (prev[item.id] !== undefined) return prev;
                                                                        return {
                                                                            ...prev,
                                                                            [item.id]:
                                                                                item.actualWeight < 0 ? "" : String(item.actualWeight),
                                                                        };
                                                                    });
                                                                }}
                                                                onBlur={() =>
                                                                    setFocusedField((prev) =>
                                                                        prev?.setId === item.id && prev.field === "weight" ? null : prev
                                                                    )
                                                                }
                                                                onChangeText={(val) =>
                                                                    setWeightDrafts((prev) => ({ ...prev, [item.id]: val }))
                                                                }
                                                                onEndEditing={(e) => {
                                                                    if (!exerciseId) return;
                                                                    const t = (e.nativeEvent.text ?? "").trim();
                                                                    if (t === "") {
                                                                        updateExerciseSet(exerciseId, item.id, { actualWeight: -1 });
                                                                    } else {
                                                                        const n = Number(t);
                                                                        if (Number.isFinite(n)) {
                                                                            updateExerciseSet(exerciseId, item.id, { actualWeight: n });
                                                                        }
                                                                    }
                                                                    setWeightDrafts((prev) => {
                                                                        const next = { ...prev };
                                                                        delete next[item.id];
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
                                                            setActiveSetId(item.id);
                                                            repsInputRefs.current[item.id]?.focus();
                                                        }}
                                                        style={[
                                                            styles.metricBlockCentered,
                                                            { backgroundColor: C.surfaceAlt },
                                                            isBodyweight && styles.metricBlockSingle,
                                                            focusedField?.setId === item.id &&
                                                                focusedField.field === "reps" &&
                                                                styles.metricBlockFocused,
                                                        ]}
                                                    >
                                                        <Text style={[styles.metricLabel, { color: C.subText }]}>Reps</Text>
                                                        <TextInput
                                                            ref={(ref) => {
                                                                repsInputRefs.current[item.id] = ref;
                                                            }}
                                                            value={
                                                                repsDrafts[item.id] ??
                                                                (item.actualReps < 0 ? "" : String(item.actualReps))
                                                            }
                                                            returnKeyType="done"
                                                            onFocus={() => {
                                                                setActiveSetId(item.id);
                                                                setFocusedField({ setId: item.id, field: "reps" });
                                                                scrollToSet(item.id);
                                                                setRepsDrafts((prev) => {
                                                                    if (prev[item.id] !== undefined) return prev;
                                                                    return {
                                                                        ...prev,
                                                                        [item.id]:
                                                                            item.actualReps < 0 ? "" : String(item.actualReps),
                                                                    };
                                                                });
                                                            }}
                                                            onBlur={() =>
                                                                setFocusedField((prev) =>
                                                                    prev?.setId === item.id && prev.field === "reps" ? null : prev
                                                                )
                                                            }
                                                            onChangeText={(val) =>
                                                                setRepsDrafts((prev) => ({ ...prev, [item.id]: val }))
                                                            }
                                                            onEndEditing={(e) => {
                                                                if (!exerciseId) return;
                                                                const t = (e.nativeEvent.text ?? "").trim();
                                                                if (t === "") {
                                                                    updateExerciseSet(exerciseId, item.id, { actualReps: -1 });
                                                                } else {
                                                                    const n = Number(t);
                                                                    if (Number.isFinite(n)) {
                                                                        updateExerciseSet(exerciseId, item.id, { actualReps: n });
                                                                    }
                                                                }
                                                                setRepsDrafts((prev) => {
                                                                    const next = { ...prev };
                                                                    delete next[item.id];
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
                                    {selectedOrdinal !== null ? `Set ${selectedOrdinal} selected` : "No sets selected"}
                                </Text>
                                <Pressable
                                    style={[styles.finishBtn, { backgroundColor: "#FBBF24" }]}
                                    hitSlop={10}
                                    disabled
                                >
                                    <Text style={[styles.finishText, { color: "#111827" }, typography.button]}>+ Note</Text>
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
});
