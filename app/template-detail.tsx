import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";

import ExerciseCard from "@/components/ExerciseCard";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";




export default function TemplateDetail() {
    const route = useRoute();
    const { templateId } = route.params || {};
    const router = useRouter();
    const scheme = useColorScheme();
    const insets = useSafeAreaInsets();


    const [template, setTemplate] = useState<any>(null);

    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const cardColor = scheme === "dark" ? "#1a1a1a" : "#ffffff";
    const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";

    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        const loadTemplate = async () => {
            const stored = await AsyncStorage.getItem("savedTemplates");
            if (!stored) return;

            const parsed = JSON.parse(stored);
            const found = parsed.find((t: any) => t.id.toString() === templateId?.toString());
            if (found) {
                setTemplate(found);
            }
        };

        loadTemplate();
    }, [templateId]);

    const handleSchedule = () => {
        setShowPicker(true);
    };

    if (!template) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor }}>
                <Text style={{ fontSize: 18, color: textColor }}>Template not found.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor }}>
            {/* Template Title */}
            <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor }}>
                    {template.name}
                </Text>
            </View>

            {/* Scrollable Exercise List */}
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {template.exercises.map((exercise: any, index: number) => (
                    <ExerciseCard
                        key={index}
                        exercise={exercise}
                        defaultExpanded
                        disableToggle
                        showNotesButton={false}
                    />
                ))}
            </ScrollView>

            <View
                style={{
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: insets.bottom + 12,
                    borderTopWidth: 1,
                    borderTopColor: scheme === "dark" ? "#222" : "#eee",
                    backgroundColor: backgroundColor,
                    flexDirection: "row",
                    justifyContent: "space-between",
                }}
            >
                {/* Start Now */}
                <TouchableOpacity
                    onPress={() =>
                        router.push(`/add-workout?mode=live&templateId=${template.id}`)
                    }
                    style={{
                        backgroundColor: "#1e90ff",
                        paddingVertical: 14,
                        alignItems: "center",
                        borderRadius: 10,
                        width: "48%",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
                        Start Now
                    </Text>
                </TouchableOpacity>

                {/* Schedule */}
                <TouchableOpacity
                    onPress={() => setShowPicker(true)}
                    style={{
                        backgroundColor: scheme === "dark" ? "#333" : "#ddd",
                        paddingVertical: 14,
                        alignItems: "center",
                        borderRadius: 10,
                        width: "48%",
                    }}
                >
                    <Text style={{ color: textColor, fontWeight: "bold", fontSize: 15 }}>
                        Schedule
                    </Text>
                </TouchableOpacity>

                {showPicker && (
                    <DateTimePicker
                        value={new Date()}
                        mode="datetime"
                        display={Platform.OS === "ios" ? "inline" : "default"}
                        onChange={async (event, selectedDate) => {
                            setShowPicker(false);
                            if (!selectedDate) return;

                            const scheduledWorkout = {
                                id: Date.now(),
                                templateId: template.id,
                                name: template.name,
                                exercises: template.exercises,
                                scheduledFor: selectedDate.toISOString(),
                                status: "pending",
                            };

                            const existing = await AsyncStorage.getItem("scheduledWorkouts");
                            const parsed = existing ? JSON.parse(existing) : [];

                            parsed.push(scheduledWorkout);
                            await AsyncStorage.setItem("scheduledWorkouts", JSON.stringify(parsed));

                            alert("✅ Workout scheduled!");
                        }}
                    />
                )}
            </View>
        </View >
    );
}
