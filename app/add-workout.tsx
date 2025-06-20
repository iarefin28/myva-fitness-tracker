import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ActionSheetIOS, Alert, Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from "react-native";

import type { Exercise, ExerciseAction, ExerciseType } from "../types/workout";

import ExerciseInteractiveModal from "../components/ExerciseInteractiveModal";

import DraggableExercisePanel from "@/components/DraggableExercisePanel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from 'nanoid/non-secure';

export default function AddWorkout() {
    // ───── Theme & Navigation ─────
    const scheme = useColorScheme();
    const navigation = useNavigation();
    const router = useRouter();

    const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const borderColor = scheme === "dark" ? "#444" : "#ccc";

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

    useEffect(() => {
        exercisesRef.current = exercises;
    }, [exercises]);

    // ───── Workout Save (To Implement) ─────
    const saveWorkout = useCallback(async () => {
        console.log("");
        console.log("Workout Name:", workoutName);
        console.log("Exercise length:", exercisesRef.current.length);

        if (!workoutName || exercises.length === 0) return;

        const workout = {
            id: Date.now(),
            name: workoutName,
            notes,
            date: date.toISOString(),
            exercises: exercisesRef.current,
        };

        try {
            const existing = await AsyncStorage.getItem("savedWorkouts");
            const parsed = existing ? JSON.parse(existing) : [];

            parsed.push(workout);

            const jsonString = JSON.stringify(parsed, null, 2); //pretty print
            console.log("JSON to be saved:");
            console.log(jsonString); // 

            await AsyncStorage.setItem("savedWorkouts", jsonString);

            console.log("Workout saved successfully!");
            navigation.goBack();
        } catch (error) {
            console.error("Failed to save workout:", error);
        }
    }, [workoutName, notes, date, exercises]);


    // ───── Layout Effect for Header Buttons ─────
    useLayoutEffect(() => {
        navigation.setOptions({
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
    }, [navigation, textColor, saveWorkout]);


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
                    {/* Motivational Quote: this could be made up of quotes from the user themselves after they keep tracking workouts */}
                    <Text style={{
                        color: "#888",
                        fontSize: 14,
                        fontStyle: "italic",
                        textAlign: "center",
                        marginBottom: 16,
                        paddingHorizontal: 12
                    }}>
                        “Discipline is doing what needs to be done, even when you don’t feel like doing it.”– Unknown
                    </Text>
                    {/* Workout Info */}
                    <View style={{
                        backgroundColor: "#1e1e1e",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 2
                    }}>
                        {/* Pre-Workout Notes */}
                        <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Write a pre-workout note for reflection"
                            placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                            multiline
                            scrollEnabled
                            blurOnSubmit={false}
                            style={{
                                color: textColor,
                                backgroundColor: "#2a2a2a",
                                borderRadius: 8,
                                paddingHorizontal: 10,
                                paddingTop: 12,
                                paddingBottom: 10,
                                height: 65,
                                fontSize: 14,
                                textAlignVertical: "top"
                            }}
                        />

                        {/* Divider */}
                        <View style={{
                            height: 1,
                            backgroundColor: scheme === "dark" ? "#333" : "#ccc",
                            opacity: 0.4,
                            marginVertical: 7
                        }} />

                        {/* Workout Date */}
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

                        {/* Divider */}
                        <View style={{
                            height: 1,
                            backgroundColor: scheme === "dark" ? "#333" : "#ccc",
                            opacity: 0.4,
                            marginVertical: 7
                        }} />

                        {/* Workout Name */}
                        <TextInput
                            value={workoutName}
                            onChangeText={(text) => setWorkoutName(text)}
                            placeholder="e.g., Push Day, Leg Day"
                            placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                            style={{
                                color: textColor,
                                backgroundColor: "#2a2a2a",
                                borderRadius: 8,
                                padding: 10,
                                fontSize: 14
                            }}
                        />
                    </View>

                    {/* Add Exercise Button */}
                    <View style={{ marginTop: -10, marginBottom: 16 }}>
                        <TouchableOpacity
                            onPress={() => setModalVisible(true)}
                            style={{
                                backgroundColor: "#1e90ff",
                                borderRadius: 8,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                alignItems: "center"
                            }}
                        >
                            <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
                                + Add Exercise
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {/* {exercises.length > 0 && (
                        <View style={{
                            flex: 1,
                            backgroundColor: "#1e1e1e",
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingTop: 16,
                            paddingHorizontal: 16,
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            top: 350, // adjust this value depending on where you want the overlay to *start*
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: -6 },
                            shadowOpacity: 0.3,
                            shadowRadius: 12,
                            elevation: 10,
                            zIndex: 2
                        }}>
                            <Text style={{
                                color: textColor,
                                fontSize: 18,
                                fontWeight: "bold",
                                marginBottom: 12,
                                textAlign: "center"
                            }}>
                                Your Exercises
                            </Text>

                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 100 }}
                            >
                                {exercises.map((exercise, index) => (
                                    <ExerciseCard
                                        key={index}
                                        exercise={exercise}
                                        onPress={() => {
                                            setEditIndex(index);
                                            setExerciseName(exercise.name);
                                            setExerciseType(exercise.type);
                                            setActionsList(exercise.actions);
                                            setLockedExerciseTitle(exercise.name);
                                            setExerciseNameBlurred(true);
                                            setModalVisible(true);
                                        }}
                                        onDelete={() => confirmDeleteExercise(index)}
                                        defaultExpanded={false}
                                    />
                                ))}
                            </ScrollView>
                        </View>
                    )} */}
                    <DraggableExercisePanel></DraggableExercisePanel>
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
            />
        </>
    );
}

