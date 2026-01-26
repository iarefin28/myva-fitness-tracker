// app/index.tsx
import { useWorkoutStore } from "@/store/workoutStore";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { typography } from "@/theme/typography";
import { useAuth } from "../auth/AuthProvider";

const ADD_WORKOUT_ROUTE = "/add-workout";
const COMPLETED_WORKOUTS_ROUTE = "/completed-workouts";
const UPCOMING_WORKOUTS_ROUTE = "/upcomingworkouts";
const TEMPLATES_ROUTE = "/savedworkouts";

export default function IndexScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { width, fontScale } = useWindowDimensions();
  const { user } = useAuth();

  // -------- Store selectors --------
  const draft = useWorkoutStore((s) => s.draft);
  const history = useWorkoutStore((s) => s.history) || [];
  const startDraft = useWorkoutStore((s) => s.startDraft);
  const resume = useWorkoutStore((s) => (s as any).resume);
  const elapsedSeconds = useWorkoutStore((s) => s.elapsedSeconds);

  // -------- 1s heartbeat for live timer --------
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const totalSec = useMemo(() => (elapsedSeconds ? elapsedSeconds() : 0), [elapsedSeconds, draft, tick]);
  const mmss = useMemo(() => {
    const mm = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const ss = (totalSec % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }, [totalSec]);

  // -------- Theme-ish colors --------
  const bg = scheme === "dark" ? "#0B0B0C" : "#F7F7FA";
  const cardBg = scheme === "dark" ? "#141416" : "#FFFFFF";
  const textColor = scheme === "dark" ? "#ECECEC" : "#101012";
  const subText = scheme === "dark" ? "#B9B9BF" : "#4A4A55";

  // -------- Gradient logic (blue when idle, green when running, red when paused) --------
  const isLive = !!draft;
  const isPaused = !!draft?.pausedAt;
  const gradientColors = useMemo(() => {
    if (isLive && isPaused) {
      return scheme === "dark"
        ? ["#7F1D1D", "#EF4444"]
        : ["#F87171", "#EF4444"];
    }
    if (isLive) {
      return scheme === "dark"
        ? ["#14532D", "#22C55E"]
        : ["#86EFAC", "#22C55E"];
    } else {
      return scheme === "dark"
        ? ["#1E3A8A", "#2563EB"]
        : ["#60A5FA", "#3B82F6"];
    }
  }, [isLive, isPaused, scheme]);

  // -------- Responsive layout sizes --------
  const HERO_HEIGHT = useMemo(() => Math.round(Math.max(120, Math.min(220, width * 0.40))), [width]);
  const CTA_HEIGHT = useMemo(
    () => Math.round(Math.max(42, Math.min(56, 44 * Math.min(1.2, Math.max(0.9, fontScale))))),
    [fontScale]
  );
  const SUBTITLE_MIN_HEIGHT = useMemo(() => Math.round(Math.max(32, HERO_HEIGHT * 0.22)), [HERO_HEIGHT]);
  const RIGHT_SLOT_WIDTH = useMemo(() => Math.min(120, Math.round(Math.max(74, width * 0.18))), [width]);
  const favoritesGap = 10;
  const favoritesPillHeight = 62;
  const favoritesPillWidth = useMemo(
    () => Math.floor((width - 32 - favoritesGap * 3) / 4),
    [width]
  );

  // (reserved for future button layout sizing)

  const onStartOrOpen = () => {
    if (!draft) startDraft("");
    router.push(ADD_WORKOUT_ROUTE);
  };

  const recent = history.slice(0, 3);
  const quickStartStates = ["Quick Start", "View", "Edit", "Share"] as const;
  const [quickStartIndex, setQuickStartIndex] = useState(0);
  const quickStartLabel = quickStartStates[quickStartIndex];
  const lastMovement = useMemo(() => {
    if (!draft) return null;
    const exercises = draft.items.filter((it) => it.type === "exercise") as Array<{ name: string; createdAt: number }>;
    if (!exercises.length) return null;
    return exercises.reduce((latest, current) => (current.createdAt > latest.createdAt ? current : latest)).name;
  }, [draft]);
  const displayName = user?.displayName || user?.email || "";
  const bannerText = !draft
    ? `Welcome back${displayName ? ` ${displayName}` : ""}!`
    : isPaused
      ? "Workout is paused"
      : lastMovement
        ? `Last movement: ${lastMovement}`
        : "Workout in progress.";

  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: 0, paddingHorizontal: 16, paddingBottom: 0, gap: 16 }}>
      <View style={{ marginHorizontal: -16 }}>
        <TouchableOpacity
          disabled={!draft}
          onPress={() => {
            if (!draft) return;
            if (isPaused) resume();
            router.push(ADD_WORKOUT_ROUTE);
          }}
          activeOpacity={draft ? 0.85 : 1}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomLeftRadius: 14,
              borderBottomRightRadius: 14,
              opacity: draft ? 1 : 0.95,
            }}
          >
            <Text
              style={{ color: "#fff", fontWeight: "700", fontSize: 16, textAlign: "center", ...typography.body }}
              numberOfLines={2}
            >
              {bannerText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      {/* ---------- FAVORITES ---------- */}
      <View style={{ marginTop: 4 }}>
        <Text style={{ color: textColor, fontWeight: "700", fontSize: 16, marginBottom: 8, ...typography.body }}>
          Your Favorites
        </Text>
        <View style={{ flexDirection: "row", gap: favoritesGap }}>
          {[
            { label: "Push", kind: "standard", moves: "3 moves" },
            { label: "Pull", kind: "standard", moves: "5 moves" },
            { label: "Legs", kind: "standard", moves: "4 moves" },
            { label: "Quick Start", kind: "quick" },
          ].map((item) =>
            item.kind === "quick" ? (
              <TouchableOpacity
                key={item.label}
                onPress={() => {
                  setQuickStartIndex((prev) => (prev + 1) % quickStartStates.length);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    quickStartLabel === "Quick Start"
                      ? ["#22C55E", "#4ADE80"]
                      : quickStartLabel === "View"
                        ? ["#2563EB", "#60A5FA"]
                        : quickStartLabel === "Edit"
                          ? ["#F59E0B", "#FCD34D"]
                          : ["#7C3AED", "#C084FC"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    height: favoritesPillHeight,
                    width: favoritesPillWidth,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", textAlign: "center", ...typography.body }}>
                    {quickStartLabel}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View
                key={item.label}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  height: favoritesPillHeight,
                  borderWidth: 1,
                  borderColor: scheme === "dark" ? "#2A2A2F" : "#E5E7EB",
                  shadowColor: "#000",
                  shadowOpacity: scheme === "dark" ? 0 : 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: scheme === "dark" ? 0 : 2,
                  width: favoritesPillWidth,
                }}
              >
                <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons
                    name="star"
                    size={14}
                    color={scheme === "dark" ? "#FBBF24" : "#F59E0B"}
                  />
                  <Text style={{ color: textColor, fontWeight: "700", marginTop: 1, ...typography.body }}>
                    {item.label}
                  </Text>
                  <Text style={{ color: subText, fontSize: 12, marginTop: 1, ...typography.body }}>
                    {item.moves}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>
      </View>

      {/* ---------- RECENT WORKOUTS ---------- */}
        {recent.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: textColor, fontWeight: "700", fontSize: 16, marginBottom: 8, ...typography.body }}>
              Recent Workouts
            </Text>
            <View style={{ gap: 8 }}>
              {recent.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => router.push(`/completed-workout-detail?workoutId=${w.id}`)}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: 12,
                    padding: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <FontAwesome5
                      name="dumbbell"
                      size={16}
                      color={scheme === "dark" ? "#A3A3AD" : "#6B7280"}
                      style={{ marginRight: 10 }}
                    />
                    <View>
                      <Text style={{ color: textColor, fontWeight: "600", ...typography.body }}>
                        {w.name?.trim() || "Workout"}
                      </Text>
                      <Text style={{ color: subText, marginTop: 2, fontSize: 12, ...typography.body }}>
                        {formatWhen(w.createdAt)} • {pluralize((w.items || []).length, "item")}
                        {typeof w.durationSec === "number" ? ` • ${formatMMSS(w.durationSec)}` : ""}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={subText} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={{ flexGrow: 1 }} />

        {/* ---------- HERO CARD ---------- */}
        <View style={{ marginHorizontal: -16, marginBottom: 0, marginTop: 6 }}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingHorizontal: 16,
              paddingTop: 18,
              paddingBottom: 56,
            }}
          >
            {/* Top row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700", ...typography.body }} numberOfLines={1}>
                  Move with purpose.
                </Text>

                <View style={{ marginTop: 6, minHeight: SUBTITLE_MIN_HEIGHT, justifyContent: "center" }}>
                  {isLive ? (
                    <Text style={{ color: "#F8FAFC", fontSize: 14, ...typography.body }} numberOfLines={1} ellipsizeMode="tail">
                      {(draft?.name?.trim() || "Untitled workout")} • {pluralize(draft?.items?.length || 0, "item")}
                    </Text>
                  ) : (
                    <Text style={{ color: "#F8FAFC", fontSize: 14, ...typography.body }} numberOfLines={2}>
                      Track your sets, rest, notes — and keep the timer rolling.
                    </Text>
                  )}
                </View>
              </View>

              {/* Right slot: icon when idle, timer pill when live */}
              <View style={{ width: RIGHT_SLOT_WIDTH, alignItems: "flex-end" }}>
                {isLive ? (
                  <View
                    style={{
                      minWidth: 68,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: isPaused ? "rgba(239,68,68,0.85)" : "rgba(34,197,94,0.85)",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isPaused ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)",
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: "700",
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                        ...typography.body,
                      }}
                    >
                      {isPaused ? "Paused" : "Running"}
                    </Text>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "700",
                        fontVariant: ["tabular-nums"],
                        fontFeatureSettings: "'tnum' 1",
                        ...typography.body,
                      } as any}
                    >
                      {mmss}
                    </Text>
                  </View>
                ) : (
                  <Ionicons name="stopwatch-outline" size={24} color="#F8FAFC" />
                )}
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={onStartOrOpen}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                height: CTA_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 12,
              }}
            >
              <Text style={{ color: "#111", fontWeight: "700", ...typography.button }}>
                {isLive ? "Open Live Workout" : "Start Live Workout"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push(COMPLETED_WORKOUTS_ROUTE)}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: 12,
                height: CTA_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.45)",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700", ...typography.button }}>
                View Completed Workouts
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
    </View>
  );
}

// ---------- Utils ----------
function pluralize(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}
function formatWhen(ts?: number) {
  if (!ts) return "Just now";
  const d = new Date(ts);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  if (sameDay) {
    return `Today ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}
function formatMMSS(total: number) {
  const mm = Math.floor(total / 60).toString().padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
