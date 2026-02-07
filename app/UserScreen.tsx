import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Pressable,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "../auth/AuthProvider";
import { db } from "../FirebaseConfig";
import { useExerciseLibrary } from "@/store/exerciseLibrary";
import { typography } from "@/theme/typography";

type FriendRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  fromDisplayName: string | null;
  toDisplayName: string | null;
  createdAt?: any;
  updatedAt?: any;
};

type TopTab = "exercises" | "friends" | "requests";

export default function UserScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const exercisesById = useExerciseLibrary((s) => s.exercises);
  const ensureDefaults = useExerciseLibrary((s) => s.ensureDefaults);
  const [activeTab, setActiveTab] = useState<TopTab>("exercises");
  const insets = useSafeAreaInsets();

  const [friends, setFriends] = useState<string[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const C = useMemo(
    () => ({
      bg: isDark ? "#000" : "#fff",
      text: isDark ? "#fff" : "#0b0b0b",
      sub: isDark ? "#bdbdbd" : "#4a4a4a",
      headerText: "#fff",
      subText: isDark ? "#9ca3af" : "#64748B",
      border: isDark ? "#2a2a2a" : "#e5e5eb",
      tabBg: isDark ? "#111" : "#F1F5F9",
      accent: isDark ? "#0A84FF" : "#2563EB",
    }),
    [isDark]
  );

  const headerGradient = useMemo(
    () => (isDark ? ["#14532D", "#22C55E"] : ["#86EFAC", "#22C55E"]),
    [isDark]
  );

  useEffect(() => {
    ensureDefaults();
  }, [ensureDefaults]);

  const exercisesList = useMemo(() => {
    const values = Object.values(exercisesById ?? {});
    return values.sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [exercisesById]);

  useEffect(() => {
    if (!user?.uid) return;

    const ref = doc(db, "users", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();
      if (!data) return;
      setFriends(data.friends ?? []);
    });

    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const ref = collection(db, "users", user.uid, "incomingRequests");
    const q = query(ref, where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      const list: FriendRequest[] = [];
      snap.forEach((d) => list.push(d.data() as FriendRequest));
      setIncomingRequests(list);
    });

    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;

    const ref = collection(db, "users", user.uid, "outgoingRequests");
    const q = query(ref, where("status", "==", "pending"));
    const unsub = onSnapshot(q, (snap) => {
      const list: FriendRequest[] = [];
      snap.forEach((d) => list.push(d.data() as FriendRequest));
      setOutgoingRequests(list);
    });

    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    async function loadProfiles() {
      if (friends.length === 0) {
        setFriendProfiles([]);
        return;
      }

      const q = query(
        collection(db, "users"),
        where("uid", "in", friends.slice(0, 10))
      );

      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      setFriendProfiles(list);
    }

    loadProfiles();
  }, [friends]);

  const sectionButtons = [
    { key: "exercises" as const, label: `Exercises (${exercisesList.length})` },
    { key: "friends" as const, label: `Friends (${friendProfiles.length})` },
    {
      key: "requests" as const,
      label: `Requests (${incomingRequests.length + outgoingRequests.length})`,
    },
  ];

  const handleExercisePress = (exerciseId: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    navigation.navigate("exercise-detail", { exerciseId });
  };
  const handleAddExercise = () => {
    navigation.navigate("addNewExercise", { addToDraft: "0" });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <LinearGradient colors={headerGradient} style={styles.headerBlock}>
        <View style={styles.headerContent}>
          <Text style={[styles.name, { color: C.headerText }]}>
            {user?.displayName || "No name"}
          </Text>
          <Text style={[styles.email, { color: C.headerText }]}>
            {user?.email || "No email"}
          </Text>
          <Text style={[styles.uid, { color: C.headerText }]}>
            uid: {user?.uid || "Unknown"}
          </Text>
        </View>
        <View style={styles.headerControls}>
          <View style={styles.tabRow}>
            {sectionButtons.map((tab) => {
              const isActive = activeTab === tab.key;
              const isDisabled = tab.key !== "exercises";
              return (
                <Pressable
                  key={tab.key}
                  disabled={isDisabled}
                  onPress={() => setActiveTab(tab.key)}
                  style={[
                    styles.tabBtn,
                    { backgroundColor: "rgba(17, 17, 17, 0.18)", borderColor: "rgba(255, 255, 255, 0.35)" },
                    isActive && [styles.tabBtnActive, { backgroundColor: C.accent, borderColor: C.accent }],
                    isDisabled && styles.tabBtnDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      { color: C.headerText },
                      isActive && styles.tabTextActive,
                      isDisabled && styles.tabTextDisabledOnHeader,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.bottom, { paddingBottom: 60 + insets.bottom }]}>

        {activeTab === "exercises" ? (
          <View style={[styles.panel, { backgroundColor: C.tabBg, borderColor: C.border }]}>
            <View style={[styles.panelHeader, { borderBottomColor: C.border }]}>
              <Text style={[styles.panelTitle, { color: C.text }]}>All Exercises</Text>
              <Pressable
                onPress={handleAddExercise}
                style={({ pressed }) => [
                  styles.headerAction,
                  { borderColor: C.border },
                  pressed && styles.headerActionPressed,
                ]}
              >
                <Ionicons name="add" size={16} color={C.text} />
                <Text style={[styles.headerActionText, { color: C.text }]}>
                  New Exercise
                </Text>
              </Pressable>
            </View>

            {exercisesList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: C.sub }]}>
                  No exercises yet.
                </Text>
              </View>
            ) : (
              <FlatList
                data={exercisesList}
                keyExtractor={(item: any) => String(item.id ?? item.name)}
                ItemSeparatorComponent={() => (
                  <View style={[styles.sep, { backgroundColor: C.border }]} />
                )}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleExercisePress(String(item.id))}
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <Text style={[styles.rowTitle, { color: C.text }]}>{item.name}</Text>
                    <Ionicons name="chevron-forward" size={18} color={C.sub} />
                  </Pressable>
                )}
                contentContainerStyle={{ paddingBottom: 8 }}
              />
            )}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBlock: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: "hidden",
  },
  headerContent: {
    paddingBottom: 12,
  },
  headerControls: {
    paddingBottom: 6,
  },
  name: { fontSize: 20, marginBottom: 6, ...typography.body },
  email: { fontSize: 15, marginBottom: 2, ...typography.body },
  uid: { fontSize: 12, ...typography.body },

  bottom: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  tabRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabBtnActive: { borderWidth: 1 },
  tabText: { ...typography.body },
  tabTextActive: { color: "#fff" },
  tabBtnDisabled: { opacity: 0.5 },
  tabTextDisabled: { color: "#94A3B8" },
  tabTextDisabledOnHeader: { color: "rgba(255, 255, 255, 0.6)" },

  panel: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  panelHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  panelTitle: { fontSize: 15, ...typography.body },
  headerAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  headerActionPressed: { opacity: 0.7 },
  headerActionText: { fontSize: 12, ...typography.body },
  row: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowPressed: { opacity: 0.7 },
  rowTitle: { fontSize: 15, ...typography.body },
  sep: { height: 1, width: "92%", alignSelf: "center" },
  emptyWrap: { paddingHorizontal: 14, paddingVertical: 16 },
  emptyText: { fontSize: 14, fontStyle: "italic", ...typography.body },
});
