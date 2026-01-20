// components/EditExerciseModal.tsx

import { useWorkoutStore } from "@/store/workoutStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
    InputAccessoryView,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    useColorScheme,
    View,
} from "react-native";

import { useEffect } from "react";

type Props = {
    visible: boolean;
    exerciseId: string | null;
    onClose: () => void;
    onDiscard?: () => void;
    onSave?: () => void;
    onShowExerciseDetail?: (exerciseId: string) => void;
};

const INPUT_ACCESSORY_ID = "edit-exercise-done-accessory";

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
    const undoLastAction = useWorkoutStore((s) => s.undoLastAction);

    const ex = exerciseId ? getExercise(exerciseId) : null;

    const isCompleted = ex?.status === 'completed';
    const hasSets = (ex?.sets?.length ?? 0) > 0;
    const nextSetNumber = (ex?.sets?.length ?? 0) + 1;


    // ----- Local UI state (unchanged look) -----
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [activeSetId, setActiveSetId] = useState<string | null>(null);
    const [accessoryMode, setAccessoryMode] = useState<"start" | "set">("start");
    const [activeField, setActiveField] = useState<"weight" | "reps" | null>(null);

    const editFieldRef = useRef<TextInput>(null);
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
            accessoryBg: isDark ? "#0f0f10" : "#FFFFFF",
            accessoryBorder: isDark ? "#222" : "#E2E8F0",
        }),
        [isDark]
    );

    useEffect(() => {
        if (!visible) return;
        setAccessoryMode("start");
        setActiveField(null);
    }, [visible]);
    useEffect(() => {
        if (!visible || isCompleted) return;
        setTimeout(() => editFieldRef.current?.focus(), 150);
    }, [visible, isCompleted]);

    const currentSetNumber = Math.max(1, (ex?.sets.length ?? 0));
    const displaySetNumber = accessoryMode === "set" ? nextSetNumber : currentSetNumber;

    const fmtTime = (ts?: number) => (ts ? new Date(ts).toLocaleTimeString() : "—");

    // ----- Header actions -----
    const confirmDiscardExercise = () => {
        Alert.alert("Discard exercise?", "This will remove the exercise from your list.", [
            { text: "Cancel", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: () => { onDiscard?.(); onClose(); } },
        ]);
    };

    const handleSaveExercise = () => {
        onSave?.();
        onClose();
    };

    // ----- Panel flows: Add / Complete Set (now writing to store) -----
    const addSet = () => {
        if (!exerciseId) return;
        const w = Number(weight);
        const r = Number(reps);
        if (!Number.isFinite(w) || w < 0 || !Number.isFinite(r) || r <= 0) return;

        const newSetId = addExerciseSet(exerciseId, w, r);
        setActiveSetId(newSetId);
    };

    // ----- Descriptor (unchanged copy, but reading from store) -----
    // ----- Keyboard flow -----
    const handleWeightSubmit = () => {
        setActiveField("reps");
        editFieldRef.current?.focus();
    };
    const canAdd = weight.trim().length > 0 && reps.trim().length > 0;

    const handleHoldForInfo = () => {
        if (!ex?.libId) return;
        onShowExerciseDetail?.(ex.libId);
    };
    const handleStartFirstSet = () => {
        setAccessoryMode("set");
        setActiveField("weight");
        setTimeout(() => editFieldRef.current?.focus(), 50);
    };
    const handleConfirmSetDetails = () => {
        if (!canAdd) return;
        addSet();
        setWeight("");
        setReps("");
        setActiveField(null);
        setAccessoryMode("start");
    };
    const focusWeightField = () => {
        setActiveField("weight");
        editFieldRef.current?.focus();
    };
    const focusRepsField = () => {
        setActiveField("reps");
        editFieldRef.current?.focus();
    };
    const confirmUndoLastSet = () => {
        if (!undoLastAction || !hasSets) return;
        Alert.alert("Undo last action? This cannot be undone.", "", [
            { text: "Cancel", style: "cancel" },
            { text: "Undo", style: "destructive", onPress: () => undoLastAction() },
        ]);
    };

    return (
        <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
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
                    </View>

                    <View style={styles.barCenter}>
                        <Text style={[styles.topTitle, { color: C.text }]} numberOfLines={1}>
                            Edit Exercise
                        </Text>
                    </View>

                    <View style={[styles.barSide, { alignItems: "flex-end" }]}>
                        {!isCompleted && (
                            <View style={styles.barActions}>
                                {hasSets && (
                                    <Pressable
                                        onPress={confirmUndoLastSet}
                                        hitSlop={10}
                                        style={styles.undoIconBtn}
                                        accessibilityLabel="Undo last set"
                                    >
                                        <Ionicons name="arrow-undo" size={18} color="#fecaca" />
                                    </Pressable>
                                )}
                                <Pressable
                                    onPress={handleSaveExercise}
                                    hitSlop={10}
                                    style={styles.saveBtn}
                                    accessibilityLabel="Save exercise"
                                >
                                    <Text style={styles.saveText}>Save</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>

                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.select({ ios: "padding", android: undefined })}
                    keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 }) as number}
                >
                    {/* Locked name (from store) */}
                    <Pressable
                        style={[styles.nameRow, { backgroundColor: C.surface, borderColor: C.border }]}
                        onLongPress={handleHoldForInfo}
                        delayLongPress={300}
                    >
                        <Ionicons name="lock-closed-outline" size={16} color={C.subText} style={{ marginRight: 8 }} />
                        <TextInput
                            value={ex?.name ?? ""}
                            editable={false}
                            placeholder="Exercise name"
                            placeholderTextColor={C.muted}
                            style={[styles.nameInput, { flex: 1, color: C.text }]}
                        />
                        <Text style={[styles.holdHint, { color: C.subText }]}>Hold for more info</Text>
                    </Pressable>

                    {/* Sets list */}
                    <View style={styles.listWrap}>
                        <FlatList
                            data={
                                isCompleted
                                    ? ex?.sets ?? []                      // natural order when completed
                                    : [...(ex?.sets ?? [])].slice().reverse() // reverse order when active/in progress
                            }
                            keyExtractor={(s) => s.id}
                            keyboardShouldPersistTaps="always"
                            keyboardDismissMode="none"
                            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                            contentContainerStyle={{ paddingBottom: 16 }}
                            renderItem={({ item, index }) => {
                                const total = ex?.sets.length ?? 0;
                                const ordinal = isCompleted ? index + 1 : total - index; // adjust numbering dynamically
                                const isDone = !!item.completedAt;
                                const isActive = item.id === activeSetId;

                                return (
                                    <View
                                        style={[
                                            styles.setCard,
                                            { backgroundColor: C.surface, borderColor: C.border },
                                            isActive && styles.setCardActive,
                                        ]}
                                    >
                                        <View style={styles.setCardHeader}>
                                            <Text style={[styles.setCardTitle, { color: C.text }]}>Set {ordinal}</Text>
                                            <View style={styles.setCardBadge}>
                                                <Text style={styles.setCardBadgeText}>{isDone ? "Completed" : "Working"}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.setCardMetrics}>
                                            <View style={styles.metricBlock}>
                                                <Text style={[styles.metricLabel, { color: C.subText }]}>Weight</Text>
                                                <Text style={[styles.metricValue, { color: C.text }]}>{item.actualWeight}</Text>
                                            </View>
                                            <View style={styles.metricBlock}>
                                                <Text style={[styles.metricLabel, { color: C.subText }]}>Reps</Text>
                                                <Text style={[styles.metricValue, { color: C.text }]}>{item.actualReps}</Text>
                                            </View>
                                            <View style={styles.metricBlock}>
                                                <Text style={[styles.metricLabel, { color: C.subText }]}>Type</Text>
                                                <Text style={[styles.metricValue, { color: C.text }]}>Working</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.setCardTime, { color: C.subText }]}>
                                            Added {fmtTime(item.createdAt)}
                                        </Text>
                                    </View>
                                );
                            }}
                        />
                    </View>
                </KeyboardAvoidingView>

                {/* iOS input accessory */}
                {Platform.OS === "ios" && (
                    <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
                        <View style={[styles.accessory, { backgroundColor: C.accessoryBg, borderTopColor: C.accessoryBorder }]}>
                            {accessoryMode === "start" ? (
                                <View style={styles.accessoryRow}>
                                    <Pressable style={[styles.accessoryBtn, styles.accessoryNoteBtn, styles.accessoryNoteBtnDisabled]} hitSlop={10} disabled>
                                        <Text style={styles.accessoryNoteText}>Add Note</Text>
                                    </Pressable>
                                    <View style={styles.accessoryLogoWrap}>
                                        <Image
                                            source={
                                                isDark
                                                    ? require("../assets/HomescreenLogoMYVAWhite.png")
                                                    : require("../assets/HomescreenLogoMYVABlack.png")
                                            }
                                            style={styles.accessoryLogo}
                                            resizeMode="contain"
                                            accessibilityLabel="MYVA Fitness"
                                        />
                                    </View>
                                    <View style={styles.accessoryStartGroup}>
                                        <Pressable
                                            onPress={handleStartFirstSet}
                                            style={[styles.accessoryBtn, styles.accessoryStartBtn]}
                                            hitSlop={10}
                                        >
                                            <Text style={styles.accessoryStartText}>Add Set {nextSetNumber}</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.accessorySetRow}>
                                    <View style={[styles.accessorySetPill, { backgroundColor: isDark ? "#0b0b0b" : "#111827" }]}>
                                        <Text style={styles.accessorySetLabel}>Set {displaySetNumber}</Text>
                                    </View>
                                    <Pressable style={[styles.accessoryBtn, styles.accessoryDetailsBtn, styles.accessoryDetailsBtnActive]} hitSlop={8} disabled>
                                        <Text style={styles.accessoryDetailsText}>Details</Text>
                                    </Pressable>
                                        <Pressable
                                            onPressIn={focusWeightField}
                                            style={[
                                                styles.accessoryInputPill,
                                                {
                                                    backgroundColor: isDark ? "#0b0b0b" : "#F1F5F9",
                                                    borderColor: isDark ? "#2a2a2a" : "#CBD5E1",
                                                },
                                                activeField === "weight" && styles.accessoryInputPillActive,
                                            ]}
                                            hitSlop={8}
                                        >
                                            <Text style={[styles.accessoryInputText, { color: isDark ? "#e5e7eb" : "#0f172a" }]}>
                                                {weight.trim() || "Weight"}
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPressIn={focusRepsField}
                                            style={[
                                                styles.accessoryInputPill,
                                                {
                                                    backgroundColor: isDark ? "#0b0b0b" : "#F1F5F9",
                                                    borderColor: isDark ? "#2a2a2a" : "#CBD5E1",
                                                },
                                                activeField === "reps" && styles.accessoryInputPillActive,
                                            ]}
                                            hitSlop={8}
                                        >
                                            <Text style={[styles.accessoryInputText, { color: isDark ? "#e5e7eb" : "#0f172a" }]}>
                                                {reps.trim() || "Reps"}
                                            </Text>
                                        </Pressable>
                                    <Pressable
                                        onPress={handleConfirmSetDetails}
                                        style={[styles.accessoryBtn, styles.accessoryCheckBtn, !canAdd && styles.accessoryCheckBtnDisabled]}
                                        hitSlop={8}
                                        disabled={!canAdd}
                                    >
                                        <Ionicons name="checkmark" size={18} color={canAdd ? "#ffffff" : "#9ca3af"} />
                                    </Pressable>
                                </View>
                            )}
                        </View>
                    </InputAccessoryView>
                )}

                <TextInput
                    ref={editFieldRef}
                    value={activeField === "reps" ? reps : weight}
                    onChangeText={(val) => {
                        if (activeField === "reps") setReps(val);
                        else setWeight(val);
                    }}
                    keyboardType="number-pad"
                    inputAccessoryViewID={INPUT_ACCESSORY_ID}
                    style={styles.hiddenAccessoryInput}
                    editable
                    blurOnSubmit={false}
                    onFocus={() => {
                        if (!activeField) setActiveField("weight");
                    }}
                    onBlur={() => {
                        if (!visible || isCompleted) return;
                        setTimeout(() => editFieldRef.current?.focus(), 0);
                    }}
                    onSubmitEditing={handleWeightSubmit}
                />
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#0b0b0b" },
    grabber: { alignSelf: "center", width: 44, height: 5, borderRadius: 3, backgroundColor: "#1f2937", marginTop: 8, marginBottom: 4 },

    topBar: { height: 56, flexDirection: "row", alignItems: "center", paddingHorizontal: 10 },
    barSide: { width: 110, alignItems: "flex-start", justifyContent: "center" },
    barCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
    topTitle: { color: "white", fontSize: 16, fontWeight: "800" },
    iconBtn: { padding: 8, borderRadius: 10 },
    saveBtn: { backgroundColor: "#0A84FF", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    saveText: { color: "white", fontWeight: "800" },
    barActions: { flexDirection: "row", alignItems: "center", gap: 8 },
    undoIconBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: "#3f1f1f", borderWidth: 1, borderColor: "#7f1d1d" },

    nameRow: {
        marginHorizontal: 14,
        marginTop: 4,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#2a2a2a",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    nameInput: { color: "white", fontSize: 15, opacity: 0.85 },
    holdHint: { color: "#9ca3af", fontSize: 12, marginLeft: 8 },

    listWrap: { flex: 1, marginTop: 8 },

    setCard: {
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 14,
    },
    setCardActive: { borderColor: "#22C55E", shadowColor: "#22C55E", shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
    setCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
    setCardTitle: { fontSize: 16, fontWeight: "800" },
    setCardBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#111827", borderWidth: 1, borderColor: "#1f2937" },
    setCardBadgeText: { color: "#e5e7eb", fontWeight: "800", fontSize: 12 },
    setCardMetrics: { flexDirection: "row", gap: 14, marginBottom: 10 },
    metricBlock: { minWidth: 70 },
    metricLabel: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
    metricValue: { fontSize: 18, fontWeight: "800" },
    setCardTime: { fontSize: 12, fontWeight: "600" },
    // accessory
    accessory: {
        backgroundColor: "#0f0f10",
        borderTopWidth: 1,
        borderTopColor: "#222",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    accessoryRow: { flexDirection: "row", alignItems: "center" },
    accessoryBtn: { backgroundColor: "#0A84FF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#1f2937" },
    accessoryNoteBtn: { backgroundColor: "#374151" },
    accessoryNoteBtnDisabled: { backgroundColor: "#1f2937" },
    accessoryNoteText: { color: "#d1d5db", fontWeight: "800" },
    accessoryStartBtn: { backgroundColor: "#22C55E" },
    accessoryStartText: { color: "white", fontWeight: "800" },
    accessoryStartGroup: { flexDirection: "row", alignItems: "center", gap: 8 },
    accessoryLogoWrap: { flex: 1, height: 36, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    accessoryLogo: { width: 200, height: 40, transform: [{ scale: 3 }] },
    accessorySetRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
    accessorySetPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    accessorySetLabel: { color: "#e5e7eb", fontWeight: "800" },
    accessoryDetailsBtn: { backgroundColor: "#111827", borderWidth: 1, borderColor: "#7c3aed" },
    accessoryDetailsBtnActive: { backgroundColor: "#4c1d95" },
    accessoryDetailsText: { color: "white", fontWeight: "800" },
    accessoryCheckBtn: { backgroundColor: "#22C55E", paddingHorizontal: 10 },
    accessoryCheckBtnDisabled: { backgroundColor: "#1f2937" },
    accessoryInputPill: {
        backgroundColor: "#0b0b0b",
        borderWidth: 1,
        borderColor: "#2a2a2a",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        minWidth: 70,
        alignItems: "center",
        justifyContent: "center",
    },
    accessoryInputPillActive: { borderColor: "#60a5fa" },
    accessoryInputText: { fontWeight: "800" },
    hiddenAccessoryInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
