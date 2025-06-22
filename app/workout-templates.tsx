import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import {
    FlatList,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from "react-native";

interface Template {
    id: number;
    name: string;
    exercises: any[];
    createdBy?: string;
    createdOn?: string;
    usageCount?: number;
}

export default function WorkoutTemplates() {
    const router = useRouter();
    const navigation = useNavigation();
    const { colors } = useTheme();
    const scheme = useColorScheme();


    const [templates, setTemplates] = useState<Template[]>([]);

    const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const cardColor = scheme === "dark" ? "#1a1a1a" : "#ffffff";

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Workout Templates",
            headerRight: () => (
                <TouchableOpacity onPress={() => router.push("/add-workout?mode=template")}>
                    <AntDesign name="plus" size={20} color={colors.text} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, colors]);

    const loadTemplates = useCallback(async () => {
        try {
            const storedTemplates = await AsyncStorage.getItem("savedTemplates");
            if (storedTemplates) {
                const parsed: Template[] = JSON.parse(storedTemplates);
                const sorted = parsed.sort((a, b) => b.id - a.id);
                setTemplates(sorted);
            } else {
                setTemplates([]);
            }
        } catch (error) {
            console.error("❌ Failed to load templates:", error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTemplates();
        }, [loadTemplates])
    );

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor }}>
            {/* Dev: Clear Templates Button */}
            {/* {templates.length > 0 && (
                <TouchableOpacity
                    onPress={async () => {
                        await AsyncStorage.removeItem("savedTemplates");
                        console.log("🧹 Cleared savedTemplates");
                        setTemplates([]);
                    }}
                    style={{
                        backgroundColor: "#ff4d4d",
                        padding: 10,
                        borderRadius: 8,
                        marginBottom: 20,
                        alignItems: "center",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold" }}>🧹 Clear Templates</Text>
                </TouchableOpacity>
            )} */}

            {templates.length === 0 ? (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ fontSize: 18, color: textColor }}>No templates saved yet</Text>
                </View>
            ) : (
                <FlatList
                    data={templates}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
                                router.push(`/template-detail?templateId=${item.id}`);
                            }}
                            style={{
                                backgroundColor: cardColor,
                                padding: 16,
                                borderRadius: 12,
                                marginBottom: 15,
                                elevation: 3,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 6,
                            }}
                        >
                            <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor }}>
                                {item.name}
                            </Text>

                            <View style={{ marginTop: 6 }}>
                                <Text style={{ color: "#888", fontSize: 14 }}>
                                    Exercise Count: {item.exercises.length}
                                </Text>

                                {(item.createdBy || item.createdOn) && (
                                    <Text style={{ color: "#888", fontSize: 14, marginTop: 2 }}>
                                        Created by {item.createdBy ?? "Unknown"} on{" "}
                                        {item.createdOn
                                            ? new Date(item.createdOn).toLocaleDateString("en-US", {
                                                month: "2-digit",
                                                day: "2-digit",
                                                year: "numeric"
                                            })
                                            : "Unknown Date"}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}
