// app/addNewExercise.tsx
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import {
  Alert,
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

import { auth } from "@/FirebaseConfig";
import { useExerciseLibrary } from "@/store/exerciseLibrary";
// IMPORTANT: match the path your other screens use in this navigator:
import type { ExerciseType } from "@/types/workout";
import { useWorkoutStore } from "../store/workoutStore"; // <-- unify with _layout usage

type RouteParams = { name?: string; addToDraft?: string };

export default function AddNewExercise() {
  const navigation = useNavigation();
  const route = useRoute();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { name: initialName = "", addToDraft } = (route.params ?? {}) as RouteParams;

  // Default: add to draft unless explicitly disabled (?addToDraft=0)
  const shouldAddToDraft = addToDraft !== "0";

  const [name, setName] = useState(initialName.trim());
  const [type, setType] = useState<ExerciseType>("free weight");
  const [howTo, setHowTo] = useState("");
  const [saving, setSaving] = useState(false);

  const ensureLocalExercise = useExerciseLibrary((s) => s.ensureLocalExercise);
  const byName = useExerciseLibrary((s) => s.byName);
  const addExerciseToDraft = useWorkoutStore((s) => (s as any).addExercise) as (
    exName: string,
    exerciseId?: string
  ) => string;

  const existsId = useMemo(() => {
    const key = name.trim().toLowerCase();
    return key ? byName[key] : undefined;
  }, [name, byName]);

  const canSave = name.trim().length >= 2 && !saving;

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

  const onSave = async () => {
    const n = name.trim();
    if (n.length < 2) {
      Alert.alert("Name too short", "Use at least 2 characters.");
      return;
    }

    try {
      setSaving(true);

      let exerciseId = existsId;
      let exerciseName = n;

      if (!exerciseId) {
        const creatorName =
          auth?.currentUser?.displayName ||
          auth?.currentUser?.email ||
          "Local User";
        const creatorUid = auth?.currentUser?.uid || undefined;
        const { exercise } = await ensureLocalExercise(n, {
          type,
          howTo,
          createdBy: creatorName,
          createdByUid: creatorUid,
        });
        exerciseId = exercise.id;
        exerciseName = exercise.name;
      }

      if (shouldAddToDraft && exerciseId) {
        addExerciseToDraft(exerciseName, exerciseId);
      }

      navigation.goBack();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Failed to save exercise.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Optional tip only when explicitly requested */}
      {addToDraft === "1" && (
        <View style={[styles.tip, { backgroundColor: C.tipBg, borderColor: C.tipBorder }]}>
          <Ionicons name="add-circle" size={18} color={C.primary} />
          <Text style={[styles.tipText, { color: C.text }]}>
            After saving, this exercise will be added to your current workout.
          </Text>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.body}>
          {/* Name */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: C.text }]}>Exercise name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Barbell Back Squat"
              placeholderTextColor={C.placeholder}
              style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              autoCapitalize="words"
              returnKeyType="done"
            />
            {!!existsId && (
              <View style={styles.infoRow}>
                <Ionicons name="information-circle" size={16} color={C.info} />
                <Text style={[styles.infoText, { color: C.info }]}>
                  This exercise already exists in your library.
                </Text>
              </View>
            )}
          </View>

          {/* Type */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: C.text }]}>Type</Text>
            <View style={[styles.segment, { backgroundColor: C.surface, borderColor: C.border }]}>
              {(["free weight", "machine", "bodyweight"] as ExerciseType[]).map((t) => {
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

          {/* How-To */}
          <View style={styles.block}>
            <Text style={[styles.label, { color: C.text }]}>
              How do you perform it? (optional)
            </Text>
            <TextInput
              value={howTo}
              onChangeText={setHowTo}
              placeholder="Cues, setup, tempo, range of motion, etc."
              placeholderTextColor={C.placeholder}
              style={[
                styles.input,
                { minHeight: 110, textAlignVertical: "top", backgroundColor: C.surface, borderColor: C.border, color: C.text },
              ]}
              multiline
            />
          </View>

          <Pressable
            onPress={onSave}
            style={[
              styles.primary,
              { backgroundColor: C.primary },
              (!canSave || saving) && { opacity: 0.6 },
            ]}
            disabled={!canSave || saving}
          >
            <Text style={styles.primaryText}>{saving ? "Saving…" : "Save Exercise"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0b0b0b" },

  body: { padding: 16, gap: 14 },

  block: { gap: 8 },
  label: { color: "#e5e7eb", fontWeight: "800" },
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
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  segmentChip: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8 },
  segmentChipActive: { backgroundColor: "#0A84FF" },
  segmentText: { color: "#9ca3af", fontWeight: "700", textTransform: "capitalize" },
  segmentTextActive: { color: "white" },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { color: "#93c5fd", fontSize: 12 },

  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    backgroundColor: "#0f1428",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1a2038",
  },
  tipText: { color: "#e5e7eb", flex: 1 },

  primary: {
    backgroundColor: "#0A84FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  primaryText: { color: "white", fontSize: 16, fontWeight: "800" },
});
