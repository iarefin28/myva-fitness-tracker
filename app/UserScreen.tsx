import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Pressable,
} from "react-native";
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
  const exercisesById = useExerciseLibrary((s) => s.exercises);
  const ensureDefaults = useExerciseLibrary((s) => s.ensureDefaults);
  const [activeTab, setActiveTab] = useState<TopTab>("exercises");

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
      subText: isDark ? "#9ca3af" : "#64748B",
      border: isDark ? "#2a2a2a" : "#e5e5eb",
      tabBg: isDark ? "#111" : "#F1F5F9",
      accent: isDark ? "#0A84FF" : "#2563EB",
    }),
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <View style={[styles.top, { borderBottomColor: C.border }]}>
        <Text style={[styles.name, { color: C.text }]}>
          {user?.displayName || "No name"}
        </Text>
        <Text style={[styles.email, { color: C.sub }]}>
          {user?.email || "No email"}
        </Text>
        <Text style={[styles.uid, { color: C.sub }]}>
          uid: {user?.uid || "Unknown"}
        </Text>
      </View>

      <View style={styles.bottom}>
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
                  { backgroundColor: C.tabBg, borderColor: C.border },
                  isActive && [styles.tabBtnActive, { backgroundColor: C.accent, borderColor: C.accent }],
                  isDisabled && styles.tabBtnDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: C.subText },
                    isActive && styles.tabTextActive,
                    isDisabled && styles.tabTextDisabled,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  top: {
    flex: 0.2,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderBottomWidth: 1,
  },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 6, ...typography.body },
  email: { fontSize: 15, marginBottom: 2, ...typography.body },
  uid: { fontSize: 12, ...typography.body },

  bottom: {
    flex: 0.8,
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
  tabText: { fontWeight: "700", ...typography.button },
  tabTextActive: { color: "#fff" },
  tabBtnDisabled: { opacity: 0.5 },
  tabTextDisabled: { color: "#94A3B8" },
});
