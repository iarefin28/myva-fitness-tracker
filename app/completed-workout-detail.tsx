import { useWorkoutStore } from "@/store/workoutStore";
import { useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";

type RouteParams = { workoutId?: string };

export default function CompletedWorkoutDetailScreen() {
  const route = useRoute();
  const { workoutId } = (route.params ?? {}) as RouteParams;
  const history = useWorkoutStore((s) => s.history) || [];
  const workout = useMemo(() => history.find((w) => w.id === workoutId), [history, workoutId]);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = {
    bg: isDark ? "#0b0b0b" : "#ffffff",
    card: isDark ? "#111" : "#f8fafc",
    border: isDark ? "#262626" : "#e2e8f0",
    text: isDark ? "#e5e7eb" : "#0f172a",
    sub: isDark ? "#9ca3af" : "#475569",
  };

  if (!workout) {
    return (
      <View style={[styles.root, { backgroundColor: C.bg }]}>
        <Text style={[styles.title, { color: C.text }]}>Workout not found</Text>
        <Text style={[styles.sub, { color: C.sub }]}>This workout may have been removed.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <ScrollView>
          <Text style={[styles.json, { color: C.text }]}>
            {JSON.stringify(workout, null, 2)}
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  card: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 12 },
  json: { fontSize: 12 },
  title: { fontSize: 18, fontWeight: "800" },
  sub: { marginTop: 6, fontSize: 12 },
});
