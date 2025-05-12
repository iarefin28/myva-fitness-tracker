import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useColorScheme, View } from "react-native";

import ActionInput from "../components/ActionInput";
import ExerciseAutocomplete from "../components/ExerciseAutocomplete";
import ExerciseCard from "../components/ExerciseCard";
import type { Exercise, ExerciseAction } from "../types/workout";


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
    const [exerciseType, setExerciseType] = useState<"bodyweight" | "weighted" | "duration" | "unknown" | "weighted distance" | "weighted duration">("unknown");

    // ───── Action Management State ─────
    const [actionsList, setActionsList] = useState<ExerciseAction[]>([]);
    const [setCounter, setSetCounter] = useState(1);
    const [restCounter, setRestCounter] = useState(1);

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
    };

    const handleSaveExercise = () => {
        if (!exerciseName || actionsList.length === 0) return;
        const newExercise: Exercise = {
            name: exerciseName,
            type: exerciseType,
            actions: actionsList
        };
        setExercises(prev => [...prev, newExercise]);
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
        console.log(exerciseName + exerciseType)

        switch (exerciseType) {
            case "weighted":
                newSet = {
                    ...newSet,
                    weight: "",
                    reps: "",
                    unit: "lb"
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
                    value: "",
                    unit: "m"
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
                unit: "sec"
            }
        ]);
        setRestCounter(prev => prev + 1);
    };

    const updateActionValue = (
        index: number,
        field: "reps" | "weight" | "value" | "unit",
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
                    {/* Exercises Header */}
                    {exercises.length > 0 && (
                        <Text style={{ color: textColor, fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Exercises</Text>
                    )}

                    {/* Scrollable Cards Only */}
                    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} >
                        {exercises.length === 0 ? (
                            <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-start", paddingTop: 150, paddingHorizontal: 20 }}>
                                <Text style={{ color: "#666", fontSize: 13, textAlign: "center" }}>
                                    No exercises yet. Build your workout above.
                                </Text>
                            </View>
                        ) : (
                            exercises.map((exercise, index) => (
                                <ExerciseCard key={index} exercise={exercise} />
                            ))
                        )}
                    </ScrollView>
                </View>
            </TouchableWithoutFeedback>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => closeModal()}
            >
                <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0, 0, 0, 1)" }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{
                            backgroundColor: "rgba(44, 44, 46, 1)",
                            height: "95%",
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            padding: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 20,
                            }}
                        >
                            <TouchableOpacity onPress={closeModal} style={{ padding: 4, minWidth: 50 }}>
                                <AntDesign name="close" size={24} color="white" />
                            </TouchableOpacity>

                            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                                {exerciseNameBlurred && !!lockedExerciseTitle && (
                                    <Text
                                        numberOfLines={1}
                                        ellipsizeMode="tail"
                                        style={{
                                            color: "white",
                                            fontSize: 16,
                                            fontWeight: "bold",
                                            textAlign: "center",
                                            maxWidth: "90%",
                                        }}
                                    >
                                        {lockedExerciseTitle}
                                    </Text>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleSaveExercise}
                                style={{ padding: 4, minWidth: 50, alignItems: "flex-end" }}
                            >
                                <Text style={{ color: "#1e90ff", fontWeight: "bold", fontSize: 16 }}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        {exerciseNameBlurred && !!lockedExerciseTitle ? (
                            <View
                                style={{
                                    backgroundColor: "#1e1e1e",
                                    borderRadius: 16,
                                    paddingVertical: 14,
                                    paddingHorizontal: 16,
                                    shadowColor: "#000",
                                    shadowOpacity: 0.15,
                                    shadowOffset: { width: 0, height: 6 },
                                    shadowRadius: 10,
                                    elevation: 6,
                                    marginBottom: 8,
                                }}
                            >
                                <Text style={{ color: "white", fontSize: 16, fontWeight: "400" }}>
                                    {lockedExerciseTitle}
                                </Text>
                            </View>
                        ) : (
                            <ExerciseAutocomplete
                                value={exerciseName}
                                onChangeText={(text) => {
                                    setExerciseName(text);
                                    setExerciseNameBlurred(false);
                                }}
                                onSelect={(exercise, type) => {
                                    setExerciseName(exercise);
                                    setExerciseType(type);
                                    setExerciseNameBlurred(true);
                                    setLockedExerciseTitle(exercise);
                                }}
                            />
                        )}

                        {lockedExerciseTitle && (
                            <>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: "yellow",
                                            paddingVertical: 16,
                                            borderRadius: 12,
                                            marginRight: 4,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        onPress={addSet}
                                    >
                                        <Text style={{ color: "black", fontWeight: "bold", fontSize: 16 }}>+ Add Set</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={{
                                            flex: 1,
                                            backgroundColor: "orange",
                                            paddingVertical: 16,
                                            borderRadius: 12,
                                            marginLeft: 4,
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                        onPress={addRest}
                                    >
                                        <Text style={{ color: "black", fontWeight: "bold", fontSize: 16 }}>+ Add Rest</Text>
                                    </TouchableOpacity>
                                </View>

                                {actionsList.map((action, index) => (
                                    <ActionInput
                                        key={index}
                                        action={action}
                                        index={index}
                                        updateActionValue={updateActionValue}
                                        exerciseType={exerciseType}
                                    />
                                ))}
                            </>
                        )}
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}

