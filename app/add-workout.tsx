import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker"; // <--- New import
import { useNavigation, useRouter } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { Button, Platform, ScrollView, Text, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";

export default function AddWorkout() {
    const [workoutName, setWorkoutName] = useState("");
    const [exercises, setExercises] = useState<string[]>([]);
    const [currentExercise, setCurrentExercise] = useState("");
    const [notes, setNotes] = useState("");
    const [date, setDate] = useState(new Date()); // <--- New state
    const [showDatePicker, setShowDatePicker] = useState(false); // <--- New state
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

    const addExercise = () => {
        if (currentExercise.trim().length > 0) {
            setExercises([...exercises, currentExercise.trim()]);
            setCurrentExercise("");
        }
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
        <ScrollView style={{ flex: 1, padding: 20, backgroundColor }}>
            <Text style={{ fontSize: 24, marginBottom: 10, color: textColor }}>Add a Workout</Text>

            <View style={{ marginBottom: 20, borderWidth: 0, borderColor, borderRadius: 8, overflow: "hidden" }}>
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        if (selectedDate) {
                            setDate(selectedDate);
                        }
                    }}
                    style={{ width: "100%" }}
                />
            </View>

            <Text style={{ fontSize: 16, marginBottom: 3, color: textColor }}>Workout Name</Text>
            <TextInput
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder="e.g., Push Day, Leg Day"
                placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                style={{ borderWidth: 1, borderColor, padding: 10, marginBottom: 20, borderRadius: 8, color: textColor }}
            />

            <Text style={{ fontSize: 16, marginBottom: 3, color: textColor }}>Exercises</Text>
            <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <TextInput
                    value={currentExercise}
                    onChangeText={setCurrentExercise}
                    placeholder="e.g., Squats"
                    placeholderTextColor={scheme === "dark" ? "#888" : "#aaa"}
                    style={{ flex: 1, borderWidth: 1, borderColor, padding: 10, borderRadius: 8, color: textColor }}
                />
                <TouchableOpacity onPress={addExercise} style={{ marginLeft: 10, justifyContent: "center", paddingHorizontal: 10, backgroundColor: "#1e90ff", borderRadius: 8 }}>
                    <Text style={{ color: "white", fontWeight: "bold" }}>Add</Text>
                </TouchableOpacity>
            </View>

            {exercises.map((ex, index) => (
                <View key={index} style={{ padding: 10, backgroundColor: borderColor, marginBottom: 5, borderRadius: 8 }}>
                    <Text style={{ color: textColor }}>{ex}</Text>
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