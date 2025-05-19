import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import { Keyboard, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from "react-native";

import ExerciseCard from "../components/ExerciseCard";
import type { Exercise, ExerciseAction, ExerciseType } from "../types/workout";

import ExerciseInteractiveModal from "../components/ExerciseInteractiveModal";

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
    const [exerciseNameBlurred, setExerciseNameBlurred] = useState(false);
    const [lockedExerciseTitle, setLockedExerciseTitle] = useState("");
    const [exerciseType, setExerciseType] = useState<ExerciseType>("unknown");;
    const scrollViewRef = useRef<ScrollView>(null);

    // ───── Action Management State ─────
    const [actionsList, setActionsList] = useState<ExerciseAction[]>([]);
    const [setCounter, setSetCounter] = useState(1);
    const [restCounter, setRestCounter] = useState(1);


    const [editIndex, setEditIndex] = useState<number | null>(null);


    // ───── Layout Effect for Header Buttons ─────
    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={saveWorkout} style={{ marginRight: 15 }}>
                    <Text style={{ fontSize: 16, fontWeight: "bold", color: textColor }}>Done</Text>
                </TouchableOpacity>
            ),
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
                    <Text style={{ fontSize: 16, color: textColor }}>Cancel</Text>
                </TouchableOpacity>
            )
        });
    }, [navigation]);

    // ───── Modal & Exercise Handlers ─────
    const closeModal = () => {
        setModalVisible(false);
        setActionsList([]);
        setExerciseName("");
        setSetCounter(1);
        setRestCounter(1);
        setExerciseNameBlurred(false);
        setLockedExerciseTitle("");
        setEditIndex(null);
    };

    const handleSaveExercise = () => {
        if (!exerciseName || actionsList.length === 0) return;
    
        const newExercise: Exercise = {
            name: exerciseName,
            type: exerciseType,
            actions: actionsList
        };
    
        if (editIndex !== null) {
            // Editing existing exercise
            setExercises(prev => {
                const updated = [...prev];
                updated[editIndex] = newExercise;
                return updated;
            });
        } else {
            // Adding new exercise
            setExercises(prev => [...prev, newExercise]);
        }
    
        closeModal();
    };

    // ───── Workout Save (To Implement) ─────
    const saveWorkout = async () => {
        // TODO: Save workout to storage
    };

    // ───── Action Handlers ─────
    const addSet = () => {
        let newSet: any = {
            type: "set",
            setNumber: setCounter,
        };

        switch (exerciseType) {
            case "weighted":
                newSet = {
                    ...newSet,
                    weight: "",
                    weightUnit: "lb",
                    reps: "",
                    unit: "lb",
                    note: ""
                };
                break;
            case "bodyweight":
                newSet = {
                    ...newSet,
                    reps: "",
                    unit: "" // No toggle needed
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

        setActionsList(prev => [...prev, newSet]);
        setSetCounter(prev => prev + 1);
    };

    const addRest = () => {
        setActionsList(prev => [
            ...prev,
            {
                type: "rest",
                restNumber: restCounter,
                value: "", 
            }
        ]);
        setRestCounter(prev => prev + 1);
    };

    const updateActionValue = (
        index: number,
        field: "reps" | "weight" | "value" | "unit" | "weightUnit" | "valueUnit" | "note",
        value: string
    ) => {
        setActionsList(prev =>
            prev.map((action, i) =>
                i === index ? { ...action, [field]: value } : action
            )
        );
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
                            onChangeText={setWorkoutName}
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
                    {exercises.length > 0 && (
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
                                />
                                ))}
                            </ScrollView>
                        </View>
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
                isEditing={editIndex !== null}
            />
        </>
    );
}

