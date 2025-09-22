import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { useWorkoutStore } from '../stores/workoutStore';

interface Workout {
  id: number;
  name: string;
  exercises: any[];
  notes?: string;
  date: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const [workoutsThisWeek, setWorkoutsThisWeek] = useState(0);

  // ⬇️ Store selectors
  const isActive = useWorkoutStore((s) => s.isActive);
  const elapsedMs = useWorkoutStore((s) => s.elapsedMs);
  const liveExercises = useWorkoutStore((s) => s.liveExercises ?? []);
  const workoutName = useWorkoutStore((s) => s.liveMeta?.workoutName ?? ''); // if you added liveMeta
  const tick = useWorkoutStore((s) => s.tick);

  // Tick the timer every second while active (harmless if you also tick in _layout)
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => {
      try { tick(); } catch {}
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, tick]);

  const backgroundColor = scheme === "dark" ? "#000" : "#d1d1d1";
  const textColor = scheme === "dark" ? "#fff" : "#000";
  const cardColor = scheme === "dark" ? "#1e1e1e" : "notes#ffffffff";
  const dividerColor = scheme === "dark" ? "#333" : "#797474ff";

  const buttons = [
    {
      title: "View Completed Workouts",
      path: "/completed-workouts",
      icon: <MaterialIcons name="check-circle-outline" size={22} color={textColor} />,
    },
    {
      title: "View Upcoming Workouts",
      path: "/upcomingworkouts",
      icon: <Ionicons name="calendar-outline" size={22} color={textColor} />,
    },
    {
      title: "Saved Workout Templates",
      path: "/workout-templates",
      icon: <FontAwesome5 name="clipboard-list" size={20} color={textColor} />,
    },
  ];

  // Load workout data and compute this week's count (unchanged)
  useEffect(() => {
    const loadWorkoutCount = async () => {
      try {
        const stored = await AsyncStorage.getItem("savedWorkouts");
        if (!stored) return;
        const parsed: Workout[] = JSON.parse(stored);
        const count = getWorkoutsThisWeek(parsed);
        setWorkoutsThisWeek(count);
      } catch (err) {
        console.error("Failed to load workout count", err);
      }
    };
    loadWorkoutCount();
  }, []);

  function getWorkoutsThisWeek(workouts: Workout[]) {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    return workouts.filter((w) => {
      const workoutDate = new Date(w.date);
      return workoutDate >= sevenDaysAgo && workoutDate <= now;
    }).length;
  }

  function getGradientColors(count: number): string[] {
    if (count <= 1) return ["#ff5f6d", "#ffc371"];
    if (count === 2) return ["#ff8800", "#ffd700"];
    if (count === 3) return ["#ffd700", "#a0e426"];
    if (count === 4) return ["#70e000", "#00c853"];
    if (count >= 5) return ["#00b894", "#00cec9"];
    return ["#666", "#999"];
  }

  function clock(ms: number) {
    const s = Math.floor(ms / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  // Show “Continue” if there’s an active session OR there are unsaved live exercises
  const shouldShowContinue = isActive || liveExercises.length > 0;

  function ContinueWorkoutItem() {
    if (!shouldShowContinue) return null;

    const cardBg = cardColor;
    const labelColor = scheme === "dark" ? "#cbd5e1" : "#475569";

    return (
      <View
        style={{
          marginTop: 16,
          backgroundColor: cardBg,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 2,
          overflow: "hidden",
        }}
      >
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/add-workout", params: { resume: "1" } })}
          accessibilityLabel="Continue live workout"
          style={{
            paddingVertical: 18,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: textColor, fontWeight: "800", fontSize: 16 }}>
              Continue Live Workout
            </Text>
            <Text style={{ marginTop: 4, color: labelColor }}>
              {workoutName ? `${workoutName} · ` : ""}
              {isActive ? <Text>Live: {clock(elapsedMs)}</Text> : <Text>Paused</Text>}
            </Text>
          </View>

          <View
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              backgroundColor: scheme === "dark" ? "#0f172a" : "#ecfdf5",
              borderWidth: 1,
              borderColor: scheme === "dark" ? "#334155" : "#a7f3d0",
            }}
          >
            <Text style={{ color: textColor, fontWeight: "700" }}>Resume ▶︎</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor }} contentContainerStyle={{ padding: 16 }}>
      <View>
        {/* Header Row: Today + Date */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <Text style={{ fontSize: 22, fontWeight: "600", color: textColor, marginRight: 6 }}>
            Today ·
          </Text>
          <Text style={{ fontSize: 16, color: "#888", fontWeight: "400" }}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {/* Weekly count pill */}
        <View style={{ alignItems: "center", marginBottom: 30 }}>
          <LinearGradient
            colors={getGradientColors(workoutsThisWeek)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderRadius: 999,
              elevation: 3,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 3,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14 }}>
              {workoutsThisWeek} Workouts This Week
            </Text>
          </LinearGradient>
        </View>

        {/* Grouped Navigation Panel */}
        <View
          style={{
            backgroundColor: cardColor,
            borderRadius: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 2,
            overflow: "hidden",
          }}
        >
          {buttons.map(({ title, path }, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => router.push(path)}
              style={{
                paddingVertical: 22,
                paddingHorizontal: 24,
                backgroundColor: cardColor,
                borderTopLeftRadius: idx === 0 ? 12 : 0,
                borderTopRightRadius: idx === 0 ? 12 : 0,
                borderBottomLeftRadius: idx === buttons.length - 1 ? 12 : 0,
                borderBottomRightRadius: idx === buttons.length - 1 ? 12 : 0,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ marginRight: 10 }}>{buttons[idx].icon}</View>
                <Text style={{ fontSize: 17, color: textColor }}>{title}</Text>
              </View>

              {idx < buttons.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: dividerColor,
                    opacity: 0.4,
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                  }}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Live Workout (from store) */}
        <ContinueWorkoutItem />
      </View>
    </ScrollView>
  );
}
