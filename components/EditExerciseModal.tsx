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

    const ex = exerciseId ? getExercise(exerciseId) : null;

    const isCompleted = ex?.status === 'completed';
    const hasSets = (ex?.sets?.length ?? 0) > 0;
    const nextSetNumber = (ex?.sets?.length ?? 0) + 1;
    const selectedOrdinal = useMemo(() => {
        if (!activeSetId || !ex?.sets?.length) return null;
        const idx = ex.sets.findIndex((s) => s.id === activeSetId);
        return idx >= 0 ? idx + 1 : null;
    }, [activeSetId, ex?.sets]);


    // ----- Local UI state (unchanged look) -----
    const [activeSetId, setActiveSetId] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<{ setId: string; field: "weight" | "reps" } | null>(null);
    const [editingSetId, setEditingSetId] = useState<string | null>(null);
    const weightInputRefs = React.useRef<Record<string, TextInput | null>>({});
    const repsInputRefs = React.useRef<Record<string, TextInput | null>>({});
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const scheme = useColorScheme();
    const isDark = scheme === "dark";
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
    const activeSetIndex = useMemo(() => {
        if (!activeSetId) return -1;
        return orderedSets.findIndex((s) => s.id === activeSetId);
    }, [activeSetId, orderedSets]);
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
        addSet(-1, -1);
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

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.select({ ios: "padding", android: undefined })}
                    keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 }) as number}
                >
                    <View style={styles.splitWrap}>
                        <View style={styles.topSection}>
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
                            data={orderedSets}
                            keyExtractor={(s) => s.id}
                            keyboardShouldPersistTaps="always"
                            keyboardDismissMode="none"
                            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                            contentContainerStyle={{ paddingBottom: 16 }}
                            renderItem={({ item, index }) => {
                                const total = orderedSets.length;
                                const ordinal = isCompleted ? index + 1 : total - index; // adjust numbering dynamically
                                const isDone = !!item.completedAt;
                                const isActive = item.id === activeSetId;

                                return (
                                    <Pressable
                                        onPress={() => {
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
                                            <Pressable
                                                onPress={() => setActiveSetId(item.id)}
                                                onLongPress={() => {
                                                    setActiveSetId(item.id);
                                                    setEditingSetId(item.id);
                                                    weightInputRefs.current[item.id]?.focus();
                                                }}
                                                delayLongPress={250}
                                                hitSlop={6}
                                                style={styles.metricBlockCentered}
                                            >
                                                <Text style={[styles.metricLabel, { color: C.subText }]}>Weight</Text>
                                                <View
                                                    style={[
                                                        styles.metricInputWrap,
                                                        editingSetId === item.id && styles.metricInputActive,
                                                    ]}
                                                >
                                                    <TextInput
                                                        ref={(ref) => {
                                                            weightInputRefs.current[item.id] = ref;
                                                        }}
                                                        value={item.actualWeight < 0 ? "" : String(item.actualWeight)}
                                                        onFocus={() => {
                                                            setActiveSetId(item.id);
                                                            setFocusedField({ setId: item.id, field: "weight" });
                                                        }}
                                                        onBlur={() => {
                                                            setFocusedField((prev) =>
                                                                prev?.setId === item.id && prev.field === "weight" ? null : prev
                                                            );
                                                        }}
                                                        onChangeText={(val) => {
                                                            if (!exerciseId) return;
                                                            const n = Number(val);
                                                            if (!Number.isFinite(n)) return;
                                                            updateExerciseSet(exerciseId, item.id, { actualWeight: n });
                                                        }}
                                                        placeholder="Not Set"
                                                        placeholderTextColor={C.subText}
                                                        keyboardType="number-pad"
                                                        editable={!isCompleted}
                                                        style={[styles.metricInput, { color: C.text }]}
                                                    />
                                                </View>
                                            </Pressable>
                                            <View style={styles.metricDivider} />
                                            <Pressable
                                                onPress={() => setActiveSetId(item.id)}
                                                onLongPress={() => {
                                                    setActiveSetId(item.id);
                                                    setEditingSetId(item.id);
                                                    repsInputRefs.current[item.id]?.focus();
                                                }}
                                                delayLongPress={250}
                                                hitSlop={6}
                                                style={styles.metricBlockCentered}
                                            >
                                                <Text style={[styles.metricLabel, { color: C.subText }]}>
                                                    Reps
                                                </Text>
                                                <View
                                                    style={[
                                                        styles.metricInputWrap,
                                                        editingSetId === item.id && styles.metricInputActive,
                                                    ]}
                                                >
                                                    <TextInput
                                                        ref={(ref) => {
                                                            repsInputRefs.current[item.id] = ref;
                                                        }}
                                                        value={item.actualReps < 0 ? "" : String(item.actualReps)}
                                                        onFocus={() => {
                                                            setActiveSetId(item.id);
                                                            setFocusedField({ setId: item.id, field: "reps" });
                                                        }}
                                                        onBlur={() => {
                                                            setFocusedField((prev) =>
                                                                prev?.setId === item.id && prev.field === "reps" ? null : prev
                                                            );
                                                        }}
                                                        onChangeText={(val) => {
                                                            if (!exerciseId) return;
                                                            const n = Number(val);
                                                            if (!Number.isFinite(n)) return;
                                                            updateExerciseSet(exerciseId, item.id, { actualReps: n });
                                                        }}
                                                        placeholder="Not Set"
                                                        placeholderTextColor={C.subText}
                                                        keyboardType="number-pad"
                                                        editable={!isCompleted}
                                                        style={[styles.metricInput, { color: C.text }]}
                                                    />
                                                </View>
                                            </Pressable>
                                        </View>
                                    </Pressable>
                                );
                            }}
                        />
                            </View>
                        </View>

                        <KeyboardAvoidingView
                            behavior={Platform.select({ ios: "padding", android: "height" })}
                            keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 }) as number}
                            style={[styles.bottomSection, { borderTopColor: C.border }]}
                        >
                            <LinearGradient
                                colors={isDark ? ["#0B1D4D", "#1D4ED8"] : ["#93C5FD", "#3B82F6"]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.bottomGradient}
                            >
                                <View style={styles.accessoryStack}>
                                    <View style={styles.accessoryGrowTop} />
                                    <Pressable
                                        onPress={() => {
                                            if (keyboardVisible) {
                                                Keyboard.dismiss();
                                                setFocusedField(null);
                                                setEditingSetId(null);
                                                return;
                                            }
                                            handleAddSet();
                                        }}
                                        style={[styles.finishBtn, { backgroundColor: "#0A84FF" }]}
                                        hitSlop={10}
                                    >
                                        <Text style={[styles.finishText, typography.button]}>
                                            {keyboardVisible ? "Done" : `+ Set ${nextSetNumber}`}
                                        </Text>
                                    </Pressable>
                                    {selectedOrdinal !== null && (
                                        <View style={styles.selectedSetBlock}>
                                            <Text style={[styles.selectedSetText, { color: C.subText }, typography.body]}>
                                                Selected Set {selectedOrdinal}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={[styles.exerciseDivider, { backgroundColor: C.border }]} />
                                    <Pressable
                                        onLongPress={handleHoldForInfo}
                                        delayLongPress={300}
                                        style={styles.exerciseNameBlock}
                                    >
                                        <Text style={[styles.exerciseNameText, { color: C.text }, typography.body]} numberOfLines={1}>
                                            {ex?.name ?? "Exercise"}
                                        </Text>
                                        <Text style={[styles.exerciseHintText, { color: C.subText }, typography.body]}>
                                            Press and hold for more details
                                        </Text>
                                    </Pressable>
                                </View>
                            </LinearGradient>
                        </KeyboardAvoidingView>
                    </View>
                </KeyboardAvoidingView>

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
        minHeight: "28%",
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
    bottomGradient: { flex: 1, paddingHorizontal: 16, paddingVertical: 6, gap: 4 },
    addSetBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center" },
    addSetText: { color: "white", fontSize: 14, ...typography.button },

    setCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 10,
        marginHorizontal: 14,
    },
    setCardActive: { borderColor: "#22C55E", shadowColor: "#22C55E", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    setCardTitle: { fontSize: 14, fontWeight: "800", textAlign: "center", marginBottom: 6, ...typography.body },
    setCardDivider: { height: 1.5, alignSelf: "stretch", opacity: 0.6, marginBottom: 8 },
    setCardMetricsCentered: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14 },
    metricBlockCentered: { alignItems: "center", minWidth: 64 },
    metricDivider: { width: 1, height: 32, backgroundColor: "#e5e7eb", opacity: 0.25 },
    metricLabel: { fontSize: 12, fontWeight: "700", marginBottom: 2, ...typography.body },
    metricValue: { fontSize: 20, fontWeight: "800", ...typography.body },
    metricInputWrap: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, minWidth: 80 },
    metricInput: { fontSize: 20, fontWeight: "800", textAlign: "center" },
    metricInputActive: { borderWidth: 1, borderColor: "#22C55E", backgroundColor: "rgba(34, 197, 94, 0.15)" },
    accessoryStack: { alignItems: "center", justifyContent: "flex-end", gap: 8, flex: 1 },
    accessoryGrowTop: { flex: 1 },
    finishBtn: { paddingVertical: 12, borderRadius: 12, alignItems: "center", width: "100%" },
    finishText: { color: "white", fontSize: 16, ...typography.body },
    exerciseNameBlock: { alignItems: "center", gap: 4, paddingBottom: 6 },
    exerciseNameText: { fontSize: 16, fontWeight: "700" },
    exerciseHintText: { fontSize: 12 },
    exerciseDivider: { height: 1.5, alignSelf: "stretch", opacity: 0.5, marginTop: 6, marginBottom: 2 },
    selectedSetBlock: { width: "100%", gap: 6, alignItems: "center" },
    selectedSetText: { fontSize: 12 },
});
