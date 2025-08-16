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

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useCallback, useLayoutEffect } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";



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

    const navigation = useNavigation();

    // open Edit in AddWorkout (template mode)
    const onEditTemplate = () => {
        router.push(`/add-workout?mode=template&templateId=${template.id}`);
    };

    // delete from storage and leave screen
    const onDeleteTemplate = async () => {
        Alert.alert("Delete template", "This cannot be undone. Delete?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const raw = await AsyncStorage.getItem("savedTemplates");
                        const list = raw ? JSON.parse(raw) : [];
                        const next = list.filter((t: any) => t.id !== template.id);
                        await AsyncStorage.setItem("savedTemplates", JSON.stringify(next));
                        router.back();
                    } catch (e) {
                        Alert.alert("Error", "Could not delete template.");
                    }
                },
            },
        ]);
    };

    const openHeaderMenu = () => {
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Cancel", "Edit Template", "Delete Template"],
                    cancelButtonIndex: 0,
                    destructiveButtonIndex: 2,
                    userInterfaceStyle: scheme === "dark" ? "dark" : "light",
                },
                (idx) => {
                    if (idx === 1) onEditTemplate();
                    if (idx === 2) onDeleteTemplate();
                }
            );
        } else {
            // Simple Android menu via Alert (no extra deps)
            Alert.alert(template.name, "Choose an action", [
                { text: "Edit Template", onPress: onEditTemplate },
                { text: "Delete Template", style: "destructive", onPress: onDeleteTemplate },
                { text: "Cancel", style: "cancel" },
            ]);
        }
    };

    // put the button in the header
    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Template Details",
            headerRight: () => (
                <TouchableOpacity
                    onPress={openHeaderMenu}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ paddingHorizontal: 10 }}
                >
                    <Ionicons
                        name="ellipsis-vertical"
                        size={20}
                        color={scheme === "dark" ? "#ddd" : "#333"}
                    />
                </TouchableOpacity>
            ),
        });
    }, [navigation, template?.name, scheme, template?.id]);

    // keep your existing loadTemplate, but memoize it
    const loadTemplate = useCallback(async () => {
        const stored = await AsyncStorage.getItem("savedTemplates");
        if (!stored) return;
        const parsed = JSON.parse(stored);
        const found = parsed.find((t: any) => t.id.toString() === templateId?.toString());
        if (found) setTemplate(found);
    }, [templateId]);

    // initial load (optional once)
    useEffect(() => { loadTemplate(); }, [loadTemplate]);

    // 🔁 refresh every time you come back from Edit
    useFocusEffect(useCallback(() => { loadTemplate(); }, [loadTemplate]));

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
                    disabled={true}
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
                    disabled={true}
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
