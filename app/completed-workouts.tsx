import { useWorkoutStore } from "@/store/workoutStore";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { typography } from "@/theme/typography";

export default function CompletedWorkoutsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const history = useWorkoutStore((s) => s.history) || [];

  const C = useMemo(
    () => ({
      bg: isDark ? "#0b0b0b" : "#ffffff",
      card: isDark ? "#141416" : "#f8fafc",
      border: isDark ? "#262626" : "#e2e8f0",
      text: isDark ? "#f8fafc" : "#0f172a",
      sub: isDark ? "#9ca3af" : "#64748b",
    }),
    [isDark]
  );

  const data = useMemo(() => [...history].sort((a, b) => b.endedAt - a.endedAt), [history]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {data.length === 0 ? (
        <Text style={[styles.empty, { color: C.sub }]}>No completed workouts yet.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/completed-workout-detail?workoutId=${item.id}`)}
              style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.cardTitle, { color: C.text }]}>{item.name?.trim() || "Workout"}</Text>
              <Text style={[styles.cardSub, { color: C.sub }]}>
                {new Date(item.endedAt).toLocaleDateString()} • {item.items.length} item(s)
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  cardTitle: { fontSize: 16, ...typography.body },
  cardSub: { marginTop: 6, fontSize: 12, ...typography.body },
  empty: { padding: 24, textAlign: "center", fontSize: 14, ...typography.body },
});
