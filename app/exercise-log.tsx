// /screens/exercise-log.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { useNavigation, useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
    Alert,
    Platform,
    ScrollView,
    Share,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ExerciseCard from "../components/ExerciseCard";

const BRANDING_LINE = "This workout was created and completed by the MYVA Fitness App.";

const BRAND_SLOGAN_LINES = [
    "Move with purpose.",
    "Train with focus.",
    "MYVA Fitness.",
    "App coming soon…", // nice typographic ellipsis
];

type CompletedWorkout = {
    id: string | number;
    name?: string;
    templateId?: string | number;
    templateName?: string;
    createdBy?: string;
    startedAt?: string;   // ISO
    endedAt?: string;     // ISO
    completedAt?: string; // ISO
    elapsedSeconds?: number;
    notes?: string;
    metrics?: {
        totalExercises?: number;
        totalSets?: number;
        totalWorkingSets?: number;
        totalReps?: number;
        totalVolume?: number; // sum(weight*reps)
        approxDurationInSeconds?: number;
    };
    exercises?: any[];
};

export default function ExerciseLogScreen() {
    const route = useRoute<any>();
    const router = useRouter();
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const scheme = useColorScheme();

    const [log, setLog] = useState<CompletedWorkout | null>(null);
    const [loading, setLoading] = useState(true);

    const textColor = scheme === "dark" ? "#ffffff" : "#000000";
    const subTextColor = scheme === "dark" ? "#9aa0a6" : "#6b7280";
    const dividerColor = scheme === "dark" ? "#222" : "#eee";
    const cardColor = scheme === "dark" ? "#111" : "#ffffff";
    const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";

    const { workoutId, log: routeLog } = route.params || {};

    // ---------- header ----------
    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Workout Details",
            headerRight: () => (
                <TouchableOpacity
                    onPress={openHeaderMenu}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={{ paddingHorizontal: 10 }}
                >
                    <Ionicons name="ellipsis-vertical" size={20} color={scheme === "dark" ? "#ddd" : "#333"} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, scheme, log?.id]);

    // ---------- load ----------
    const loadLog = useCallback(async () => {
        try {
            // 1) direct object passed in navigation
            if (routeLog) {
                setLog(routeLog as CompletedWorkout);
                return;
            }

            // 2) lookup by id in AsyncStorage
            if (workoutId != null) {
                const stored = await AsyncStorage.getItem("savedWorkouts");
                const list: CompletedWorkout[] = stored ? JSON.parse(stored) : [];
                const found = list.find((w) => String(w.id) === String(workoutId));
                if (found) {
                    setLog(found);
                    return;
                }
            }

            // 3) ultra-fallback: dev temp
            const exercises = (globalThis as any).tempExercises || [];
            setLog({
                id: "temp",
                name: "Workout Breakdown",
                exercises,
                startedAt: new Date().toISOString(),
                endedAt: new Date().toISOString(),
                elapsedSeconds: exercises?.reduce(
                    (acc: number, ex: any) => acc + Number(ex?.computedDurationInSeconds || 0),
                    0
                ),
            });
        } finally {
            setLoading(false);
        }
    }, [routeLog, workoutId]);

    useEffect(() => {
        loadLog();
    }, [loadLog]);

    // ---------- helpers ----------
    type FormatOpts = {
        includeWarmups?: boolean;
        includeRest?: boolean;
        includeNotes?: boolean;
        includeTags?: boolean;
    };

    const formatHM = (s?: number | string) => {
        const total = Number(s || 0);
        const totalMinutes = Math.floor(total / 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h ? `${h}h ${m}m` : `${m}m`;
    };

    const formatDateTime = (iso?: string) => {
        if (!iso) return "—";
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };
    const isRestAction = (a: any) => a?.type === "rest";

    const getRestDurFromAction = (a: any) =>
        toNum(a?.restInSeconds ?? a?.restSeconds ?? a?.durationSeconds ?? a?.value ?? a?.rest);

    const toNum = (v: any): number => {
        const n = typeof v === "string" ? v.trim() : v;
        const parsed = Number(n);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const numberFmt = (n: number) => new Intl.NumberFormat().format(n);

    const safeJoin = (arr: (string | undefined | null)[], sep = ", ") =>
        arr.filter(Boolean).join(sep);

    const pickWeight = (s: any) => {
        if (s?.weight != null) return { val: toNum(s.weight), unit: s.weightUnit || s.unit || "lb" };
        if (s?.weightLbs != null) return { val: toNum(s.weightLbs), unit: "lb" };
        if (s?.weightKg != null) return { val: toNum(s.weightKg), unit: "kg" };
        return { val: undefined as number | undefined, unit: s?.weightUnit || s?.unit || "lb" };
    };

    type Normalized = {
        warmups: any[];
        workings: any[];
        rests: { durationSeconds?: number }[];
        notes: { text?: string }[];
    };

    const normalizeExercise = (ex: any): Normalized => {
        const actions = Array.isArray(ex?.actions) ? ex.actions : [];

        let warmups = actions.filter((a: any) => a?.type === "set" && !!a?.isWarmup);
        let workings = actions.filter((a: any) => a?.type === "set" && !a?.isWarmup);

        // ⬇️ Map your rest shape: { type: "rest", restInSeconds: "120", value: "200", ... }
        let rests = actions
            .filter((a: any) => a?.type === "rest")
            .map((r: any) => ({
                durationSeconds: toNum(r?.restInSeconds ?? r?.restSeconds ?? r?.durationSeconds ?? r?.value),
            }))
            .filter((r: any) => r.durationSeconds > 0);

        let notes = actions.filter((a: any) => a?.type === "note");

        // Fallbacks if not using `actions` (optional; keep if you had it)
        if (!actions.length) {
            const sets = Array.isArray(ex?.sets) ? ex.sets : [];
            const wus = Array.isArray(ex?.warmups) ? ex.warmups : [];
            const wss = Array.isArray(ex?.workingSets) ? ex.workingSets : [];
            const merged = [
                ...wus.map((s: any) => ({ ...s, isWarmup: true })),
                ...wss.map((s: any) => ({ ...s, isWarmup: false })),
                ...sets,
            ];
            const hasFlags = merged.some((s: any) => s?.isWarmup === true || s?.isWarmup === false);
            warmups = hasFlags ? merged.filter((s: any) => s?.isWarmup) : [];
            workings = hasFlags ? merged.filter((s: any) => !s?.isWarmup) : merged;

            if (!rests.length) {
                const per = toNum(ex?.restBetweenSetsSeconds ?? ex?.defaultRestSeconds);
                if (per > 0) {
                    const count = Math.max(merged.length - 1, 0);
                    rests = Array.from({ length: count }, () => ({ durationSeconds: per }));
                }
            }

            if (!notes.length && ex?.notes) notes = [{ text: String(ex.notes) }];
        }

        return { warmups, workings, rests, notes };
    };

    const setKind = (s: any) => (s?.isWarmup ? "WU" : "WS");

    const getReps = (s: any): number => {
        // Support multiple shapes: reps, rep, count
        if (s?.reps != null) return toNum(s.reps);
        if (s?.rep != null) return toNum(s.rep);
        if (s?.count != null) return toNum(s.count);
        return 0;
    };

    const formatSetLine = (s: any, idx: number, opts: FormatOpts) => {
        const ordinal = toNum(s?.setNumber) > 0 ? toNum(s.setNumber) : (toNum(s?.index) || idx + 1);
        const { val, unit } = pickWeight(s);

        const reps = getReps(s);
        const rpe = toNum(s?.rpe ?? s?.RPE);
        const time = toNum(s?.durationSeconds ?? s?.timeSeconds ?? s?.time ?? s?.seconds);
        const rest = toNum(s?.restSeconds ?? s?.restInSeconds ?? s?.rest);

        const parts: string[] = [];
        parts.push(`${setKind(s)} ${ordinal}:`);

        const hasWeight = Number.isFinite(val as number);
        const hasReps = Number.isFinite(reps) && reps > 0;
        const hasTime = Number.isFinite(time) && time > 0;

        if (hasWeight && hasReps) {
            parts.push(`${val} ${unit} x ${reps}`);
        } else if (hasReps) {
            parts.push(`${reps} reps`);
        } else if (hasTime) {
            parts.push(`${Math.round(time)}s`);
        } else {
            // Fallback: show weight even if reps missing (optional)
            if (hasWeight) parts.push(`${val} ${unit}`);
        }

        if (rpe || s?.RPE === 0) {
            // print @0 only if you want to see zero RPEs:
            // if (rpe || s?.RPE === 0) parts.push(`@${rpe}`);
            if (rpe) parts.push(`@${rpe}`);
        }

        if (opts.includeRest && rest) parts.push(`(rest ${Math.round(rest)}s)`);
        if (typeof s?.note === "string" && s.note.trim()) parts.push(`— ${s.note.trim()}`);

        return "  • " + parts.join(" ");
    };

    const formatTags = (tags: any) => {
        if (!tags) return "";
        if (Array.isArray(tags)) return tags.join(", ");
        if (typeof tags === "object") {
            // object record -> "key: value"
            const kv = Object.entries(tags).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join("/") : String(v)}`);
            return kv.join(", ");
        }
        return String(tags);
    };

    const sumVolume = (exercises: any[]) =>
        exercises?.reduce((acc: number, ex: any) => {
            const { workings } = normalizeExercise(ex);
            const vol = workings.reduce((sv: number, s: any) => {
                const { val } = pickWeight(s);
                const r = toNum(s?.reps);
                return sv + (typeof val === "number" && Number.isFinite(val) ? val * r : 0);
            }, 0);
            return acc + vol;
        }, 0) || 0;

    const sumReps = (exercises: any[]) =>
        exercises?.reduce((acc: number, ex: any) => {
            const { workings } = normalizeExercise(ex);
            return acc + workings.reduce((sr: number, s: any) => sr + toNum(s?.reps), 0);
        }, 0) || 0;

    const formatExerciseSection = (ex: any, idx: number, opts: FormatOpts) => {
        const title = ex?.name || ex?.title || `Exercise ${idx + 1}`;
        const tags = formatTags(ex?.tags);

        // Use normalizer for totals/volume
        const { warmups, workings } = normalizeExercise(ex);
        const exVol = workings.reduce((sv: number, s: any) => {
            const { val } = pickWeight(s);
            const r = toNum(s?.reps);
            return sv + (Number.isFinite(val as number) ? (val as number) * r : 0);
        }, 0);

        const headerBits = [
            `${idx + 1}) ${title}`,
            workings.length ? `${workings.length} WS` : undefined,
            warmups.length && opts.includeWarmups ? `${warmups.length} WU` : undefined,
            exVol ? `Vol ${new Intl.NumberFormat().format(exVol)}` : undefined,
        ].filter(Boolean);

        const lines: string[] = [headerBits.join(" — ")];
        if (opts.includeTags && tags) lines.push(`   tags: ${tags}`);

        // 🔑 Render in original order so we can attach rest AFTER its set
        const actions = Array.isArray(ex?.actions) ? ex.actions : [];
        let wuIdx = 0;
        let wsIdx = 0;

        for (let i = 0; i < actions.length; i++) {
            const a = actions[i];

            if (a?.type === "set") {
                const isWU = !!a?.isWarmup;
                // respect includeWarmups toggle
                if (isWU && !opts.includeWarmups) continue;

                const localIdx = isWU ? wuIdx++ : wsIdx++;
                // Don’t print rest inside the set line; we’ll append it after
                let line = formatSetLine(a, localIdx, { ...opts, includeRest: false });

                if (opts.includeRest) {
                    // sum consecutive rest actions immediately following this set
                    let j = i + 1;
                    let restTotal = 0;
                    while (j < actions.length && isRestAction(actions[j])) {
                        restTotal += getRestDurFromAction(actions[j]);
                        j++;
                    }

                    // Support per-set embedded rest too (if present)
                    restTotal += toNum(a?.restSeconds ?? a?.restInSeconds ?? 0);

                    if (restTotal > 0) {
                        line += ` → ${formatHM(restTotal)} rest`;
                    }
                }

                lines.push(line);
            }

            // We don’t render standalone "rest:" summary lines anymore,
            // since rest is now attached directly after each set.
        }

        // Optional notes: if you also keep ex.notes or note actions, append here if you want
        if (opts.includeNotes && typeof ex?.notes === "string" && ex.notes.trim()) {
            lines.push(`   notes: ${ex.notes.trim()}`);
        }

        return lines.join("\n");
    };

    const formatWorkoutShare = (log: any, opts: FormatOpts = {}) => {
        const exercises = Array.isArray(log?.exercises) ? log.exercises : [];
        const completedTime = log?.completedAt || log?.endedAt || log?.startedAt;
        const totalVolume = sumVolume(exercises);
        const totalReps = sumReps(exercises);

        // If metrics already computed, prefer them
        const m = log?.metrics || {};
        const stats = {
            totalExercises: m.totalExercises ?? exercises.length,
            totalSets:
                m.totalSets ??
                exercises.reduce(
                    (acc: number, ex: any) => acc + (ex?.actions?.filter?.((a: any) => a?.type === "set")?.length || 0),
                    0
                ),
            totalWorkingSets:
                m.totalWorkingSets ??
                exercises.reduce(
                    (acc: number, ex: any) =>
                        acc + (ex?.actions?.filter?.((a: any) => a?.type === "set" && !a?.isWarmup)?.length || 0),
                    0
                ),
            totalReps: m.totalReps ?? totalReps,
            totalVolume: m.totalVolume ?? totalVolume,
            approx: log?.elapsedSeconds ?? m.approxDurationInSeconds ??
                exercises.reduce((acc: number, ex: any) => acc + Number(ex?.computedDurationInSeconds || 0), 0),
        };

        const header =
            `${log?.name ?? "Workout"}\n` +
            `Completed: ${formatDateTime(completedTime)}\n` +
            `Template: ${log?.templateName ?? log?.templateId ?? "—"}\n` +
            `Created By: ${log?.createdBy ?? "—"}\n` +
            (typeof log?.notes === "string" && log.notes.length ? `Notes: ${log.notes}\n` : "") +
            `\n` +
            `Exercises: ${stats.totalExercises}\n` +
            `Sets: ${stats.totalSets} (Working: ${stats.totalWorkingSets})\n` +
            `Reps: ${numberFmt(stats.totalReps)}\n` +
            `Volume: ${numberFmt(stats.totalVolume)}\n` +
            `Duration: ${formatHM(stats.approx)}\n`;

        const body = exercises
            .map((ex: any, i: number) =>
                formatExerciseSection(
                    ex,
                    i,
                    {
                        includeWarmups: opts.includeWarmups ?? true,
                        includeRest: opts.includeRest ?? true,
                        includeNotes: opts.includeNotes ?? true,
                        includeTags: opts.includeTags ?? true,
                    }
                )
            )
            .join("\n\n");

        const footer = [
            "",
            BRANDING_LINE,
            "",
            ...BRAND_SLOGAN_LINES, // each on its own line
        ].join("\n");

        return `${header}\n${body}\n${footer}`;
    };

    const metrics = useMemo(() => {
        if (!log) {
            return {
                totalExercises: 0,
                totalSets: 0,
                totalWorkingSets: 0,
                totalReps: 0,
                totalVolume: 0,
                approx: 0,
            };
        }

        const m = log.metrics || {};
        const exercises = Array.isArray(log.exercises) ? log.exercises : [];

        const totalExercises =
            m.totalExercises ?? (Array.isArray(exercises) ? exercises.length : 0);

        const totalSets =
            m.totalSets ??
            exercises?.reduce((acc: number, ex: any) => {
                const { warmups, workings } = normalizeExercise(ex);
                return acc + warmups.length + workings.length;
            }, 0) ?? 0;

        const totalWorkingSets =
            m.totalWorkingSets ??
            exercises?.reduce((acc: number, ex: any) => {
                const { workings } = normalizeExercise(ex);
                return acc + workings.length;
            }, 0) ?? 0;

        const totalRepsCalc = m.totalReps ?? sumReps(exercises);
        const totalVolumeCalc = m.totalVolume ?? sumVolume(exercises);

        const approx =
            log.elapsedSeconds ??
            m.approxDurationInSeconds ??
            exercises?.reduce(
                (acc: number, ex: any) => acc + Number(ex?.computedDurationInSeconds || 0),
                0
            ) ??
            0;

        return {
            totalExercises,
            totalSets,
            totalWorkingSets,
            totalReps: totalRepsCalc,
            totalVolume: totalVolumeCalc,
            approx,
        };
    }, [log]);

    const completedTime =
        log?.completedAt || log?.endedAt || log?.startedAt;

    // small stat & meta row components (mirrors template-detail look)
    const Stat = ({
        label,
        value,
        icon,
    }: {
        label: string;
        value: string | number;
        icon?: any;
    }) => (
        <View style={{ width: "48%", marginBottom: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2 }}>
                {icon ? (
                    <Ionicons name={icon} size={14} color={subTextColor} style={{ marginRight: 6 }} />
                ) : null}
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

    // ---------- actions ----------
    const openHeaderMenu = () => {
        const opts = ["Cancel", "Share Summary", "Share Full Details", "Export JSON", "Delete Log"] as const;
        const cancelIdx = 0;
        const shareIdx = 1;
        const shareFullIdx = 2;
        const exportIdx = 3;
        const deleteIdx = 4;

        const shareFullDetails = async () => {
            if (!log) return;
            try {
                const payload = formatWorkoutShare(log, {
                    includeWarmups: true,
                    includeRest: true,
                    includeNotes: true,
                    includeTags: true,
                });
                await Share.share({ message: payload });
            } catch {
                Alert.alert("Error", "Could not share full details.");
            }
        };

        if (Platform.OS === "ios") {
            // @ts-ignore - ActionSheetIOS typed under RN
            const ActionSheetIOS = require("react-native").ActionSheetIOS;
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: opts as unknown as string[],
                    cancelButtonIndex: cancelIdx,
                    destructiveButtonIndex: deleteIdx,
                    userInterfaceStyle: scheme === "dark" ? "dark" : "light",
                },
                async (idx: number) => {
                    if (idx === shareIdx) await shareSummary();
                    if (idx === shareFullIdx) await shareFullDetails();
                    if (idx === exportIdx) await exportJson();
                    if (idx === deleteIdx) await deleteLog();

                }
            );
        } else {
            Alert.alert(log?.name || "Workout", "Choose an action", [
                { text: "Share Summary", onPress: shareSummary },
                { text: "Share Full Details", onPress: shareFullDetails },
                { text: "Export JSON", onPress: exportJson },
                { text: "Delete Log", style: "destructive", onPress: deleteLog },
                { text: "Cancel", style: "cancel" },
            ]);
        }
    };

    const shareSummary = async () => {
        if (!log) return;
        const summary =
            `🏋️ ${log.name ?? "Workout"}\n` +
            `Completed: ${formatDateTime(completedTime)}\n` +
            `Exercises: ${metrics.totalExercises}, Sets: ${metrics.totalSets}, Working Sets: ${metrics.totalWorkingSets}\n` +
            `Reps: ${metrics.totalReps}, Volume: ${numberFmt(metrics.totalVolume)}\n` +
            `Duration: ${formatHM(metrics.approx)}`;
        try {
            await Share.share({ message: summary });
        } catch {
            Alert.alert("Error", "Could not share summary.");
        }
    };

    const exportJson = async () => {
        if (!log) return;
        try {
            await Share.share({ message: JSON.stringify(log, null, 2) });
        } catch {
            Alert.alert("Error", "Could not export JSON.");
        }
    };

    const deleteLog = async () => {
        if (!log || log.id == null) return;
        Alert.alert("Delete workout", "This cannot be undone. Delete?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        const raw = await AsyncStorage.getItem("completedWorkouts");
                        const list = raw ? JSON.parse(raw) : [];
                        const next = list.filter((w: CompletedWorkout) => String(w.id) !== String(log.id));
                        await AsyncStorage.setItem("completedWorkouts", JSON.stringify(next));
                        router.back();
                    } catch {
                        Alert.alert("Error", "Could not delete workout.");
                    }
                },
            },
        ]);
    };

    const repeatWorkout = () => {
        if (log?.templateId != null) {
            router.push(`/add-workout?mode=live&templateId=${log.templateId}`);
        } else {
            // fallback: start from this log's exercises
            (globalThis as any).startWorkoutFromLog = log;
            router.push(`/add-workout?mode=live&fromLog=1`);
        }
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: textColor, fontSize: 16 }}>Loading…</Text>
            </View>
        );
    }

    if (!log) {
        return (
            <View style={{ flex: 1, backgroundColor, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: textColor, fontSize: 18 }}>Workout not found.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor }}>
            {/* Title */}
            <View style={{ paddingLeft: 15, paddingRight: 15, paddingTop: 15, paddingBottom: 2}}>
                <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor }}>
                    {log.name ?? "Workout Breakdown"}
                </Text>
            </View>

            {/* Completed On row */}
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingBottom: 15,
                    paddingHorizontal: 12,
                }}
                accessibilityRole="text"
                accessibilityLabel={`Completed On ${formatDateTime(completedTime)}`}
                testID="completed-on-row"
            >
                <Ionicons name="calendar-outline" size={18} color={subTextColor} />
                {/* <Text style={{ color: subTextColor, fontSize: 12, marginLeft: 8 }}>
                    Completed On
                </Text> */}
                <Text style={{ color: textColor, fontSize: 14, fontWeight: "700", marginLeft: 6 }}>
                    {formatDateTime(completedTime)}
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
                    {/* Title + share icon */}
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                        }}
                    >
                        <Text style={{ color: textColor, fontWeight: "700", fontSize: 16 }}>Overview</Text>

                        <TouchableOpacity
                            onPress={shareSummary}
                            accessibilityLabel="Share workout"
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ padding: 4 }}
                        >
                            <Ionicons name="share-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* stats grid */}
                    <View style={{ flexDirection: "row", justifyContent: "space-between", flexWrap: "wrap" }}>
                        <Stat label="Exercises" value={metrics.totalExercises} icon="barbell-outline" />
                        <Stat label="Sets" value={metrics.totalSets} icon="albums-outline" />
                        <Stat label="Working Sets" value={metrics.totalWorkingSets} icon="fitness-outline" />
                        <Stat label="Reps" value={metrics.totalReps} icon="ellipsis-horizontal-outline" />
                        <Stat
                            label="Volume"
                            value={numberFmt(metrics.totalVolume)}
                            icon="stats-chart-outline"
                        />
                        <Stat
                            label="Duration"
                            value={formatHM(metrics.approx)}
                            icon="time-outline"
                        />
                    </View>

                    {/* divider */}
                    <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 8 }} />

                    {/* meta rows */}
                    <MetaRow label="Completed On" value={formatDateTime(completedTime)} />
                    <MetaRow label="Template" value={log.templateName ?? (log.templateId ?? "—")} />
                    <MetaRow label="Created By" value={log.createdBy ?? "—"} />
                    {typeof log?.notes === "string" && log.notes.length > 0 ? (
                        <MetaRow label="Notes" value="Attached" />
                    ) : null}
                </View>
                {/* ===== end Overview card ===== */}

                {/* Exercise List heading */}
                <Text style={{ color: textColor, fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
                    Exercise List
                </Text>

                {/* Exercise List */}
                {(log.exercises || []).map((exercise: any, index: number) => (
                    <ExerciseCard
                        key={index}
                        exercise={exercise}
                        defaultExpanded
                        disableToggle
                        showNotesButton={true}
                    />
                ))}
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
                <TouchableOpacity
                    onPress={repeatWorkout}
                    style={{
                        backgroundColor: "#1e90ff",
                        paddingVertical: 14,
                        alignItems: "center",
                        borderRadius: 10,
                        width: "48%",
                    }}
                >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 15 }}>
                        Repeat Workout
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={shareSummary}
                    style={{
                        backgroundColor: scheme === "dark" ? "#333" : "#ddd",
                        paddingVertical: 14,
                        alignItems: "center",
                        borderRadius: 10,
                        width: "48%",
                    }}
                >
                    <Text style={{ color: textColor, fontWeight: "bold", fontSize: 15 }}>
                        Share Summary
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
