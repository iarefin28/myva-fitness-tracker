import { useRoute } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActionSheetIOS, Alert, Keyboard, Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from "react-native";

import DraggableExercisePanel from "@/components/DraggableExercisePanel";
import ExerciseInteractiveModal from "../components/ExerciseInteractiveModal";
import { inferDefaultTags } from "../data/exerciseDefaultTags";
import type { Exercise, ExerciseAction, ExerciseType, TagState } from "../types/workout";

import useAccurateTimer from "@/hooks/useAccurateTimer";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { nanoid } from 'nanoid/non-secure';
import { Pressable } from "react-native";

import { useWorkoutStore } from '../stores/workoutStore';

export default function AddWorkout() {
    const route = useRoute();
    const { mode = "live", templateId } = route.params || {};
    const [editingTemplateId, setEditingTemplateId] = useState<number | string | null>(null);


    // ─── NEW: keep the last modal duration in a ref ───
    const editDurationRef = useRef(0);
    const [editDuration, setEditDuration] = useState(0); // keep for UI/prop, but ref is source-of-truth
    const [pendingFocusId, setPendingFocusId] = useState<string | null>(null);

    // ───── Theme & Navigation ─────
    const scheme = useColorScheme();
    const navigation = useNavigation();
    const router = useRouter();

    const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const borderColor = scheme === "dark" ? "#444" : "#ccc";
    const cardColor = scheme === "dark" ? "#1e1e1e" : "#d1d1d1";

    const inputBg = scheme === "dark" ? "#2a2a2a" : "#fff";
    const dividerColor = scheme === "dark" ? "#333" : "#ccc";

    // ───── Workout Info State ─────
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // ───── Modal & Exercise State ─────
    const [modalVisible, setModalVisible] = useState(false);
    const [exerciseName, setExerciseName] = useState("");
    const [exerciseNameBlurred, setExerciseNameBlurred] = useState(false);
    const [lockedExerciseTitle, setLockedExerciseTitle] = useState("");
    const [exerciseType, setExerciseType] = useState<ExerciseType>("unknown");;
    const [tags, setTags] = useState<TagState>({});

    const elapsedMs = useWorkoutStore((s) => s.elapsedMs);
    const isActive = useWorkoutStore((s) => s.isActive);

    // ───── Action Management State ─────
    const [actionsList, setActionsList] = useState<ExerciseAction[]>([]);


    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [resetExpansionTrigger, setResetExpansionTrigger] = useState(0);
    const [triggerScrollToEnd, setTriggerScrollToEnd] = useState(false);

    // const [elapsedTime, setElapsedTime] = useState(0);
    // const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const sessionKeyRef = useRef(`workoutTimer:${Date.now()}`);

    const [totalApproxSeconds, setTotalApproxSeconds] = useState(0);
    const [durationOverrideMin, setDurationOverrideMin] = useState<number | null>(null);
    const [isDurationControlsOpen, setIsDurationControlsOpen] = useState(false);

    const autoMinutes = Math.ceil((totalApproxSeconds ?? 0) / 60);
    const currentMinutes = durationOverrideMin ?? autoMinutes;

    const start = useWorkoutStore(s => s.start);
    const stop = useWorkoutStore(s => s.stop);

    // Live exercises from the unified store
    const liveExercises = useWorkoutStore((s) => s.liveExercises);
    const setAllLiveExercises = useWorkoutStore((s) => s.setAllLiveExercises);
    const pushLiveExercise = useWorkoutStore((s) => s.pushLiveExercise);
    const replaceLiveExerciseAt = useWorkoutStore((s) => s.replaceLiveExerciseAt);
    const removeLiveExerciseAt = useWorkoutStore((s) => s.removeLiveExerciseAt);
    const clearLiveExercises = useWorkoutStore((s) => s.clearLiveExercises);
    const workoutName = useWorkoutStore(s => s.liveMeta.workoutName);
    const preWorkoutNote = useWorkoutStore(s => s.liveMeta.preWorkoutNote);
    const postWorkoutNote = useWorkoutStore(s => s.liveMeta.postWorkoutNote);

    const setWorkoutName = useWorkoutStore(s => s.setWorkoutName);
    const setPreWorkoutNote = useWorkoutStore(s => s.setPreNote);
    const setPostWorkoutNote = useWorkoutStore(s => s.setPostNote);

    // Clamp to [auto, 999]
    const clampMinutes = (m: number) => Math.min(999, Math.max(autoMinutes, m));

    const nudge = (delta: number) => {
        setDurationOverrideMin(prev => {
            const base = prev ?? autoMinutes;
            return clampMinutes(base + delta);
        });
    };


    // start global timer for live sessions
    useEffect(() => {
        if (mode === 'live' && !isActive) start();
        return () => {
            //if (mode === 'live') stop();
        };
    }, [mode, isActive, start]);


    useEffect(() => {
        const total = estimateWorkoutDurationSeconds(
            (liveExercises ?? []).map(ex => ({
                ...ex,
                computedDurationInSeconds:
                    typeof ex.computedDurationInSeconds === "number"
                        ? ex.computedDurationInSeconds
                        : Number(ex.computedDurationInSeconds ?? 0),
            }))
        );
        // if user has an override, use that (minutes → seconds)
        setTotalApproxSeconds(durationOverrideMin != null ? durationOverrideMin * 60 : total);
    }, [liveExercises, durationOverrideMin]);

    useEffect(() => {
        const loadTemplate = async () => {
            if (!templateId) return;

            const stored = await AsyncStorage.getItem("savedTemplates");
            if (!stored) return;

            const parsed = JSON.parse(stored);
            const found = parsed.find((t: any) => t.id.toString() === templateId.toString());
            if (!found) return;

            setAllLiveExercises(found.exercises);

            if (mode === "live") {
                setWorkoutName(`${found.name} Copy`);
                start()
            } else {
                setWorkoutName(found.name);
                setEditingTemplateId(found.id);
                if (typeof found.durationOverrideMin === "number") {
                    setDurationOverrideMin(found.durationOverrideMin);
                } else if (typeof found.approxDurationInSeconds === "number") {
                    setDurationOverrideMin(Math.ceil(found.approxDurationInSeconds / 60));
                }
            }
        };

        loadTemplate();
    }, [mode, templateId]);

    useEffect(() => {
        return () => { stopWorkoutTimer(); };
    }, []);

    const isFocused = useIsFocused();
    const {
        displaySeconds: elapsedTime,
        finalize: finalizeWorkoutTimer,
        reset: resetWorkoutTimer,
        persistNow: persistWorkoutTimer,
        stop: stopWorkoutTimer,           // <-- add this from the hook
    } = useAccurateTimer(sessionKeyRef.current, isFocused && mode === "live");


    type Metrics = {
        totalExercises: number;
        totalSets: number;
        totalWorkingSets: number;
        approxDurationInSeconds: number;
    };

    function computeMetrics(exercises: Array<{ actions?: any[] }>): Omit<Metrics, "approxDurationInSeconds"> {
        let totalSets = 0;
        let totalWorkingSets = 0;

        for (const ex of exercises ?? []) {
            const sets = (ex.actions ?? []).filter(a => a?.type === "set");
            totalSets += sets.length;
            totalWorkingSets += sets.filter(s => !s?.isWarmup).length;
        }
        return {
            totalExercises: exercises?.length ?? 0,
            totalSets,
            totalWorkingSets,
        };
    }
    // ───── Workout Save (To Implement) ─────
    const saveWorkout = useCallback(async () => {
        const exs = liveExercises;
        if (!workoutName || (exs?.length ?? 0) === 0) return;

        const computedApprox = estimateWorkoutDurationSeconds(exs);

        // clamp minutes if overridden
        const approxMinutes =
            durationOverrideMin != null
                ? clampMinutes(durationOverrideMin) // [auto, 999]
                : Math.ceil(computedApprox / 60);

        const approxDurationInSeconds = approxMinutes * 60;

        // build metrics
        const baseCounts = computeMetrics(exs);
        const metrics: Metrics = { ...baseCounts, approxDurationInSeconds };

        // Build the base object (shared)
        let workout: any = {
            id: editingTemplateId ?? Date.now(),
            name: workoutName,
            exercises: exs,
            approxDurationInSeconds,   // stays at top level for existing UI
            metrics,                   // <— NEW: totals + approx
            durationOverrideMin: durationOverrideMin,
        };

        let key = "savedWorkouts";

        try {
            if (mode === "template") {
                key = "savedTemplates";
                const existing = await AsyncStorage.getItem(key);
                const list = existing ? JSON.parse(existing) : [];

                if (editingTemplateId) {
                    // UPDATE
                    const idx = list.findIndex((t: any) => t.id.toString() === String(editingTemplateId));
                    if (idx !== -1) {
                        const prev = list[idx];
                        list[idx] = {
                            ...prev,
                            ...workout,
                            id: prev.id,
                            createdOn: prev.createdOn ?? new Date().toISOString(),
                            updatedOn: new Date().toISOString(),
                            usageCount: prev.usageCount ?? 0,
                        };

                        console.log("Updating Template Payload:\n" + JSON.stringify(list[idx], null, 2));
                    }
                    await AsyncStorage.setItem(key, JSON.stringify(list, null, 2));
                } else {
                    // CREATE
                    const newTemplate = {
                        ...workout,
                        createdBy: "Ishan Arefin",
                        createdOn: new Date().toISOString(),
                        usageCount: 0,
                    };
                    list.push(newTemplate);
                    await AsyncStorage.setItem(key, JSON.stringify(list, null, 2));
                }
            } else {
                // LIVE workout save
                const existing = await AsyncStorage.getItem(key);
                const list = existing ? JSON.parse(existing) : [];
                const liveWorkout = {
                    ...workout,
                    preWorkoutNote,
                    postWorkoutNote,
                    date: date.toISOString(),
                    actualDurationInSeconds: finalizeWorkoutTimer(),
                    createdBy: "Ishan Arefin",
                    completedAt: date.toISOString()
                };
                list.push(liveWorkout);
                await AsyncStorage.setItem(key, JSON.stringify(list, null, 2));
                clearLiveExercises();
                stopWorkoutTimer();
                stop();
                setWorkoutName('');
                setPreWorkoutNote('');
                setPostWorkoutNote('');
            }


            navigation.goBack();
        } catch (e) {
            console.error("Failed to save workout:", e);
        }
    }, [mode, workoutName, preWorkoutNote, postWorkoutNote, date, liveExercises, editingTemplateId]);


    const disabledColor = scheme === "dark" ? "#666" : "#bbb";
    const canSave =
        (workoutName?.trim().length ?? 0) > 0 &&
        (liveExercises.length > 0);

    function clock(ms: number) {
        const s = Math.floor(ms / 1000);
        const hh = String(Math.floor(s / 3600)).padStart(2, '0');
        const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }

    // ───── Layout Effect for Header Buttons ─────
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => {
                if (mode === "live") {
                    return (
                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4, flexShrink: 1 }}>
                            <Ionicons name="time-outline" size={16} color={textColor} style={{ marginRight: 4 }} />
                            <Text
                                numberOfLines={1}
                                style={{ fontSize: 16, fontWeight: "bold", color: textColor }}
                            >
                                {/* {formatElapsedTime(elapsedTime)} */}
                                {isActive ? clock(elapsedMs) : clock(0)}
                            </Text>
                        </View>
                    );
                } else if (mode === "template" && !editingTemplateId) {
                    return (
                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4, flexShrink: 1 }}>
                            <AntDesign name="form" size={16} color={textColor} style={{ marginRight: 4 }} />
                            <Text
                                numberOfLines={1}
                                style={{ fontSize: 16, fontWeight: "bold", color: textColor }}
                            >
                                Add Template
                            </Text>
                        </View>
                    );
                } else if (mode === "template" && editingTemplateId) {
                    return (
                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4, flexShrink: 1 }}>
                            <AntDesign name="form" size={16} color={textColor} style={{ marginRight: 4 }} />
                            <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "bold", color: textColor }}>
                                Edit Template
                            </Text>
                        </View>
                    );
                } else {
                    return (
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: textColor }}>
                            Add Workout
                        </Text>
                    );
                }
            },
            headerRight: () => (
                <TouchableOpacity
                    disabled={!canSave}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSave }}
                    onPress={() => {
                        if (!canSave) return;
                        if (mode === "live") {
                            if (Platform.OS === "ios") {
                                ActionSheetIOS.showActionSheetWithOptions(
                                    {
                                        title: "Finish Live Workout?",
                                        message:
                                            "Are you sure you want to finish this live workout? Once saved, it cannot be modified.",
                                        options: ["Cancel", "Save Workout"],
                                        cancelButtonIndex: 0,
                                        destructiveButtonIndex: 1,
                                        userInterfaceStyle: scheme === "dark" ? "dark" : "light",
                                    },
                                    (buttonIndex) => {
                                        if (buttonIndex === 1) saveWorkout();
                                    }
                                );
                            } else {
                                Alert.alert(
                                    "Finish Live Workout?",
                                    "Are you sure you want to finish this live workout? Once saved, it cannot be modified.",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Save Workout", style: "destructive", onPress: saveWorkout },
                                    ]
                                );
                            }
                        } else {
                            saveWorkout();
                        }
                    }}
                >
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: canSave ? textColor : disabledColor,
                            opacity: canSave ? 1 : 0.6,
                        }}
                    >
                        Done
                    </Text>
                </TouchableOpacity>
            ),
            headerLeft: () => (
                <TouchableOpacity onPress={confirmClose}>
                    <Text style={{ fontSize: 16, color: textColor }}>Cancel</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation, textColor, saveWorkout, elapsedMs, isActive, mode, canSave, workoutName, liveExercises.length]);

    // ───── Modal & Exercise Handlers ─────
    const closeModal = () => {
        setModalVisible(false);
        setActionsList([]);
        setExerciseName("");
        setExerciseNameBlurred(false);
        setLockedExerciseTitle("");
        setEditIndex(null);
        setResetExpansionTrigger(prev => prev + 1);
        setTags({});
    };

    const confirmClose = () => {
        const isWorkoutEmpty =
            !workoutName?.trim() &&
            !preWorkoutNote?.trim() &&
            !postWorkoutNote?.trim() &&
            (liveExercises.length === 0);             // <- use store array

        const discardAndExit = async () => {
            try { stopWorkoutTimer(); } catch { }
            try { clearLiveExercises(); } catch { }    // <- clear the store
            try { stop(); } catch { }                  // <- your live timer store stop()
            try { setWorkoutName(''); setPreWorkoutNote(''); setPostWorkoutNote(''); } catch { }
            navigation.goBack();
        };

        if (isWorkoutEmpty) {
            // no dialog; just tear down
            discardAndExit();
            return;
        }

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    message: 'Are you sure you want to discard this workout? Your current progress will be lost.',
                    options: ['Cancel', 'Delete'],
                    cancelButtonIndex: 0,
                    destructiveButtonIndex: 1,
                    userInterfaceStyle: 'dark',
                },
                async (buttonIndex) => {
                    if (buttonIndex === 1) {
                        await discardAndExit();             // <- clear store + draft + timer
                    }
                }
            );
        } else {
            Alert.alert(
                'Discard Workout?',
                'Are you sure you want to discard this workout? This action cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => { discardAndExit(); } // <- clear store + draft + timer
                    },
                ]
            );
        }
    };

    const confirmDeleteExercise = (indexToDelete: number) => {
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Cancel", "Delete Exercise"],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 0,
                    message: "Are you sure you want to delete this exercise from the workout? You will lose all of the data associated with it. This action cannot be undone.",
                    userInterfaceStyle: "dark",
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        handleDeleteExercise(indexToDelete);
                    }
                }
            );
        } else {
            Alert.alert(
                "Delete Exercise?",
                "Are you sure you want to delete this exercise from the workout? You will lose all of the data associated with it. This action cannot be undone.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => handleDeleteExercise(indexToDelete) }
                ]
            );
        }
    };

    const handleSaveExercise = () => {
        if (!exerciseName || actionsList.length === 0) return;

        const computedDurationInSeconds = estimateExerciseDurationWorstCase(actionsList);

        const newExercise: Exercise = {
            name: exerciseName,
            type: exerciseType,
            actions: computeNumberedActions(actionsList),
            editDurationInSeconds: editDurationRef.current,
            computedDurationInSeconds,
            tags,
        };

        if (editIndex !== null) {
            replaceLiveExerciseAt(editIndex, newExercise);
        } else {
            pushLiveExercise(newExercise);
        }

        // ✅ reset modal state so you SEE the result in the list
        closeModal();                   // hide modal
        setEditIndex(null);             // so next open is “add” not “edit”
        setExerciseName('');
        setActionsList([]);             // start fresh
        editDurationRef.current = 0;    // reset local edit timer if you use one
    };

    // ───── Action Handlers ─────
    const addSet = () => {
        const id = nanoid();
        let newSet: any = {
            id,
            type: "set",
        };

        switch (exerciseType) {
            case "weighted":
                newSet = {
                    ...newSet,
                    weight: "",
                    weightUnit: "lb",
                    reps: "",
                    unit: "lb",
                    note: "",
                    isWarmup: false,
                    RPE: 0
                };
                break;
            case "bodyweight":
                newSet = {
                    ...newSet,
                    reps: "",
                    unit: "",
                    note: "",
                    isWarmup: false,
                    RPE: 0
                };
                break;
            case "duration":
                newSet = {
                    ...newSet,
                    value: "",
                    unit: "sec"
                };
                break;
            case "weighted duration":
                newSet = {
                    ...newSet,
                    weight: "",
                    weightUnit: "lb",
                    value: "",
                    valueUnit: "sec"
                };
                break;
            case "weighted distance":
                newSet = {
                    ...newSet,
                    weight: "",
                    weightUnit: "lb",
                    value: "",
                    valueUnit: "yd"
                };
                break;
            default:
                newSet = {
                    ...newSet,
                    reps: "",
                    unit: ""
                };
        }

        const updatedList = computeNumberedActions([...actionsList, newSet]);
        setPendingFocusId(id);
        setActionsList(updatedList);
        setTriggerScrollToEnd(true);
        console.log("Updated Actions List:", JSON.stringify(updatedList, null, 2));
    };

    const addRest = () => {
        const id = nanoid();
        const newRest = {
            id,
            type: "rest",
            value: "",
            restInSeconds: 0
        };

        const updatedList = computeNumberedActions([...actionsList, newRest]);
        setPendingFocusId(id);
        setActionsList(updatedList);
        setTriggerScrollToEnd(true);
        console.log("Updated Actions List:", JSON.stringify(updatedList, null, 2));
    };

    const deleteActionById = (idToDelete: string) => {
        const filtered = actionsList.filter(action => action.id !== idToDelete);
        const updated = computeNumberedActions(filtered);
        setActionsList(updated);

        console.log(`Deleted action with ID ${idToDelete}`);
        console.log("Updated Actions List:", JSON.stringify(updated, null, 2));
    };
    const updateActionValue = (
        id: string,
        field: "reps" | "weight" | "value" | "unit" | "weightUnit" | "valueUnit" | "note" | "isWarmup" | "RPE" | "restInSeconds",
        value: string
    ) => {
        setActionsList(prev =>
            prev.map(action =>
                action.id === id ? { ...action, [field]: value } : action
            )
        );
    };
    const computeNumberedActions = (actions) => {
        let setCount = 1;
        let restCount = 1;

        return actions.map((action) => {
            const base = { ...action }; // preserve all fields including id

            if (action.type === "set" && !action.isWarmup) {
                return { ...base, setNumber: setCount++ };
            } else if (action.type === "rest") {
                return { ...base, restNumber: restCount++ };
            } else {
                return { ...base, setNumber: null };
            }
        });
    };

    const handleDeleteExercise = (indexToDelete: number) => {
        removeLiveExerciseAt(indexToDelete);
    };

    // ───── Date Picker Handler ─────
    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) setDate(selectedDate);
    };

    function estimateExerciseDurationWorstCase(actions: ExerciseAction[]) {
        const totalRest = actions
            .filter(a => a.type === "rest")
            .reduce((sum, a: any) => sum + Number(a.restInSeconds ?? 0), 0); // <-- Number()

        const setCount = actions.filter(a => a.type === "set").length;

        return totalRest + setCount * 70; // number
    }

    const INTER_EXERCISE_BUFFER_SEC = 90; // setup/log/water between exercises

    function estimateWorkoutDurationSeconds(exercises: Exercise[]) {
        if (!exercises?.length) return 0;

        return exercises.reduce((total, ex, idx) => {
            const perExercise =
                typeof ex.computedDurationInSeconds === "number"
                    ? ex.computedDurationInSeconds
                    : estimateExerciseDurationWorstCase(ex.actions); // fallback for older items

            const gap = idx > 0 ? INTER_EXERCISE_BUFFER_SEC : 0; // N-1 gaps
            return total + Number(perExercise || 0) + gap;
        }, 0);
    }

    function secondsToApproxMinutes(sec: number): string {
        const minutes = Math.ceil((sec || 0) / 60);
        return `${minutes} min${minutes !== 1 ? "s" : ""}`;
    }

    return (
        <>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ flex: 1, padding: 20 }}>
                    {/* Motivational Quote: this could be made up of quotes from the user themselves after they keep tracking workouts*/}
                    <Text style={{
                        color: "#888",
                        fontSize: 12,
                        fontStyle: "italic",
                        textAlign: "center",
                        marginBottom: 6,
                        paddingHorizontal: 12
                    }}>
                        "The worst thing I can be is the same as everybody else. I hate that."
                        – Arnold Schwarzenegger
                    </Text>
                    {/* Workout Info */}
                    <View style={{
                        backgroundColor: cardColor,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 20,
                        shadowColor: scheme === "dark" ? "#000" : "#aaa",
                        shadowOpacity: scheme === "dark" ? 0.15 : 0.3,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 3,
                        borderColor: scheme === "dark" ? "transparent" : "#ddd",
                        borderWidth: scheme === "dark" ? 0 : 1,
                    }}>
                        {/* Pre-Workout Notes */}
                        {mode === "live" && (
                            <TextInput
                                value={preWorkoutNote}
                                onChangeText={setPreWorkoutNote}
                                placeholder="Write a pre-workout note"
                                placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                                multiline
                                scrollEnabled
                                blurOnSubmit={false}
                                style={{
                                    color: textColor,
                                    backgroundColor: inputBg,
                                    borderRadius: 8,
                                    paddingHorizontal: 10,
                                    paddingTop: 12,
                                    paddingBottom: 10,
                                    height: 65,
                                    fontSize: 14,
                                    textAlignVertical: "top"
                                }}
                            />
                        )}
                        {mode === "live" && (
                            <View style={{
                                height: 1,
                                backgroundColor: dividerColor,
                                opacity: 0.4,
                                marginVertical: 6
                            }} />
                        )}

                        {/* Workout Name */}
                        <TextInput
                            value={workoutName}
                            onChangeText={(text) => setWorkoutName(text)}
                            placeholder="e.g., Push Day, Leg Day"
                            placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                            style={{
                                color: textColor,
                                backgroundColor: inputBg,
                                borderRadius: 8,
                                padding: 10,
                                fontSize: 14
                            }}
                        />
                        {mode === "live" && (
                            <View style={{
                                height: 1,
                                backgroundColor: dividerColor,
                                opacity: 0.4,
                                marginVertical: 6
                            }} />
                        )}

                        {mode === "live" && (
                            <TextInput
                                value={postWorkoutNote}
                                onChangeText={setPostWorkoutNote}
                                placeholder="Write a post-workout note"
                                placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                                multiline
                                scrollEnabled
                                blurOnSubmit={false}
                                style={{
                                    color: textColor,
                                    backgroundColor: inputBg,
                                    borderRadius: 8,
                                    paddingHorizontal: 10,
                                    paddingTop: 12,
                                    paddingBottom: 10,
                                    height: 65,
                                    fontSize: 14,
                                    textAlignVertical: "top"
                                }}
                            />
                        )}


                        <View style={{
                            height: 1,
                            backgroundColor: dividerColor,
                            opacity: 0.4,
                            marginVertical: 6
                        }} />

                        <View>
                            <TouchableOpacity
                                onPress={() => {
                                    setExerciseName("");
                                    setExerciseType("unknown");
                                    setActionsList([]);
                                    setLockedExerciseTitle("");
                                    setExerciseNameBlurred(false);
                                    setEditIndex(null);
                                    setEditDuration(0);
                                    editDurationRef.current = 0;
                                    setTags({});
                                    setModalVisible(true);
                                }}
                                style={{
                                    backgroundColor: "#1e90ff",
                                    borderRadius: 8,
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                    alignItems: "center",
                                }}
                            >
                                <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
                                    + Add Exercise
                                </Text>
                            </TouchableOpacity>


                            {/* Approximate total workout time — templates only */}
                            {mode === "template" && (liveExercises?.length ?? 0) > 0 && (
                                <View style={{ marginTop: 8 }}>
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: scheme === "dark" ? "#9ca3af" : "#4b5563",
                                            marginBottom: 2,
                                        }}
                                    >
                                        Estimated Workout Length:
                                    </Text>

                                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                                        {/* Time pill = toggle */}
                                        <Pressable
                                            onPress={() => setIsDurationControlsOpen(open => !open)}
                                            style={{
                                                paddingVertical: 5,
                                                paddingHorizontal: 10,
                                                borderRadius: 10,
                                                borderWidth: 1,
                                                borderColor: borderColor ?? "#d1d5db",
                                                marginRight: 6,
                                                minWidth: 96,
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    fontSize: 15,
                                                    fontWeight: "700",
                                                    color: "#1e90ff",
                                                    textAlign: "center",
                                                    fontVariant: ["tabular-nums"],
                                                }}
                                            >
                                                ~{currentMinutes} mins
                                            </Text>
                                        </Pressable>

                                        {isDurationControlsOpen && (
                                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                                {[-5, -1, +1, +5].map((delta) => (
                                                    <Pressable
                                                        key={delta}
                                                        onPress={() => nudge(delta)}
                                                        style={{
                                                            height: 30,
                                                            minWidth: 32, // 👈 narrower
                                                            paddingHorizontal: 4,
                                                            borderRadius: 6,
                                                            backgroundColor: "#1e90ff",
                                                            marginRight: 4,
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                                                            {delta > 0 ? `+${delta}` : delta}
                                                        </Text>
                                                    </Pressable>
                                                ))}

                                                {/* Auto button */}
                                                <Pressable
                                                    onPress={() => setDurationOverrideMin(null)}
                                                    style={{
                                                        height: 30,
                                                        paddingHorizontal: 6,
                                                        borderRadius: 6,
                                                        borderWidth: 1,
                                                        borderColor: borderColor ?? "#d1d5db",
                                                        marginRight: 4,
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            color: scheme === "dark" ? "#9ca3af" : "#6b7280",
                                                            fontWeight: "700",
                                                            fontSize: 12,
                                                        }}
                                                    >
                                                        Auto
                                                    </Text>
                                                </Pressable>

                                                {/* X button */}
                                                <Pressable
                                                    onPress={() => setIsDurationControlsOpen(false)}
                                                    style={{
                                                        height: 30,
                                                        paddingHorizontal: 10,
                                                        borderRadius: 6,
                                                        backgroundColor: "#ef4444",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>X</Text>
                                                </Pressable>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Draggable Exercise Panel with List of Exercises */}
                    {liveExercises.length > 0 && (
                        <DraggableExercisePanel
                            exercises={liveExercises}
                            onPressExercise={(index) => {
                                const exercise = liveExercises[index];
                                setEditIndex(index);
                                setExerciseName(exercise.name);
                                setExerciseType(exercise.type);
                                setActionsList(exercise.actions);
                                setLockedExerciseTitle(exercise.name);
                                setExerciseNameBlurred(true);
                                const d = exercise.editDurationInSeconds || 0;
                                setEditDuration(d);
                                editDurationRef.current = d;
                                setModalVisible(true);
                                setTags(exercise.tags ?? {});
                            }}
                            onDeleteExercise={confirmDeleteExercise}
                            mode={mode}
                        />
                    )}
                </View>
            </TouchableWithoutFeedback>

            <ExerciseInteractiveModal
                visible={modalVisible}
                onClose={closeModal}
                onSave={handleSaveExercise}
                exerciseName={exerciseName}
                exerciseNameBlurred={exerciseNameBlurred}
                lockedExerciseTitle={lockedExerciseTitle}
                exerciseType={exerciseType}
                actionsList={actionsList}
                updateActionValue={updateActionValue}
                updateActionsList={setActionsList}
                onSelectExercise={(exercise, type) => {
                    setExerciseName(exercise);
                    setExerciseType(type);
                    setExerciseNameBlurred(true);
                    setLockedExerciseTitle(exercise);
                    setTags(inferDefaultTags(exercise, type));
                }}
                onChangeExerciseName={(text) => {
                    setExerciseName(text);
                    setExerciseNameBlurred(false);
                }}
                addSet={addSet}
                addRest={addRest}
                onDeleteAction={deleteActionById}
                isEditing={editIndex !== null}
                resetExpansionTrigger={resetExpansionTrigger}
                scrollToBottom={triggerScrollToEnd}
                onScrolledToBottom={() => setTriggerScrollToEnd(false)}
                initialEditDuration={editDuration}
                onCloseWithDuration={(duration) => {
                    // keep both in sync
                    setEditDuration(duration);
                    editDurationRef.current = duration;
                }}
                trackTime={mode !== "template"}
                mode={mode}
                tags={tags}
                onChangeTags={setTags}
                pendingFocusId={pendingFocusId}
                onPendingFocusHandled={() => setPendingFocusId(null)}
            />
        </>
    );
}

