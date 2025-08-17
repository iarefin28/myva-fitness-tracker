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

    // NEW (optional; keeps TS happy if present)
    metrics?: {
        totalExercises?: number;
        totalSets?: number;
        totalWorkingSets?: number;
        approxDurationInSeconds?: number;
    };
    approxDurationInSeconds?: number;
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
    const subTextColor = scheme === "dark" ? "#9aa0a6" : "#6b7280";
    const dividerColor = scheme === "dark" ? "#222" : "#eee";

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

    const formatHM = (s?: number | string) => {
        const total = Number(s || 0);
        const totalMinutes = Math.floor(total / 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h ? `${h}h ${m}m` : `${m}m`;
    };

    const computeCardMetrics = (t: Template) => {
        const totalExercises =
            t.metrics?.totalExercises ?? (Array.isArray(t.exercises) ? t.exercises.length : 0);

        const totalSets =
            t.metrics?.totalSets ??
            (t.exercises?.reduce((acc, ex) => {
                const sets = ex?.actions?.filter?.((a: any) => a?.type === "set")?.length || 0;
                return acc + sets;
            }, 0) ?? 0);

        const totalWorkingSets =
            t.metrics?.totalWorkingSets ??
            (t.exercises?.reduce((acc, ex) => {
                const working = ex?.actions?.filter?.(
                    (a: any) => a?.type === "set" && !a?.isWarmup
                )?.length || 0;
                return acc + working;
            }, 0) ?? 0);

        const approx =
            t.approxDurationInSeconds ??
            t.metrics?.approxDurationInSeconds ??
            (t.exercises?.reduce(
                (acc, ex) => acc + Number(ex?.computedDurationInSeconds || 0),
                0
            ) ?? 0);

        return { totalExercises, totalSets, totalWorkingSets, approx };
    };

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor }}>
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
                            {/* Header: Title (left) + Usage (right) */}
                            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                                <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor, flexShrink: 1 }}>
                                    {item.name}
                                </Text>
                                <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor, marginLeft: 8 }}>
                                    {Number(item.usageCount ?? 0) > 0 ? `Used ${Number(item.usageCount)}×` : "Not used"}
                                </Text>
                            </View>

                            {/* Divider directly under header */}
                            <View
                                style={{
                                    height: 1,
                                    backgroundColor: typeof dividerColor !== "undefined" ? dividerColor : (scheme === "dark" ? "#222" : "#eee"),
                                    marginTop: 8,
                                    marginBottom: 8,
                                    opacity: scheme === "dark" ? 0.7 : 1,
                                }}
                            />

                            {/* Stats: 1 row, 4 cells (label top, value bottom) */}
                            {(() => {
                                const m = computeCardMetrics(item);
                                const labelColor = typeof subTextColor !== "undefined" ? subTextColor : "#6b7280";
                                return (
                                    <View style={{ marginTop: 10, flexDirection: "row" }}>
                                        {/* Exercises */}
                                        <View style={{ flex: 1, paddingRight: 6 }}>
                                            <Text style={{ color: labelColor, fontSize: 12 }}>Total Exercises</Text>
                                            <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>
                                                {m.totalExercises}
                                            </Text>
                                        </View>

                                        {/* Sets */}
                                        <View style={{ flex: 1, paddingHorizontal: 3 }}>
                                            <Text style={{ color: labelColor, fontSize: 12 }}>Total        Sets</Text>
                                            <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>
                                                {m.totalSets}
                                            </Text>
                                        </View>

                                        {/* Working Sets */}
                                        <View style={{ flex: 1, paddingHorizontal: 3 }}>
                                            <Text style={{ color: labelColor, fontSize: 12 }}>Working Sets</Text>
                                            <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>
                                                {m.totalWorkingSets}
                                            </Text>
                                        </View>

                                        {/* Approx. Duration */}
                                        <View style={{ flex: 1, paddingLeft: 6 }}>
                                            <Text style={{ color: labelColor, fontSize: 12 }}>Approx. Duration</Text>
                                            <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>
                                                {formatHM(m.approx)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })()}
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}
