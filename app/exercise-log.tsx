import { useNavigation } from "@react-navigation/native";
import { useLayoutEffect } from "react";
import { ScrollView, Text, useColorScheme } from "react-native";
import ExerciseCard from "../components/ExerciseCard";

export default function ExerciseLogScreen() {
    const scheme = useColorScheme();
    const navigation = useNavigation();

    useLayoutEffect(() => {
        const isDark = scheme === "dark";

        navigation.setOptions({
            title: "",
            headerTintColor: isDark ? "#fff" : "#000",
            headerStyle: {
                backgroundColor: isDark ? "#000" : "#fff",
            },
            headerBackTitleVisible: false, 
        });
    }, [navigation, scheme]);

    const backgroundColor = scheme === "dark" ? "#000" : "#fff";
    const textColor = scheme === "dark" ? "#fff" : "#000";

    const exercises = globalThis.tempExercises || [];

    return (
        <ScrollView style={{ flex: 1, backgroundColor, padding: 16 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", color: textColor, marginBottom: 10 }}>
                Workout Breakdown
            </Text>

            {exercises.map((exercise: any, index: number) => (
                <ExerciseCard
                    key={index}
                    exercise={exercise}
                    defaultExpanded
                    disableToggle
                />
            ))}
        </ScrollView>
    );
}
