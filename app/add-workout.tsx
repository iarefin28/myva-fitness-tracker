import { useRoute } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActionSheetIOS, Alert, Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from "react-native";

import type { Exercise, ExerciseAction, ExerciseType } from "../types/workout";

import DraggableExercisePanel from "@/components/DraggableExercisePanel";
import ExerciseInteractiveModal from "../components/ExerciseInteractiveModal";

import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from 'nanoid/non-secure';

export default function AddWorkout() {
    const route = useRoute();
    const { mode = "live", templateId } = route.params || {};

    const [editDuration, setEditDuration] = useState(0);



    // ───── Theme & Navigation ─────
    const scheme = useColorScheme();
    const navigation = useNavigation();
    const router = useRouter();

    const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const borderColor = scheme === "dark" ? "#444" : "#ccc";
    const cardColor = scheme === "dark" ? "#1e1e1e" : "#f2f2f2";
    const inputBg = scheme === "dark" ? "#2a2a2a" : "#fff";
    const dividerColor = scheme === "dark" ? "#333" : "#ccc";

    // ───── Workout Info State ─────
    const [workoutName, setWorkoutName] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // ───── Modal & Exercise State ─────
    const [modalVisible, setModalVisible] = useState(false);
    const [exerciseName, setExerciseName] = useState("");
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const exercisesRef = useRef<Exercise[]>([]);
    const [exerciseNameBlurred, setExerciseNameBlurred] = useState(false);
    const [lockedExerciseTitle, setLockedExerciseTitle] = useState("");
    const [exerciseType, setExerciseType] = useState<ExerciseType>("unknown");;
    const scrollViewRef = useRef<ScrollView>(null);

    // ───── Action Management State ─────
    const [actionsList, setActionsList] = useState<ExerciseAction[]>([]);


    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [resetExpansionTrigger, setResetExpansionTrigger] = useState(0);
    const [triggerScrollToEnd, setTriggerScrollToEnd] = useState(false);

    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const loadTemplate = async () => {
            if (mode === "live" && templateId) {
                const stored = await AsyncStorage.getItem("savedTemplates");
                if (!stored) return;

                const parsed = JSON.parse(stored);
                const found = parsed.find((t: any) => t.id.toString() === templateId.toString());
                if (found) {
                    setExercises(found.exercises);
                    exercisesRef.current = found.exercises;
                    setWorkoutName(found.name + " Copy");
                }
            }
        };

        loadTemplate();
    }, [mode, templateId]);

    useEffect(() => {
        if (mode === "live") {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatElapsedTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // ───── Workout Save (To Implement) ─────
    const saveWorkout = useCallback(async () => {
        console.log("Workout Name:", workoutName);
        console.log("Exercise length:", exercisesRef.current.length);

        if (!workoutName || exercises.length === 0) return;

        // base workout object
        let workout: any = {
            id: Date.now(),
            name: workoutName,
            exercises: exercisesRef.current,
        };

        let key = "savedWorkouts";

        if (mode === "template") {
            workout = {
                ...workout,
                createdBy: "Ishan Arefin",
                createdOn: new Date().toISOString(),
                usageCount: 0
            };
            key = "savedTemplates";
        } else {
            workout = {
                ...workout,
                notes,
                date: date.toISOString(),
            };
        }

        try {
            const existing = await AsyncStorage.getItem(key);
            const parsed = existing ? JSON.parse(existing) : [];

            parsed.push(workout);

            const jsonString = JSON.stringify(parsed, null, 2);
            console.log(`JSON to be saved to ${key}:`);
            console.log(jsonString);

            await AsyncStorage.setItem(key, jsonString);

            console.log(`${mode === "template" ? "Template" : "Workout"} saved successfully!`);
            navigation.goBack();
        } catch (error) {
            console.error("Failed to save workout:", error);
        }
    }, [mode, workoutName, notes, date, exercises]);


    // ───── Layout Effect for Header Buttons ─────
    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: () => {
                if (mode === "live") {
                    return (
                        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 4, flexShrink: 1 }}>
                            <AntDesign name="clockcircleo" size={16} color={textColor} style={{ marginRight: 4 }} />
                            <Text
                                numberOfLines={1}
                                style={{ fontSize: 16, fontWeight: "bold", color: textColor }}
                            >
                                {formatElapsedTime(elapsedTime)}
                            </Text>
                        </View>
                    );
                } else if (mode === "template") {
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
                } else {
                    return (
                        <Text style={{ fontSize: 16, fontWeight: "bold", color: textColor }}>
                            Add Workout
                        </Text>
                    );
                }
            },
            headerRight: () => (
                <TouchableOpacity onPress={saveWorkout}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: textColor }}>Done</Text>
                </TouchableOpacity>
            ),
            headerLeft: () => (
                <TouchableOpacity onPress={confirmClose}>
                    <Text style={{ fontSize: 16, color: textColor }}>Cancel</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation, textColor, saveWorkout, elapsedTime, mode]);


    // ───── Modal & Exercise Handlers ─────
    const closeModal = () => {
        setModalVisible(false);
        setActionsList([]);
        setExerciseName("");
        setExerciseNameBlurred(false);
        setLockedExerciseTitle("");
        setEditIndex(null);
        setResetExpansionTrigger(prev => prev + 1);
    };

    const confirmClose = () => {
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    message: "Are you sure you want to discard this workout? Your current progress will be lost.",
                    options: ["Cancel", "Delete"],
                    cancelButtonIndex: 0,
                    destructiveButtonIndex: 1,
                    userInterfaceStyle: "dark",
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        navigation.goBack();
                    }
                }
            );
        } else {
            Alert.alert(
                "Delete Exercise?",
                "Are you sure you want to delete this exercise? This action cannot be undone.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: onClose },
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

        const newExercise: Exercise = {
            name: exerciseName,
            type: exerciseType,
            actions: computeNumberedActions(actionsList),
            editDurationInSeconds: editDuration,
        };

        setExercises(prev => {
            const updated = [...prev];
            if (editIndex !== null) {
                updated[editIndex] = newExercise;
            } else {
                updated.push(newExercise);
            }

            exercisesRef.current = updated;
            closeModal();
            return updated;
        });
    };


    // ───── Action Handlers ─────
    const addSet = () => {
        let newSet: any = {
            id: nanoid(), // 🆕
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
        setActionsList(updatedList);
        setTriggerScrollToEnd(true);
        console.log("Updated Actions List:", JSON.stringify(updatedList, null, 2));
    };

    const addRest = () => {
        const newRest = {
            id: nanoid(), // 🆕
            type: "rest",
            value: "",
            restInSeconds: 0
        };

        const updatedList = computeNumberedActions([...actionsList, newRest]);
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
        console.log("Exercises BEFORE delete:");
        console.log(JSON.stringify(exercises, null, 2));

        const updated = exercises.filter((_, idx) => idx !== indexToDelete);

        console.log(`Deleting exercise at index: ${indexToDelete}`);
        console.log("Exercises AFTER delete:");
        console.log(JSON.stringify(updated, null, 2));

        setExercises(updated);
        exercisesRef.current = updated;
    };
    // ───── Date Picker Handler ─────
    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) setDate(selectedDate);
    };

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
                                value={notes}
                                onChangeText={setNotes}
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


                        {/* Divider
                        {mode === "live" && (
                            <View style={{
                                height: 1,
                                backgroundColor: dividerColor,
                                opacity: 0.4,
                                marginVertical: 7
                            }} />
                        )} */}
                        {/* Hiding this for now will revisit it later */}
                        {/* Workout Date
                        {mode === "live" && (
                            <View style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 10,
                                minHeight: 35
                            }}>
                                <Text style={{ fontSize: 15, color: textColor }}>Workout Date</Text>
                                <View style={{
                                    height: 30,
                                    justifyContent: "center"
                                }}>
                                    <DateTimePicker
                                        value={date}
                                        mode="date"
                                        display="default"
                                        onChange={(event, selectedDate) => {
                                            if (selectedDate) setDate(selectedDate);
                                        }}
                                        style={{ transform: [{ scale: 0.85 }] }}
                                    />
                                </View>
                            </View>
                        )}
                        {/* Divider */}
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
                                value={notes}
                                onChangeText={setNotes}
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
                                onPress={() => setModalVisible(true)}
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
                        </View>
                    </View>

                    {/* Draggable Exercise Panel with List of Exercises */}
                    {exercises.length > 0 && (
                        <DraggableExercisePanel
                            exercises={exercises}
                            onPressExercise={(index) => {
                                const exercise = exercises[index];
                                setEditIndex(index);
                                setExerciseName(exercise.name);
                                setExerciseType(exercise.type);
                                setActionsList(exercise.actions);
                                setLockedExerciseTitle(exercise.name);
                                setExerciseNameBlurred(true);
                                setEditDuration(exercise.editDurationInSeconds || 0);
                                setModalVisible(true);
                            }}
                            onDeleteExercise={confirmDeleteExercise}
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
                onCloseWithDuration={(duration) => setEditDuration(duration)}
                trackTime={mode !== "template"}
            />
        </>
    );
}

