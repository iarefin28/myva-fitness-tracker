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

import SectionCard from "@/components/SectionCard";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo } from "react";
import { ActionSheetIOS, Alert, Platform } from "react-native";

export default function TemplateDetail() {
    const route = useRoute();
    const { templateId } = route.params || {};
    const router = useRouter();
    const scheme = useColorScheme();
    const insets = useSafeAreaInsets();

    const [template, setTemplate] = useState<any>(null);

    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const subTextColor = scheme === "dark" ? "#9aa0a6" : "#6b7280";
    const dividerColor = scheme === "dark" ? "#222" : "#eee";
    //const cardColor = scheme === "dark" ? "#111" : "#ffffff";
    const cardColor = scheme === "dark" ? "#1e1e1e" : "#d1d1d1";
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

    // ---------- helpers ----------
    const formatHM = (s?: number | string) => {
        const total = Number(s || 0);
        const totalMinutes = Math.floor(total / 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h ? `${h}h ${m}m` : `${m}m`;
    };

    const formatDateOnly = (iso?: string) => {
        if (!iso) return "—";
        const d = new Date(iso);
        // e.g., "Aug 16, 2025"
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    };

    const metrics = useMemo(() => {
        if (!template) return { totalExercises: 0, totalSets: 0, totalWorkingSets: 0, approx: 0 };
        const m = template.metrics || {};
        const totalExercises =
            m.totalExercises ??
            (Array.isArray(template.exercises) ? template.exercises.length : 0);

        const totalSets =
            m.totalSets ??
            template.exercises?.reduce((acc: number, ex: any) => {
                const sets = ex?.actions?.filter?.((a: any) => a?.type === "set")?.length || 0;
                return acc + sets;
            }, 0) ??
            0;

        const totalWorkingSets =
            m.totalWorkingSets ??
            template.exercises?.reduce((acc: number, ex: any) => {
                const working = ex?.actions?.filter?.(
                    (a: any) => a?.type === "set" && !a?.isWarmup
                )?.length || 0;
                return acc + working;
            }, 0) ??
            0;

        const approx =
            template.approxDurationInSeconds ??
            m.approxDurationInSeconds ??
            template.exercises?.reduce(
                (acc: number, ex: any) => acc + Number(ex?.computedDurationInSeconds || 0),
                0
            ) ??
            0;

        return { totalExercises, totalSets, totalWorkingSets, approx };
    }, [template]);

    // small stat & meta row components
    const Stat = ({ label, value, icon }: { label: string; value: string | number; icon?: any }) => (
        <View style={{ width: "48%", marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                {icon ? <Ionicons name={icon} size={14} color={subTextColor} style={{ marginRight: 6 }} /> : null}
                <Text style={{ color: subTextColor, fontSize: 12 }}>{label}</Text>
            </View>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: "700" }}>{value}</Text>
        </View>
    );

    const MetaRow = ({ label, value }: { label: string; value: string | number }) => (
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={{ color: subTextColor, fontSize: 12 }}>{label}</Text>
            <Text style={{ color: textColor, fontSize: 13, fontWeight: "600" }}>{value}</Text>
        </View>
    );

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

            {/* Scrollable content */}
            <ScrollView
                style={{ flex: 1, paddingHorizontal: 20 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
            >
                {/* ===== Overview card ===== */}
                <View
                    style={{
                        backgroundColor: cardColor,
                        borderRadius: 12,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: dividerColor,
                        marginBottom: 16,
                    }}
                >
                    {/* Title + white share button */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                        }}
                    >
                        <Text style={{ color: textColor, fontWeight: "700", fontSize: 16 }}>
                            Overview
                        </Text>

                        <TouchableOpacity
                            onPress={() => { }}
                            accessibilityLabel="Share template"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ padding: 4 }} // small tap padding, no background
                        >
                            <Ionicons name="share-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* stats grid: two rows, two columns */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <Stat label="Exercises" value={metrics.totalExercises} icon="barbell-outline" />
                        <Stat label="Sets" value={metrics.totalSets} icon="albums-outline" />
                        <Stat label="Working Sets" value={metrics.totalWorkingSets} icon="fitness-outline" />
                        <Stat
                            label="Approx. Duration"
                            value={formatHM(metrics.approx)}  // e.g., "38m" or "1h 12m"
                            icon="time-outline"
                        />
                    </View>

                    {/* divider */}
                    <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 8 }} />

                    {/* meta rows */}
                    <MetaRow label="Created By" value={template.createdBy ?? "—"} />
                    <MetaRow label="Created On" value={formatDateOnly(template.createdOn)} />
                    <MetaRow label="Last Updated" value={formatDateOnly(template.updatedOn)} />
                    <MetaRow label="Usage Count" value={String(template.usageCount ?? 0)} />
                </View>
                {/* ===== end Overview card ===== */}

                <SectionCard
                    colors={{ cardColor, dividerColor }}   // reuse your theme tokens
                    style={{ marginBottom: 16 }}
                >
                    {/* Section header */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                        <Ionicons name="barbell-outline" size={18} color={subTextColor} />
                        <Text style={{ color: textColor, fontWeight: "700", fontSize: 16, marginLeft: 6 }}>
                            Exercise List
                        </Text>
                    </View>

                    {/* Divider (optional) */}
                    <View style={{ height: 1, backgroundColor: dividerColor, marginBottom: 8 }} />

                    {/* Your list */}
                    {/* If you map items: */}
                    <View style={{ gap: 8 }}>
                        {template.exercises.map((exercise: any, index: number) => (
                            <ExerciseCard
                                key={index}
                                exercise={exercise}
                                defaultExpanded
                                disableToggle
                                showNotesButton={false}
                            />
                        ))}
                    </View>
                </SectionCard>
            </ScrollView>

            {/* Bottom Actions */}
            <View
                style={{
                    paddingHorizontal: 16,
                    paddingTop: 12,
                    paddingBottom: insets.bottom + 12,
                    borderTopWidth: 1,
                    borderTopColor: dividerColor,
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
                    disabled={true}
                    onPress={handleSchedule}
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
        </View>
    );
}