import { AntDesign } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Button, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";

export default function AddWorkout() {
    const [workoutName, setWorkoutName] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const navigation = useNavigation();
    const router = useRouter();
    const scheme = useColorScheme();
    const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const borderColor = scheme === "dark" ? "#444" : "#ccc";
    const [exercises, setExercises] = useState<any[]>([]);
    const [exerciseName, setExerciseName] = useState("");
    const [sets, setSets] = useState("");
    const [reps, setReps] = useState("");

    const [setList, setSetList] = useState<any[]>([]);
    const [restList, setRestList] = useState<any[]>([]);
    const [setCounter, setSetCounter] = useState(1);
    const [restCounter, setRestCounter] = useState(1);

    const closeModal = () => {
        setModalVisible(false);
        setActionsList([]); // <-- ADD THIS to clear sets/rest when closing
        setExerciseName("");
        setSets("");
        setReps("");
        setSetCounter(1);
        setRestCounter(1);
    };

    const [actionsList, setActionsList] = useState<any[]>([]);

    const addSet = () => {
        setActionsList([
            ...actionsList,
            {
                type: "set",
                setNumber: setCounter,
                reps: "",
                weight: "",
                unit: "lb"
            }
        ]);
        setSetCounter(prev => prev + 1);
    };

    const addRest = () => {
        setActionsList([
            ...actionsList,
            {
                type: "rest",
                restNumber: restCounter,
                value: "",
                unit: "sec"
            }
        ]);
        setRestCounter(prev => prev + 1);
    };

    const updateActionValue = (index: number, field: "reps" | "weight" | "value" | "unit", value: string) => {
        setActionsList(prev =>
            prev.map((action, i) =>
                i === index ? { ...action, [field]: value } : action
            )
        );
    };

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

    const saveWorkout = async () => {
        // Save logic here
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios");
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    const handleSaveExercise = () => {
        if (!exerciseName || !sets || !reps) return; // Simple validation

        const newExercise = {
            name: exerciseName,
            sets: sets,
            reps: reps
        };

        setExercises([...exercises, newExercise]);

        // Reset modal state
        setExerciseName("");
        setSets("");
        setReps("");
        closeModal();
    };

    return (
        <>
            <ScrollView style={{ flex: 1, padding: 20 }}>
                <View style={{ backgroundColor: "#1e1e1e", borderRadius: 12, padding: 16, marginVertical: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, color: textColor }}>Workout Date</Text>
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                if (selectedDate) {
                                    setDate(selectedDate);
                                }
                            }}
                            style={{ width: 150 }}
                        />
                    </View>

                    <View style={{ height: 1, backgroundColor: scheme === "dark" ? "#333" : "#ccc", opacity: 0.4, marginVertical: 12 }} />

                    <View>
                        <Text style={{ fontSize: 16, color: textColor, marginBottom: 5 }}>Workout Name</Text>
                        <TextInput
                            value={workoutName}
                            onChangeText={setWorkoutName}
                            placeholder="e.g., Push Day, Leg Day"
                            placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                            style={{ color: textColor, backgroundColor: "#2a2a2a", borderRadius: 8, padding: 12 }}
                        />
                    </View>
                </View>

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                    <TouchableOpacity
                        style={{ flex: 1, backgroundColor: "#1e90ff", padding: 12, borderRadius: 8, marginRight: 10 }}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Add Exercise</Text>
                    </TouchableOpacity>
                </View>

                {exercises.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ color: textColor, fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>Exercises</Text>
                        {exercises.map((exercise, index) => (
                            <View key={index} style={{ backgroundColor: "#2a2a2a", borderRadius: 8, padding: 12, marginBottom: 10 }}>
                                <Text style={{ color: "white", fontSize: 16 }}>{exercise.name}</Text>
                                <Text style={{ color: "#aaa" }}>Sets: {exercise.sets} | Reps: {exercise.reps}</Text>
                            </View>
                        ))}
                    </View>
                )}

                <Button title="Save Workout" onPress={saveWorkout} />
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => closeModal()}
            >
                <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={{
                            backgroundColor: "#2a2a2a",
                            height: "95%",
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            padding: 20,
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                            <TouchableOpacity onPress={() => closeModal()}>
                                <AntDesign name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            

                            <Text style={{ color: "white", marginBottom: 5 }}>Exercise Name</Text>
                            <TextInput
                                placeholder="e.g. Bench Press"
                                placeholderTextColor="#888"
                                value={exerciseName}
                                onChangeText={setExerciseName}
                                style={{ backgroundColor: "#3a3a3a", color: "white", borderRadius: 8, padding: 12, marginBottom: 12 }}
                            />

                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: "yellow", paddingVertical: 16, borderRadius: 12, marginRight: 4, alignItems: "center", justifyContent: "center" }}
                                    onPress={addSet}
                                >
                                    <Text style={{ color: "black", fontWeight: "bold", fontSize: 16 }}>+ Add Set</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: "orange", paddingVertical: 16, borderRadius: 12, marginLeft: 4, alignItems: "center", justifyContent: "center" }}
                                    onPress={addRest}
                                >
                                    <Text style={{ color: "black", fontWeight: "bold", fontSize: 16 }}>+ Add Rest</Text>
                                </TouchableOpacity>
                            </View>

                            {actionsList.map((action, index) => (
                                <View key={index} style={{ backgroundColor: action.type === "set" ? "#3a3a3a" : "#262626", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                        <Text style={{ color: "white", fontSize: 16 }}>
                                            {action.type === "set"
                                                ? `Set #${action.setNumber}`
                                                : `Rest #${action.restNumber} (${action.unit})`}
                                        </Text>
                                        {action.type === "set" ? (
                                            <View style={{ flexDirection: "row", gap: 8 }}>
                                                <TextInput
                                                    placeholder="Weight"
                                                    placeholderTextColor="#888"
                                                    keyboardType="numeric"
                                                    value={action.weight}
                                                    onChangeText={(value) => updateActionValue(index, "weight", value)}
                                                    style={{
                                                        backgroundColor: "#2a2a2a",
                                                        color: "white",
                                                        borderRadius: 6,
                                                        padding: 8,
                                                        width: 80,
                                                        textAlign: "center"
                                                    }}
                                                />
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        updateActionValue(index, "unit", action.unit === "lb" ? "kg" : "lb")
                                                    }
                                                    style={{
                                                        backgroundColor: "#444",
                                                        paddingVertical: 6,
                                                        paddingHorizontal: 10,
                                                        borderRadius: 6
                                                    }}
                                                >
                                                    <Text style={{ color: "white", fontSize: 14 }}>
                                                        {action.unit}
                                                    </Text>
                                                </TouchableOpacity>
                                                <TextInput
                                                    placeholder="Reps"
                                                    placeholderTextColor="#888"
                                                    keyboardType="numeric"
                                                    value={action.reps}
                                                    onChangeText={(value) => updateActionValue(index, "reps", value)}
                                                    style={{
                                                        backgroundColor: "#2a2a2a",
                                                        color: "white",
                                                        borderRadius: 6,
                                                        padding: 8,
                                                        width: 80,
                                                        textAlign: "center"
                                                    }}
                                                />

                                            </View>
                                        ) : (
                                            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                                                {/* Rest Duration */}
                                                <TextInput
                                                    placeholder="Time"
                                                    placeholderTextColor="#888"
                                                    keyboardType="numeric"
                                                    value={action.value}
                                                    onChangeText={(value) => updateActionValue(index, "value", value)}
                                                    style={{
                                                        backgroundColor: "#2a2a2a",
                                                        color: "white",
                                                        borderRadius: 6,
                                                        padding: 8,
                                                        width: 80,
                                                        textAlign: "center",
                                                        fontSize: 15,
                                                        borderWidth: 1,
                                                        borderColor: "#333"
                                                    }}
                                                />

                                                {/* Time Unit Toggle */}
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        updateActionValue(index, "unit", action.unit === "sec" ? "min" : "sec")
                                                    }
                                                    style={{
                                                        backgroundColor: "#444",
                                                        paddingVertical: 8,
                                                        paddingHorizontal: 12,
                                                        borderRadius: 6,
                                                        borderWidth: 1,
                                                        borderColor: "#555",
                                                        justifyContent: "center",
                                                        alignItems: "center"
                                                    }}
                                                >
                                                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                                                        {action.unit}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}

                            <Pressable
                                style={{ backgroundColor: "#1e90ff", padding: 12, borderRadius: 8, marginBottom: 10 }}
                                onPress={handleSaveExercise}
                            >
                                <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Save Exercise</Text>
                            </Pressable>
                            <Pressable
                                style={{ backgroundColor: "#ff5555", padding: 12, borderRadius: 8 }}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={{ color: "white", textAlign: "center", fontWeight: "bold" }}>Cancel</Text>
                            </Pressable>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </>
    );
}
