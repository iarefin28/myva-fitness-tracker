import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker"; // <--- New import
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Button, Platform, ScrollView, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";

type ExerciseOrRest = {
    id: number;
    type: "exercise" | "rest";
    name?: string;   // only for exercise
    sets?: number;   // only for exercise
    reps?: number;   // only for exercise
    duration?: number; // only for rest
};


export default function AddWorkout() {
    const [workoutName, setWorkoutName] = useState("");
    const [exercises, setExercises] = useState<ExerciseOrRest[]>([]);
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const navigation = useNavigation();
    const router = useRouter();
    const scheme = useColorScheme();
    const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const borderColor = scheme === "dark" ? "#444" : "#ccc";


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

    const addExerciseCard = () => {
        const newExercise = {
            id: Date.now(),
            type: "exercise",
            name: "",
            sets: 0,
            reps: 0
        };
        setExercises([...exercises, newExercise]);
    };

    const addRestCard = () => {
        const newRest = {
            id: Date.now(),
            type: "rest",
            duration: 60
        };
        setExercises([...exercises, newRest]);
    };

    const saveWorkout = async () => {
        if (workoutName.trim().length === 0 || exercises.length === 0) return;

        const existingWorkouts = await AsyncStorage.getItem("workouts");
        let workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];

        workouts.push({
            id: Date.now(),
            workoutName,
            exercises,
            notes,
            date: date.toISOString(), // <--- Use selected date
        });

        await AsyncStorage.setItem("workouts", JSON.stringify(workouts));

        router.back();
    };

    const onChangeDate = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === "ios"); // On Android, picker closes automatically
        if (selectedDate) {
            setDate(selectedDate);
        }
    };

    return (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={{ backgroundColor: "#1e1e1e", borderRadius: 12, padding: 16, marginVertical: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 }}>
                {/* Workout Date */}
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

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: scheme === "dark" ? "#333" : "#ccc", opacity: 0.4, marginVertical: 12 }} />

                {/* Workout Name */}
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
                <TouchableOpacity onPress={addExerciseCard} style={{ flex: 1, backgroundColor: "#1e90ff", padding: 12, borderRadius: 8, marginRight: 10 }}>
                    <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Add Exercise</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={addRestCard} style={{ flex: 1, backgroundColor: "#ff4d4d", padding: 12, borderRadius: 8 }}>
                    <Text style={{ color: "white", fontWeight: "bold", textAlign: "center" }}>Add Rest</Text>
                </TouchableOpacity>
            </View>

            {exercises.map((ex, index) => (
                <View key={ex.id} style={{ padding: 12, backgroundColor: borderColor, marginBottom: 10, borderRadius: 8 }}>
                    {ex.type === "exercise" ? (
                        <>
                            <TextInput
                                value={ex.name}
                                onChangeText={(text) => {
                                    const updated = [...exercises];
                                    updated[index].name = text;
                                    setExercises(updated);
                                }}
                                placeholder="Exercise Name"
                                placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                                style={{ color: textColor, backgroundColor: "#2a2a2a", borderRadius: 8, padding: 8, marginBottom: 8 }}
                            />
                            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                <TextInput
                                    value={ex.sets?.toString() ?? ""}
                                    keyboardType="number-pad"
                                    onChangeText={(text) => {
                                        const updated = [...exercises];
                                        updated[index].sets = parseInt(text) || 0;
                                        setExercises(updated);
                                    }}
                                    placeholder="Sets"
                                    placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                                    style={{ flex: 1, marginRight: 10, backgroundColor: "#2a2a2a", color: textColor, borderRadius: 8, padding: 8 }}
                                />
                                <TextInput
                                    value={ex.reps?.toString() ?? ""}
                                    keyboardType="number-pad"
                                    onChangeText={(text) => {
                                        const updated = [...exercises];
                                        updated[index].reps = parseInt(text) || 0;
                                        setExercises(updated);
                                    }}
                                    placeholder="Reps"
                                    placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                                    style={{ flex: 1, backgroundColor: "#2a2a2a", color: textColor, borderRadius: 8, padding: 8 }}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <Text style={{ color: textColor, marginBottom: 8 }}>Rest Period (seconds)</Text>
                            <TextInput
                                value={ex.duration?.toString() ?? ""}
                                keyboardType="number-pad"
                                onChangeText={(text) => {
                                    const updated = [...exercises];
                                    updated[index].duration = parseInt(text) || 0;
                                    setExercises(updated);
                                }}
                                placeholder="Duration"
                                placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                                style={{ color: textColor, backgroundColor: "#3a1a1a", borderRadius: 8, padding: 8 }}
                            />
                        </>
                    )}
                </View>
            ))}

            {/* Notes Section */}
            <Text style={{ fontSize: 16, marginVertical: 3, color: textColor }}>Notes</Text>
            <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Any extra comments..."
                placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                multiline
                style={{ borderWidth: 1, borderColor, padding: 10, height: 100, textAlignVertical: "top", borderRadius: 8, color: textColor }}
            />

            <Button title="Save Workout" onPress={saveWorkout} />
        </ScrollView>
    );
}