import { AntDesign } from "@expo/vector-icons";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, useColorScheme, View } from "react-native";

// ✅ new shared card
// If you don't use the "@/components" alias, change this import to a relative path like "../components/WorkoutSummaryCard"
import { useWorkoutStore } from "@/store/workoutStore";
import type { WorkoutSaved } from "@/types/workout";
import { formatHM, WorkoutSummaryCard } from "./WorkoutSummaryCard";

export default function CompletedWorkouts() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const scheme = useColorScheme();

  const history = useWorkoutStore((s) => s.history);
  const [workouts, setWorkouts] = useState<WorkoutSaved[]>([]);

  const backgroundColor = scheme === "dark" ? "#000000" : "#d1d1d1";
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
    const sorted = [...history].sort((a, b) => b.endedAt - a.endedAt);
    setWorkouts(sorted);
  }, [history]);

  useFocusEffect(useCallback(() => { loadWorkouts(); }, [loadWorkouts]));

  const formatShortDate = (ts: number) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "Unknown";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const computeCompletedMetrics = (w: WorkoutSaved) => {
    const exercises = w.items.filter((i) => i.type === "exercise") as any[];
    const totalExercises = exercises.length;
    const totalSets = exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
    const totalWorkingSets = totalSets;
    const duration = Math.max(0, Math.floor((w.endedAt - w.startedAt) / 1000));
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
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const m = computeCompletedMetrics(item);
            return (
              <WorkoutSummaryCard
                title={item.name}
                rightText={formatShortDate(item.endedAt)}
                items={[
                  { label: "Total Exercises", value: m.totalExercises },
                  { label: "Total       Sets", value: m.totalSets },
                  { label: "Working Sets", value: m.totalWorkingSets },
                  { label: "Total Duration", value: formatHM(m.duration) },
                ]}
                onPress={() => {
                  // Preserve your current behavior
                  (globalThis as any).tempExercises = item.items;
                  //router.push("/exercise-log");
                  router.push(`/exercise-log?workoutId=${item.id}`)
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
