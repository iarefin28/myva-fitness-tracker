// app/index.tsx
import { useWorkoutStore } from "@/store/workoutStore";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

const ADD_WORKOUT_ROUTE = "/add-workout";
const COMPLETED_WORKOUTS_ROUTE = "/completed-workouts";
// const UPCOMING_WORKOUTS_ROUTE = "/upcomingworkouts";
// const TEMPLATES_ROUTE = "/savedworkouts";

export default function IndexScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const { width, fontScale } = useWindowDimensions();

  // -------- Store selectors --------
  const draft = useWorkoutStore((s) => s.draft);
  const history = useWorkoutStore((s) => s.history) || [];
  const startDraft = useWorkoutStore((s) => s.startDraft);
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
  const dividerColor = scheme === "dark" ? "#2B2B31" : "#E6E6EC";

  // -------- Gradient logic (blue when idle, red when live) --------
  const isLive = !!draft;
  const gradientColors = useMemo(() => {
    if (isLive) {
      return scheme === "dark"
        ? ["#B91C1C", "#EF4444"]
        : ["#F87171", "#EF4444"];
    } else {
      return scheme === "dark"
        ? ["#1E3A8A", "#2563EB"]
        : ["#60A5FA", "#3B82F6"];
    }
  }, [isLive, scheme]);

  // -------- Responsive layout sizes --------
  const HERO_HEIGHT = useMemo(() => Math.round(Math.max(120, Math.min(220, width * 0.40))), [width]);
  const CTA_HEIGHT = useMemo(
    () => Math.round(Math.max(42, Math.min(56, 44 * Math.min(1.2, Math.max(0.9, fontScale))))),
    [fontScale]
  );
  const SUBTITLE_MIN_HEIGHT = useMemo(() => Math.round(Math.max(32, HERO_HEIGHT * 0.22)), [HERO_HEIGHT]);
  const RIGHT_SLOT_WIDTH = useMemo(() => Math.min(120, Math.round(Math.max(74, width * 0.18))), [width]);

  // Uniform responsive row height (≈14% of width), clamped for consistency and a11y-safe
  const ROW_H = React.useMemo(
    () => Math.round(Math.max(52, Math.min(72, (width * 0.14) / Math.min(fontScale, 1.2)))),
    [width, fontScale]
  );

  // -------- Quick actions --------
  const buttons = [
    { title: "View Completed Workouts", path: COMPLETED_WORKOUTS_ROUTE, icon: (c: string) => <MaterialIcons name="check-circle-outline" size={22} color={c} />, disabled: true },
    //{ title: "View Upcoming Workouts", path: UPCOMING_WORKOUTS_ROUTE, icon: (c: string) => <Ionicons name="calendar-outline" size={22} color={c} />, disabled: true },
    //{ title: "Saved Workout Templates", path: TEMPLATES_ROUTE, icon: (c: string) => <Ionicons name="bookmark-outline" size={22} color={c} />, disabled: true },
  ] as const;

  const onStartOrOpen = () => {
    if (!draft) startDraft("");
    router.push(ADD_WORKOUT_ROUTE);
  };

  const recent = history.slice(0, 3);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ padding: 16, gap: 22 }}>
        {/* ---------- HERO CARD ---------- */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 16,
            padding: 18,
            height: HERO_HEIGHT,
            justifyContent: "space-between",
          }}
        >
          {/* Top row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }} numberOfLines={1}>
                Move with purpose.
              </Text>

              <View style={{ marginTop: 6, minHeight: SUBTITLE_MIN_HEIGHT, justifyContent: "center" }}>
                {isLive ? (
                  <Text style={{ color: "#F8FAFC", fontSize: 14 }} numberOfLines={1} ellipsizeMode="tail">
                    {(draft?.name?.trim() || "Untitled workout")} • {pluralize(draft?.items?.length || 0, "item")}
                  </Text>
                ) : (
                  <Text style={{ color: "#F8FAFC", fontSize: 14 }} numberOfLines={2}>
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
                    height: 28,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.35)",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(255,255,255,0.12)",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: "700",
                      fontVariant: ["tabular-nums"],
                      fontFeatureSettings: "'tnum' 1",
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
            <Text style={{ color: "#111", fontWeight: "700" }}>
              {isLive ? "Open Live Workout" : "Start Live Workout"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ---------- QUICK ACTIONS ---------- */}
        <View style={{ borderRadius: 12, overflow: "hidden", backgroundColor: cardBg }}>
          {buttons.map(({ title, path, icon, disabled }, idx) => {
            const rowTextColor = disabled ? subText : textColor;
            const rowIconColor = rowTextColor;
            return (
              <TouchableOpacity
                key={title}
                onPress={() => { if (!disabled) router.push(path as any); }}
                disabled={disabled}
                style={{
                  backgroundColor: cardBg,
                  opacity: disabled ? 0.55 : 1,
                  height: ROW_H,                // <-- fixed, uniform height
                  paddingHorizontal: 14,
                  justifyContent: "center",
                  borderTopWidth: idx === 0 ? 0 : 1,  // <-- divider without changing row height
                  borderTopColor: dividerColor,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <View style={{ marginRight: 10 }}>{icon(rowIconColor)}</View>
                    <Text
                      style={{ fontSize: 16, color: rowTextColor, flexShrink: 1 }}
                      numberOfLines={1}                  // <-- prevent wrapping (which would bump height)
                      ellipsizeMode="tail"
                    >
                      {title}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={subText} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ---------- RECENT WORKOUTS ---------- */}
        {recent.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: textColor, fontWeight: "700", fontSize: 16, marginBottom: 8 }}>
              Recent Workouts
            </Text>
            <View style={{ gap: 8 }}>
              {recent.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  onPress={() => router.push(`/exercise-log?workoutId=${w.id}`)}
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
                      <Text style={{ color: textColor, fontWeight: "600" }}>
                        {w.name?.trim() || "Workout"}
                      </Text>
                      <Text style={{ color: subText, marginTop: 2, fontSize: 12 }}>
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
      </View>
    </ScrollView>
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
