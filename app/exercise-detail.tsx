import { useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { useExerciseLibrary } from "@/store/exerciseLibrary";
import { typography } from "@/theme/typography";

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
    bg: isDark ? "#0B0B0C" : "#F7F7FA",
    card: isDark ? "#141416" : "#FFFFFF",
    cardAlt: isDark ? "#0F1115" : "#F6F7FB",
    border: isDark ? "#2A2A2F" : "#E5E7EB",
    text: isDark ? "#ECECEC" : "#101012",
    sub: isDark ? "#B9B9BF" : "#4A4A55",
    chipBg: isDark ? "#1B1C22" : "#F1F5F9",
    chipText: isDark ? "#D1D5DB" : "#475569",
  };

  if (!exercise) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={styles.safe}>
          <View style={[styles.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.title, { color: C.text }]}>Exercise not found</Text>
            <Text style={[styles.sub, { color: C.sub }]}>
              This exercise may have been removed or cleared from local storage.
            </Text>
          </View>
        </View>
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
      <View style={styles.safe}>
        <View style={[styles.heroCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.heroTitle, { color: C.text }]} numberOfLines={2}>
            {exercise.name}
          </Text>
          <View style={styles.heroRow}>
            <View style={[styles.typeChip, { backgroundColor: C.chipBg, borderColor: C.border }]}>
              <Text style={[styles.typeText, { color: C.chipText }]}>{exercise.type}</Text>
            </View>
            <Text style={[styles.metaText, { color: C.sub }]}>Last used {lastUsed}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.statLabel, { color: C.sub }]}>Usage</Text>
            <Text style={[styles.statValue, { color: C.text }]}>{exercise.usageCount ?? 0}</Text>
            <Text style={[styles.statHint, { color: C.sub }]}>logged</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.statLabel, { color: C.sub }]}>Created</Text>
            <Text style={[styles.statValue, { color: C.text }]}>{createdOn}</Text>
            <Text style={[styles.statHint, { color: C.sub }]}>
              {exercise.createdBy || "MYVA"}
            </Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.label, { color: C.sub }]}>Description</Text>
          <Text style={[styles.body, { color: C.text }]}>
            {exercise.howTo?.trim() || "No description added yet."}
          </Text>
        </View>

        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.label, { color: C.sub }]}>Exercise ID</Text>
          <View style={[styles.idPill, { backgroundColor: C.cardAlt, borderColor: C.border }]}>
            <Text style={[styles.mono, { color: C.sub }]}>{exercise.id}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, padding: 16, gap: 12 },
  heroCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  heroTitle: { fontSize: 22, ...typography.body },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  typeText: { fontSize: 12, letterSpacing: 0.3, ...typography.label },
  metaText: { fontSize: 12, ...typography.body },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 },
  statLabel: { fontSize: 12, letterSpacing: 0.3, ...typography.label },
  statValue: { fontSize: 20, ...typography.body },
  statHint: { fontSize: 12, ...typography.body },
  panel: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 8 },
  label: { fontSize: 12, letterSpacing: 0.4, ...typography.label },
  body: { fontSize: 15, lineHeight: 22, ...typography.body },
  title: { fontSize: 20, marginBottom: 6, ...typography.body },
  sub: { fontSize: 14, ...typography.body },
  mono: { fontSize: 12, ...typography.mono },
  idPill: { borderWidth: 1, borderRadius: 12, padding: 10 },
  emptyCard: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 6 },
});
