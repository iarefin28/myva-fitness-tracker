// components/EditExerciseModal.tsx

const SHOW_DESCRIPTOR = true;

import { useWorkoutStore } from "@/store/workoutStore";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    InputAccessoryView,
    Keyboard,
    KeyboardAvoidingView,
    LayoutAnimation,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    useWindowDimensions,
    View,
} from "react-native";

import { useEffect } from "react";

type Props = {
    visible: boolean;
    exerciseId: string | null;
    onClose: () => void;
    onDiscard?: () => void;
    onCompleteExercise?: () => void;
};

const INPUT_ACCESSORY_ID = "edit-exercise-done-accessory";

export default function EditExerciseModal({
    visible,
    exerciseId,
    onClose,
    onDiscard,
    onCompleteExercise,
}: Props) {
    // store selectors
    const getExercise = useWorkoutStore((s) => s.getExercise);
    const addExerciseSet = useWorkoutStore((s) => s.addExerciseSet);
    const completeExerciseSet = useWorkoutStore((s) => s.completeExerciseSet);

    const ex = exerciseId ? getExercise(exerciseId) : null;

    const isCompleted = ex?.status === 'completed';


    // ----- Local UI state (unchanged look) -----
    const [weight, setWeight] = useState("");
    const [reps, setReps] = useState("");
    const [kbVisible, setKbVisible] = useState(false);
    const [listVisible, setListVisible] = useState<boolean>(!!isCompleted);

    const [activePanel, setActivePanel] = useState<"set" | null>("set");
    const [activeSetId, setActiveSetId] = useState<string | null>(null);

    const isCompletingSet = !!activeSetId;

    const weightRef = useRef<TextInput>(null);
    const repsRef = useRef<TextInput>(null);
    const { height } = useWindowDimensions();

    useEffect(() => {
        if (isCompleted) setListVisible(true);
    }, [isCompleted]);

    const toggleList = () => {
        if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
            UIManager.setLayoutAnimationEnabledExperimental(true);
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setListVisible((v) => !v);
    };

    // current set number is (ex?.sets.length ?? 0) + (isCompletingSet ? 0 : 0)
    const currentSetNumber = Math.max(1, (ex?.sets.length ?? 0) + (isCompletingSet ? 0 : 0));
    const lastSet = useMemo(() => (isCompletingSet
        ? ex?.sets.find((s) => s.id === activeSetId) ?? null
        : null),
        [ex?.sets, isCompletingSet, activeSetId]
    );

    const fmtTime = (ts?: number) => (ts ? new Date(ts).toLocaleTimeString() : "—");

    // ----- Header actions -----
    const confirmDiscardExercise = () => {
        Alert.alert("Discard exercise?", "This will remove the exercise from your list.", [
            { text: "Cancel", style: "cancel" },
            { text: "Discard", style: "destructive", onPress: () => { onDiscard?.(); onClose(); } },
        ]);
    };

    const confirmCompleteExercise = () => {
        Alert.alert("Complete this exercise?", "A completed exercise cannot be changed.", [
            { text: "Cancel", style: "cancel" },
            { text: "Complete", style: "destructive", onPress: () => { onCompleteExercise?.(); onClose(); } },
        ]);
    };

    // ----- Panel flows: Add / Complete Set (now writing to store) -----
    const addSet = () => {
        if (!exerciseId) return;
        const w = Number(weight);
        const r = Number(reps);
        if (!Number.isFinite(w) || w < 0 || !Number.isFinite(r) || r <= 0) return;

        const newSetId = addExerciseSet(exerciseId, w, r);
        setActiveSetId(newSetId);
        setTimeout(() => repsRef.current?.focus(), 50);
    };

    const completeSet = () => {
        if (!exerciseId || !activeSetId) return;
        const w = Number(weight);
        const r = Number(reps);
        if (!Number.isFinite(w) || w < 0 || !Number.isFinite(r) || r <= 0) return;

        completeExerciseSet(exerciseId, activeSetId, w, r);
        setActiveSetId(null);
        setTimeout(() => weightRef.current?.focus(), 50);
    };

    // ----- Descriptor (unchanged copy, but reading from store) -----
    const descriptor = useMemo(() => {
        if (!ex) {
            return {
                title: "No exercise selected",
                sub: "Close this sheet and pick an exercise.",
                colors: ["#1F2937", "#374151"],
            };
        }

        // --- Completed: hard-lock message & red gradient
        if (isCompleted) {
            return {
                title: "This exercise has been completed.",
                sub: "You are not allowed to make changes until after the workout is saved.",
                colors: ["#7f1d1d", "#ef4444"], // deep red -> red
            };
        }

        if (activePanel !== "set") {
            return {
                title: "Select an action",
                sub: "Add Set panel is hidden. Tap Add Set above to show it.",
                colors: ["#1F2937", "#374151"],
            };
        }
        if ((ex.sets.length === 0) && !isCompletingSet) {
            return {
                title: "No sets have been added yet.",
                sub: "Enter Weight and Reps, then press Add to begin.",
                colors: ["#1E3A8A", "#2563EB"],
            };
        }
        if (isCompletingSet && lastSet) {
            return {
                title: `You are currently on Set #${currentSetNumber}.`,
                sub: `Attempting ${lastSet.plannedWeight} × ${lastSet.plannedReps}. Adjust if needed, then press Complete.`,
                colors: ["#0EA5E9", "#22C55E"],
            };
        }
        const prev = ex.sets[ex.sets.length - 1];
        const doneBit =
            prev?.completedWeight != null && prev?.completedReps != null
                ? `Completed ${prev.completedWeight} × ${prev.completedReps}.`
                : `Planned ${prev?.plannedWeight} × ${prev?.plannedReps}.`;
        return {
            title: `Set #${ex.sets.length} saved.`,
            sub: `${doneBit} Add another set when you are ready.`,
            colors: ["#1E3A8A", "#2563EB"],
        };
    }, [ex, isCompleted, activePanel, isCompletingSet, lastSet, currentSetNumber]);

    // ----- Keyboard flow -----
    const handleWeightSubmit = () => repsRef.current?.focus();
    const handleRepsSubmit = () => { if (isCompletingSet) completeSet(); else addSet(); };

    const canAdd = weight.trim().length > 0 && reps.trim().length > 0;
    const canComplete = canAdd && isCompletingSet;

    return (
        <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={styles.root}>
                <View className="grabber" style={styles.grabber} />

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
                        <Text style={styles.topTitle} numberOfLines={1}>Edit Exercise</Text>
                    </View>

                    <View style={[styles.barSide, { alignItems: "flex-end" }]}>
                        {!isCompleted && (
                            <Pressable
                                onPress={confirmCompleteExercise}
                                hitSlop={10}
                                style={styles.completeBtn}
                                accessibilityLabel="Complete exercise"
                            >
                                <Text style={styles.completeText}>Complete</Text>
                            </Pressable>
                        )}
                    </View>

                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.select({ ios: "padding", android: undefined })}
                    keyboardVerticalOffset={Platform.select({ ios: 8, android: 0 }) as number}
                >
                    {/* Locked name (from store) */}
                    <View style={styles.nameRow}>
                        <Ionicons name="lock-closed-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                        <TextInput
                            value={ex?.name ?? ""}
                            editable={false}
                            placeholder="Exercise name"
                            placeholderTextColor="#6b7280"
                            style={[styles.nameInput, { flex: 1 }]}
                        />
                        <Text style={styles.holdHint}>Hold for more info</Text>
                    </View>

                    {/* Top actions */}
                    {!isCompleted && (
                        <View style={styles.actionsRow}>
                            <TouchableOpacity style={[styles.actionBtn, styles.btnPrimary]} activeOpacity={0.9} onPress={() => setActivePanel("set")}>
                                <View style={styles.actionContent}>
                                    <FontAwesome5 name="dumbbell" size={14} color="#fff" style={{ marginRight: 6 }} />
                                    <Text style={styles.btnText}>Add Set</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionBtn, styles.btnDisabledBg]} activeOpacity={1} disabled>
                                <View style={styles.actionContent}>
                                    <Ionicons name="time-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
                                    <Text style={[styles.btnText, styles.btnTextDisabled]}>Add Rest</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.actionBtn, styles.btnDisabledBg]} activeOpacity={1} disabled>
                                <View style={styles.actionContent}>
                                    <Ionicons name="document-text-outline" size={16} color="#6b7280" style={{ marginRight: 6 }} />
                                    <Text style={[styles.btnText, styles.btnTextDisabled]}>Add Note</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Panel */}
                    {!isCompleted && activePanel === "set" && (
                        <View style={styles.panel}>
                            <Text style={styles.panelHeading}>{isCompletingSet ? "Complete Set" : "Add Set"}</Text>

                            <View style={styles.duoRow}>
                                <TextInput
                                    ref={weightRef}
                                    value={weight}
                                    onChangeText={setWeight}
                                    keyboardType="numeric"
                                    placeholder="Weight"
                                    placeholderTextColor="#6b7280"
                                    style={[styles.input, styles.duoInput]}
                                    returnKeyType="next"
                                    onSubmitEditing={handleWeightSubmit}
                                    inputAccessoryViewID={Platform.OS === "ios" ? INPUT_ACCESSORY_ID : undefined}
                                />
                                <TextInput
                                    ref={repsRef}
                                    value={reps}
                                    onChangeText={setReps}
                                    keyboardType="numeric"
                                    placeholder="Reps"
                                    placeholderTextColor="#6b7280"
                                    style={[styles.input, styles.duoInput]}
                                    returnKeyType="done"
                                    onSubmitEditing={handleRepsSubmit}
                                    inputAccessoryViewID={Platform.OS === "ios" ? INPUT_ACCESSORY_ID : undefined}
                                />

                                <TouchableOpacity
                                    onPress={isCompletingSet ? completeSet : addSet}
                                    activeOpacity={0.9}
                                    style={[
                                        styles.addSetBtn,
                                        isCompletingSet ? styles.btnSuccess : styles.btnPrimary,
                                        !(isCompletingSet ? canComplete : canAdd) && { opacity: 0.55 },
                                    ]}
                                    disabled={!(isCompletingSet ? canComplete : canAdd)}
                                >
                                    <Text style={styles.addSetText}>{isCompletingSet ? "Complete" : "Add"}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Descriptor */}
                    {SHOW_DESCRIPTOR && (
                        <Pressable onPress={toggleList}>
                            <LinearGradient
                                colors={descriptor.colors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={[styles.descriptor, { flexDirection: "row", alignItems: "center" }]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.descTitle}>{descriptor.title}</Text>
                                    <Text style={styles.descSub}>{descriptor.sub}</Text>
                                </View>
                                <Ionicons name={listVisible ? "chevron-up" : "chevron-down"} size={18} color="#fff" style={{ marginLeft: 8, opacity: 0.9 }} />
                            </LinearGradient>
                        </Pressable>
                    )}

                    {/* Sets list */}
                    <View style={[styles.listWrap, (!listVisible || kbVisible) && { maxHeight: 0, overflow: "hidden" }]}>
                        <FlatList
                            data={
                                isCompleted
                                    ? ex?.sets ?? []                      // natural order when completed
                                    : [...(ex?.sets ?? [])].slice().reverse() // reverse order when active/in progress
                            }
                            keyExtractor={(s) => s.id}
                            ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
                            contentContainerStyle={{ paddingBottom: 16 }}
                            renderItem={({ item, index }) => {
                                const total = ex?.sets.length ?? 0;
                                const ordinal = isCompleted ? index + 1 : total - index; // adjust numbering dynamically
                                const planned = `${item.plannedWeight} × ${item.plannedReps}`;
                                const hasActual = Number.isFinite(item.completedWeight) && Number.isFinite(item.completedReps);
                                const actual = hasActual ? `${item.completedWeight} × ${item.completedReps}` : "—";
                                const isDone = !!item.completedAt;

                                return (
                                    <View style={[styles.setRow, isDone ? styles.setRowDone : styles.setRowProgress]}>
                                        <View style={styles.setHeaderRow}>
                                            <Text style={styles.setRowTitle}>Set {ordinal}</Text>
                                            <View style={[styles.statusPill, isDone ? styles.statusPillDone : styles.statusPillProgress]}>
                                                <Text style={styles.statusPillText}>{isDone ? "Completed" : "In Progress"}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.contentRow}>
                                            <View style={styles.leftCol}>
                                                <View style={styles.kvRow}>
                                                    <Text style={styles.kvKey}>Attempted:</Text>
                                                    <Text style={styles.kvVal}>{planned}</Text>
                                                </View>
                                                <View style={styles.kvRow}>
                                                    <Text style={styles.kvKey}>Actual:</Text>
                                                    <Text style={[styles.kvVal, hasActual && styles.kvValDone]}>{actual}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.rightCol}>
                                                <Text style={styles.timeText}>
                                                    Added on: <Text style={styles.timeVal}>{fmtTime(item.createdAt)}</Text>
                                                </Text>
                                                <Text style={styles.timeText}>
                                                    Completed on:{" "}
                                                    <Text style={[styles.timeVal, isDone ? styles.timeValDone : styles.timeValMissing]}>
                                                        {fmtTime(item.completedAt)}
                                                    </Text>
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                );
                            }}
                        />
                    </View>
                </KeyboardAvoidingView>

                {/* iOS input accessory */}
                {Platform.OS === "ios" && (
                    <InputAccessoryView nativeID={INPUT_ACCESSORY_ID}>
                        <View style={styles.accessory}>
                            <View style={{ flex: 1 }} />
                            <Pressable onPress={() => Keyboard.dismiss()} style={styles.accessoryBtn} hitSlop={10}>
                                <Text style={styles.accessoryText}>Done</Text>
                            </Pressable>
                        </View>
                    </InputAccessoryView>
                )}

                {/* Android "Done" pill */}
                {Platform.OS === "android" && kbVisible && (
                    <Pressable onPress={() => Keyboard.dismiss()} style={[styles.androidDone, { top: height * 0.12 }]}>
                        <Text style={styles.accessoryText}>Done</Text>
                    </Pressable>
                )}
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
    completeBtn: { backgroundColor: "#ef4444", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    completeText: { color: "white", fontWeight: "800" },

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

    actionsRow: { marginHorizontal: 14, marginTop: 10, flexDirection: "row", gap: 8 },
    actionBtn: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#2a2a2a",
        backgroundColor: "#111",
    },
    actionContent: { flexDirection: "row", alignItems: "center" },
    btnPrimary: { backgroundColor: "#0A84FF", borderColor: "#0A84FF" },
    btnSuccess: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
    btnDisabledBg: { backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" },
    btnText: { color: "white", fontWeight: "800" },
    btnTextDisabled: { color: "#6b7280" },

    panel: { marginHorizontal: 14, marginTop: 10, borderRadius: 12, borderWidth: 1, borderColor: "#222", backgroundColor: "#0f0f10", padding: 12 },
    panelHeading: { color: "#e5e7eb", fontWeight: "800", marginBottom: 8, fontSize: 14 },
    duoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    input: {
        backgroundColor: "#111",
        borderWidth: 1,
        borderColor: "#2a2a2a",
        borderRadius: 10,
        color: "white",
        paddingHorizontal: 12,
        paddingVertical: Platform.select({ ios: 10, android: 8 }) as number,
        fontSize: 15,
    },
    duoInput: { flex: 1, minWidth: 90 },
    addSetBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
    addSetText: { color: "white", fontWeight: "800" },

    descriptor: { marginHorizontal: 14, marginTop: 10, borderRadius: 12, padding: 12 },
    descTitle: { color: "white", fontWeight: "800", marginBottom: 4 },
    descSub: { color: "#f8fafc" },

    listWrap: { flex: 1, marginTop: 8 },

    contentRow: { flexDirection: "row", gap: 12 },
    leftCol: { flex: 1, minWidth: 0 },
    rightCol: { alignItems: "flex-end", justifyContent: "center", minWidth: 130, maxWidth: 160 },

    setRow: { backgroundColor: "#111", borderWidth: 1, borderColor: "#2a2a2a", padding: 12, borderRadius: 10, marginHorizontal: 14 },
    setRowDone: { borderColor: "#14532d" },
    setRowProgress: { borderColor: "#3f1f1f" },

    setHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
    setRowTitle: { color: "white", fontWeight: "800", fontSize: 14 },

    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
    statusPillDone: { backgroundColor: "#14532d", borderColor: "#16a34a" },
    statusPillProgress: { backgroundColor: "#3f1f1f", borderColor: "#ef4444" },
    statusPillText: { color: "white", fontWeight: "800", fontSize: 12 },

    kvRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
    kvKey: { color: "#9ca3af", width: 92 },
    kvVal: { color: "white", fontWeight: "700", flexShrink: 1 },
    kvValDone: { color: "#86efac" },

    timeText: { color: "#9ca3af", fontSize: 12, lineHeight: 16 },
    timeVal: { color: "#e5e7eb", fontWeight: "600" },
    timeValDone: { color: "#86efac" },
    timeValMissing: { color: "#fca5a5" },

    // accessory
    accessory: {
        backgroundColor: "#0f0f10",
        borderTopWidth: 1,
        borderTopColor: "#222",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    accessoryBtn: { backgroundColor: "#0A84FF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
    accessoryText: { color: "white", fontWeight: "800" },
    androidDone: { position: "absolute", right: 12, backgroundColor: "#0A84FF", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
});
