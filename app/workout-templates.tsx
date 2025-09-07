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
import { WorkoutSummaryCard } from "../components/WorkoutSummaryCard";

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
            console.error("Failed to load templates:", error);
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
                    renderItem={({ item }) => {
                        const m = computeCardMetrics(item);
                        const rightText =
                            Number(item.usageCount ?? 0) > 0 ? `Used ${Number(item.usageCount)}×` : "Not used";

                        return (
                            <WorkoutSummaryCard
                                title={item.name}
                                rightText={rightText}
                                items={[
                                    { label: "Total Exercises", value: m.totalExercises },
                                    { label: "Total       Sets", value: m.totalSets },
                                    { label: "Working Sets", value: m.totalWorkingSets },
                                    { label: "Approx. Duration", value: formatHM(m.approx) },
                                ]}
                                onPress={() => router.push(`/template-detail?templateId=${item.id}`)}
                                testID={`template-card-${item.id}`}
                            />
                        );
                    }}
                />
            )}
        </View>
    );
}
