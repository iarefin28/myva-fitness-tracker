// app/addNewMobility.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useLayoutEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";

import { typography } from "@/theme/typography";

type RouteParams = { name?: string };

export default function AddNewMobility() {
  const route = useRoute();
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { name: initialName = "" } = (route.params ?? {}) as RouteParams;

  const [name, setName] = useState(initialName.trim());
  const [type, setType] = useState<
    "Static" | "Dynamic" | "Branded" | "Corrective" | "PNF" | "Active"
  >();
  const [defaultMetrics, setDefaultMetrics] = useState<("Breathes" | "Reps" | "Time")[]>([]);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [howTo, setHowTo] = useState("");

  const canSave = false;

  const C = useMemo(
    () => ({
      bg: isDark ? "#0b0b0b" : "#F8FAFC",
      surface: isDark ? "#141414" : "#FFFFFF",
      border: isDark ? "#333" : "#E2E8F0",
      text: isDark ? "#FFFFFF" : "#0F172A",
      subText: isDark ? "#9ca3af" : "#64748B",
      placeholder: isDark ? "#777" : "#94A3B8",
      info: isDark ? "#93c5fd" : "#2563EB",
      tipBg: isDark ? "#0f1428" : "#EFF6FF",
      tipBorder: isDark ? "#1a2038" : "#BFDBFE",
      primary: isDark ? "#0A84FF" : "#2563EB",
    }),
    [isDark]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          disabled={!canSave}
          style={[styles.headerAction, !canSave && { opacity: 0.5 }]}
        >
          <Text style={[styles.headerActionText, { color: C.primary }]}>Save</Text>
        </Pressable>
      ),
      headerRightContainerStyle: { paddingRight: 8 },
    });
  }, [C.primary, canSave, navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      <View style={[styles.tip, { backgroundColor: C.tipBg, borderColor: C.tipBorder }]}>
        <Ionicons name="information-circle" size={18} color={C.info} />
        <Text style={[styles.tipText, { color: C.text }]}>
          Mobility library isn’t wired yet. You can fill this in, but saving is disabled for now.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.body}>
          {/* Name */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: C.text }]}>Name of Mobility Movement</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Hip Flexor Opener"
              placeholderTextColor={C.placeholder}
              style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* How-To */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: C.text }]}>
              General Notes on How To Perform (optional)
            </Text>
            <TextInput
              value={howTo}
              onChangeText={setHowTo}
              placeholder="Cues, timing, hold duration, etc."
              placeholderTextColor={C.placeholder}
              style={[
                styles.input,
                { minHeight: 110, textAlignVertical: "top", backgroundColor: C.surface, borderColor: C.border, color: C.text },
              ]}
              multiline
            />
          </View>

          <Pressable
            onPress={() => setShowAdvancedMetrics((v) => !v)}
            style={[styles.advancedToggle, { backgroundColor: C.primary }]}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvancedMetrics ? "Hide Advanced Metrics" : "Show Advanced Metrics"}
            </Text>
          </Pressable>

          {showAdvancedMetrics ? (
            <>
              {/* Type */}
              <View style={styles.block}>
                <Text style={[styles.label, { color: C.text }]}>Type (select one)</Text>
                <View style={[styles.segment, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {(["Static", "Dynamic", "Branded", "Corrective", "PNF", "Active"] as const).map((t) => {
                    const active = type === t;
                    return (
                      <Pressable
                        key={t}
                        onPress={() => setType(t)}
                        style={[styles.segmentChip, active && [styles.segmentChipActive, { backgroundColor: C.primary }]]}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: active ? "#fff" : C.subText },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Default Metrics Tracked */}
              <View style={styles.block}>
                <Text style={[styles.label, { color: C.text }]}>
                  Default Metrics Tracked (select all that apply)
                </Text>
                <View style={[styles.segment, { backgroundColor: C.surface, borderColor: C.border }]}>
                  {(["Reps", "Time", "Breathes"] as const).map((t) => {
                    const active = defaultMetrics.includes(t);
                    return (
                      <Pressable
                        key={t}
                        onPress={() =>
                          setDefaultMetrics((prev) =>
                            prev.includes(t) ? prev.filter((m) => m !== t) : [...prev, t]
                          )
                        }
                        style={[styles.segmentChip, active && [styles.segmentChipActive, { backgroundColor: C.primary }]]}
                      >
                        <Text
                          style={[
                            styles.segmentText,
                            { color: active ? "#fff" : C.subText },
                          ]}
                        >
                          {t}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </>
          ) : null}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0b" },

  body: { padding: 16, gap: 14 },

  block: { gap: 8 },
  label: { color: "#e5e7eb", ...typography.body },
  input: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#141414",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },

  segment: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  segmentChip: {
    flexBasis: "32%",
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentChipActive: { backgroundColor: "#0A84FF" },
  segmentText: { color: "#9ca3af", ...typography.body },

  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "#0f1428",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1a2038",
    marginHorizontal: 16,
    marginTop: 10,
  },
  tipText: { color: "#e5e7eb", flex: 1, ...typography.body },

  advancedToggle: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  advancedToggleText: { color: "#fff", fontSize: 14, ...typography.body, fontWeight: "600" },

  primary: {
    backgroundColor: "#0A84FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: { color: "white", fontSize: 16, ...typography.button },
  headerAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  headerActionText: { fontSize: 14, ...typography.body, fontWeight: "600" },
});
