import { useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { useExerciseLibrary } from "@/store/exerciseLibrary";

type RouteParams = { exerciseId?: string };

export default function ExerciseDetailScreen() {
  const route = useRoute();
  const { exerciseId } = (route.params ?? {}) as RouteParams;
  const exerciseMap = useExerciseLibrary((s) => s.exercises);

  const exercise = useMemo(() => {
    if (!exerciseId) return null;
    return exerciseMap[exerciseId] || null;
  }, [exerciseId, exerciseMap]);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const C = {
    bg: isDark ? "#000" : "#fff",
    card: isDark ? "#111" : "#f5f5f5",
    border: isDark ? "#242424" : "#e5e7eb",
    text: isDark ? "#fff" : "#0b0b0b",
    sub: isDark ? "#9ca3af" : "#4b5563",
  };

  if (!exercise) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
        <Text style={[styles.title, { color: C.text }]}>Exercise not found</Text>
        <Text style={[styles.sub, { color: C.sub }]}>
          This exercise may have been removed or cleared from local storage.
        </Text>
      </SafeAreaView>
    );
  }

  const createdOn = exercise.createdAt
    ? new Date(exercise.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";
  const lastUsed = exercise.lastUsedAt
    ? new Date(exercise.lastUsedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not yet";

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.label, { color: C.sub }]}>Name</Text>
        <Text style={[styles.value, { color: C.text }]}>{exercise.name}</Text>

        <View style={styles.divider} />

        <Text style={[styles.label, { color: C.sub }]}>Type</Text>
        <Text style={[styles.value, { color: C.text }]}>{exercise.type}</Text>

        <View style={styles.divider} />

        <Text style={[styles.label, { color: C.sub }]}>Usage</Text>
        <Text style={[styles.value, { color: C.text }]}>
          {exercise.usageCount ?? 0} logged
        </Text>
        <Text style={[styles.meta, { color: C.sub }]}>Last used {lastUsed}</Text>

        <View style={styles.divider} />

        <Text style={[styles.label, { color: C.sub }]}>Created By</Text>
        <Text style={[styles.value, { color: C.text }]}>
          {exercise.createdBy || "MYVA"}
        </Text>
        <Text style={[styles.meta, { color: C.sub }]}>Created on {createdOn}</Text>
      </View>

      <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.label, { color: C.sub }]}>Description</Text>
        <Text style={[styles.value, { color: C.text }]}>
          {exercise.howTo?.trim() || "No description added yet."}
        </Text>
      </View>

      <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
        <Text style={[styles.label, { color: C.sub }]}>Exercise ID</Text>
        <Text style={[styles.mono, { color: C.sub }]}>{exercise.id}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 6 },
  sub: { fontSize: 14 },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.4 },
  value: { fontSize: 16, fontWeight: "700", marginTop: 4 },
  divider: { height: 1, marginVertical: 12, backgroundColor: "#2a2a2a" },
  meta: { marginTop: 6, fontSize: 12 },
  mono: { fontSize: 12 },
  panel: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
});
