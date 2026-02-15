import { useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { useMobilityMovementLibrary } from "@/store/mobilityMovementLibrary";
import { typography } from "@/theme/typography";

type RouteParams = { mobilityId?: string };

export default function MobilityDetailScreen() {
  const route = useRoute();
  const { mobilityId } = (route.params ?? {}) as RouteParams;
  const movementMap = useMobilityMovementLibrary((s) => s.movements);

  const movement = useMemo(() => {
    if (!mobilityId) return null;
    return movementMap[mobilityId] || null;
  }, [mobilityId, movementMap]);

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

  if (!movement) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
        <View style={styles.safe}>
          <View style={[styles.emptyCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.title, { color: C.text }]}>Mobility move not found</Text>
            <Text style={[styles.sub, { color: C.sub }]}>
              This movement may have been removed or cleared from local storage.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const createdOn = movement.createdAt
    ? new Date(movement.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";
  const updatedOn = movement.updatedAt
    ? new Date(movement.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";
  const metrics = movement.defaultMetrics?.length
    ? movement.defaultMetrics.join(", ")
    : "None";

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={styles.safe}>
        <View style={[styles.heroCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.heroTitle, { color: C.text }]} numberOfLines={2}>
            {movement.name}
          </Text>
          <View style={styles.heroRow}>
            <View style={[styles.typeChip, { backgroundColor: C.chipBg, borderColor: C.border }]}>
              <Text style={[styles.typeText, { color: C.chipText }]}>
                {movement.type || "Mobility"}
              </Text>
            </View>
            <Text style={[styles.metaText, { color: C.sub }]}>Updated {updatedOn}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.statLabel, { color: C.sub }]}>Metrics</Text>
            <Text style={[styles.statValue, { color: C.text }]} numberOfLines={1}>
              {metrics}
            </Text>
            <Text style={[styles.statHint, { color: C.sub }]}>default</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.statLabel, { color: C.sub }]}>Created</Text>
            <Text style={[styles.statValue, { color: C.text }]}>{createdOn}</Text>
            <Text style={[styles.statHint, { color: C.sub }]}>local</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.label, { color: C.sub }]}>Description</Text>
          <Text style={[styles.body, { color: C.text }]}>
            {movement.howTo?.trim() || "No description added yet."}
          </Text>
        </View>

        <View style={[styles.panel, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.label, { color: C.sub }]}>Movement ID</Text>
          <View style={[styles.idPill, { backgroundColor: C.cardAlt, borderColor: C.border }]}>
            <Text style={[styles.mono, { color: C.sub }]}>{movement.id}</Text>
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
  statValue: { fontSize: 16, ...typography.body },
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
