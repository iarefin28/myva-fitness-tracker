import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, useColorScheme, View } from "react-native";

// ✅ new shared card
// If you don't use the "@/components" alias, change this import to a relative path like "../components/WorkoutSummaryCard"
import { formatHM, WorkoutSummaryCard } from "../components/WorkoutSummaryCard";

interface Workout {
  id: number;
  name: string;
  exercises: any[];
  notes?: string;
  date: string;

  // Optional extras if present in your data (we'll gracefully fall back if missing)
  metrics?: { totalExercises?: number; totalSets?: number; totalWorkingSets?: number; approxDurationInSeconds?: number };
  elapsedSeconds?: number;
  approxDurationInSeconds?: number;
}

export default function CompletedWorkouts() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const scheme = useColorScheme();

  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
  const textColor = scheme === "dark" ? "#ffffff" : "#000000";
  const cardColor = scheme === "dark" ? "#1a1a1a" : "#ffffff";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/add-workout")} accessible accessibilityLabel="Add workout">
          <AntDesign name="plus" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const loadWorkouts = useCallback(async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem("savedWorkouts");
      if (storedWorkouts) {
        const parsedWorkouts: Workout[] = JSON.parse(storedWorkouts);
        const sorted = parsedWorkouts.sort((a, b) => b.id - a.id);
        setWorkouts(sorted);
      } else {
        setWorkouts([]);
      }
    } catch (error) {
      console.error("Failed to load workouts:", error);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadWorkouts(); }, [loadWorkouts]));

  const formatShortDate = (isoDate: string) => {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const notePreview = (notes?: string) => {
    const s = (notes ?? "").trim();
    if (!s) return undefined;
    return s.length > 80 ? `“${s.slice(0, 77)}…”` : `“${s}”`;
  };

  const computeCompletedMetrics = (w: Workout) => {
    // totals
    const totalExercises =
      w.metrics?.totalExercises ?? (Array.isArray(w.exercises) ? w.exercises.length : 0);

    const totalSets =
      w.metrics?.totalSets ??
      (w.exercises?.reduce((acc, ex) => {
        const sets = ex?.actions?.filter?.((a: any) => a?.type === "set")?.length || 0;
        return acc + sets;
      }, 0) ?? 0);

    const totalWorkingSets =
      w.metrics?.totalWorkingSets ??
      (w.exercises?.reduce((acc, ex) => {
        const working = ex?.actions?.filter?.((a: any) => a?.type === "set" && !a?.isWarmup)?.length || 0;
        return acc + working;
      }, 0) ?? 0);

    // duration: prefer the real elapsed time, fall back to computed/approx if present
    const sumComputed = w.exercises?.reduce((t, ex) => {
      const v = Number(ex?.computedDurationInSeconds || 0);
      return t + (isFinite(v) ? v : 0);
    }, 0) ?? 0;

    const duration =
      (isFinite(Number(w.elapsedSeconds)) && Number(w.elapsedSeconds) > 0 && Number(w.elapsedSeconds)) ||
      (isFinite(Number(w.metrics?.approxDurationInSeconds)) && Number(w.metrics?.approxDurationInSeconds)) ||
      (isFinite(Number(w.approxDurationInSeconds)) && Number(w.approxDurationInSeconds)) ||
      (sumComputed > 0 && sumComputed) ||
      0;

    return { totalExercises, totalSets, totalWorkingSets, duration };
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor }}>
      {workouts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: textColor }}>No workouts available</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const m = computeCompletedMetrics(item);
            return (
              <WorkoutSummaryCard
                title={item.name}
                rightText={formatShortDate(item.date)}
                items={[
                  { label: "Total Exercises", value: m.totalExercises },
                  { label: "Total       Sets", value: m.totalSets },
                  { label: "Working Sets", value: m.totalWorkingSets },
                  { label: "Total Duration", value: formatHM(m.duration) },
                ]}
                onPress={() => {
                  // Preserve your current behavior
                  (globalThis as any).tempExercises = item.exercises;
                  router.push("/exercise-log");
                }}
                testID={`completed-card-${item.id}`}
                // optional: onLongPress={() => router.push(`/completed-detail?id=${item.id}`)}
              />
            );
          }}
          contentContainerStyle={{ paddingBottom: 12 }}
        />
      )}
    </View>
  );
}
