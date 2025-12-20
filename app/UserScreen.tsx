import { signOut } from "firebase/auth";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthProvider";
import { auth, db } from "../FirebaseConfig";
import { useExerciseLibrary } from "@/store/exerciseLibrary";
import { useWorkoutStore } from "@/store/workoutStore";

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

export default function UserScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const exercisesById = useExerciseLibrary((s) => s.exercises);
  const ensureDefaults = useExerciseLibrary((s) => s.ensureDefaults);
  const clearHistory = useWorkoutStore((s) => s.clearHistory);

  const [signingOut, setSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<"friends" | "exercises" | "utilities">("friends");

  // —— SOCIAL STATE ——
  const [searchText, setSearchText] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const [friends, setFriends] = useState<string[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const C = {
    bg: isDark ? "#000" : "#fff",
    text: isDark ? "#fff" : "#0b0b0b",
    sub: isDark ? "#bdbdbd" : "#4a4a4a",
    bubble: isDark ? "#1a1a1a" : "#f3f4f6",
    border: isDark ? "#2a2a2a" : "#e5e5eb",
    btn: isDark ? "#2a2a2a" : "#e5e5e5",
    accent: isDark ? "#6ea8ff" : "#2f6fff",
    danger: "#ff4545",
  };

  useEffect(() => {
    ensureDefaults();
  }, [ensureDefaults]);

  const exercisesList = Object.values(exercisesById).sort((a: any, b: any) =>
    a.name.localeCompare(b.name)
  );

  const handleClearStorage = () => {
    Alert.alert(
      "Clear local storage?",
      "This will delete all locally saved data on this device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.clear();
            useExerciseLibrary.setState({ exercises: {}, byName: {}, ready: false });
            useWorkoutStore.setState({ draft: null, history: [] });
            Alert.alert("Cleared", "Local storage has been cleared.");
          },
        },
      ]
    );
  };

  const handleClearExerciseLibrary = () => {
    Alert.alert(
      "Clear exercise library?",
      "This will remove all exercises from local storage on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("myva_exercise_library_v1");
            useExerciseLibrary.setState({ exercises: {}, byName: {}, ready: false });
            ensureDefaults();
            Alert.alert("Cleared", "Exercise library reset to defaults.");
          },
        },
      ]
    );
  };

  const handleClearCompletedWorkouts = () => {
    Alert.alert(
      "Clear completed workouts?",
      "This will remove all completed workouts saved on this device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearHistory();
            Alert.alert("Cleared", "Completed workouts cleared.");
          },
        },
      ]
    );
  };

  const handleAddExercise = () => {
    navigation.navigate("addNewExercise", { addToDraft: "0" });
  };

  // Fetch YOUR user doc live so friends update automatically
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

  // Listen for incoming friend requests
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

  // Listen for outgoing friend requests
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

  // Load profiles of all your friends
  useEffect(() => {
    async function loadProfiles() {
      if (friends.length === 0) {
        setFriendProfiles([]);
        return;
      }

      const q = query(
        collection(db, "users"),
        where("uid", "in", friends.slice(0, 10)) // Firestore "in" max 10
      );

      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((d) => list.push(d.data()));
      setFriendProfiles(list);
    }

    loadProfiles();
  }, [friends]);

  // Search for other MYVA users
  const searchUsers = useCallback(async () => {
    if (!searchText.trim()) return;
    setSearching(true);

    const q = query(
      collection(db, "users"),
      where("displayName", ">=", searchText),
      where("displayName", "<=", searchText + "~")
    );

    const snap = await getDocs(q);
    const list: any[] = [];

    snap.forEach((d) => {
      if (d.id !== user?.uid) list.push(d.data());
    });

    setResults(list);
    setSearching(false);
  }, [searchText, user?.uid]);

  // Send friend request
  async function sendFriendRequest(target: any) {
    if (!user?.uid) return;
    const targetUid = target.uid as string;

    if (friends.includes(targetUid)) {
      alert("You are already friends.");
      return;
    }

    if (outgoingRequests.some((req) => req.toUid === targetUid)) {
      alert("Request already sent.");
      return;
    }

    const requestId = `${user.uid}_${targetUid}`;
    const batch = writeBatch(db);
    const now = serverTimestamp();

    const payload: FriendRequest = {
      id: requestId,
      fromUid: user.uid,
      toUid: targetUid,
      status: "pending",
      fromDisplayName: user.displayName ?? null,
      toDisplayName: target.displayName ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const outgoingRef = doc(
      db,
      "users",
      user.uid,
      "outgoingRequests",
      requestId
    );
    const incomingRef = doc(
      db,
      "users",
      targetUid,
      "incomingRequests",
      requestId
    );

    batch.set(outgoingRef, payload);
    batch.set(incomingRef, payload);

    await batch.commit();
    alert("Friend request sent!");
  }

  async function acceptFriendRequest(req: FriendRequest) {
    if (!user?.uid) return;

    const batch = writeBatch(db);
    const now = serverTimestamp();

    const incomingRef = doc(
      db,
      "users",
      user.uid,
      "incomingRequests",
      req.id
    );
    const outgoingRef = doc(
      db,
      "users",
      req.fromUid,
      "outgoingRequests",
      req.id
    );
    const myRef = doc(db, "users", user.uid);
    const otherRef = doc(db, "users", req.fromUid);

    batch.update(incomingRef, { status: "accepted", updatedAt: now });
    batch.update(outgoingRef, { status: "accepted", updatedAt: now });
    batch.update(myRef, { friends: arrayUnion(req.fromUid) });
    batch.update(otherRef, { friends: arrayUnion(user.uid) });

    await batch.commit();
    alert("Friend added!");
  }

  async function rejectFriendRequest(req: FriendRequest) {
    if (!user?.uid) return;
    const batch = writeBatch(db);
    const now = serverTimestamp();

    const incomingRef = doc(
      db,
      "users",
      user.uid,
      "incomingRequests",
      req.id
    );
    const outgoingRef = doc(
      db,
      "users",
      req.fromUid,
      "outgoingRequests",
      req.id
    );

    batch.update(incomingRef, { status: "rejected", updatedAt: now });
    batch.update(outgoingRef, { status: "rejected", updatedAt: now });

    await batch.commit();
  }

  async function cancelFriendRequest(req: FriendRequest) {
    if (!user?.uid) return;
    const batch = writeBatch(db);
    const now = serverTimestamp();

    const outgoingRef = doc(
      db,
      "users",
      user.uid,
      "outgoingRequests",
      req.id
    );
    const incomingRef = doc(
      db,
      "users",
      req.toUid,
      "incomingRequests",
      req.id
    );

    batch.update(outgoingRef, { status: "canceled", updatedAt: now });
    batch.update(incomingRef, { status: "canceled", updatedAt: now });

    await batch.commit();
  }

  // 🔥 Logout
  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut(auth);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ——————————————————————— */}
        {/*       PROFILE BUBBLE       */}
        {/* ——————————————————————— */}
        <View
          style={[
            styles.bubble,
            { backgroundColor: C.bubble, borderColor: C.border },
          ]}
        >
          <Text style={[styles.name, { color: C.text }]}>
            {user?.displayName || "No name"}
          </Text>

          <Text style={[styles.email, { color: C.sub }]}>{user?.email}</Text>

          <Text style={[styles.uid, { color: C.sub }]}>uid: {user?.uid}</Text>

          <TouchableOpacity
            onPress={handleLogout}
            disabled={signingOut}
            style={[
              styles.logoutBtn,
              { backgroundColor: signingOut ? C.btn : C.danger },
            ]}
          >
            {signingOut ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.logoutText}>Log Out</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ——————————————————————— */}
        {/*         SUB TABS           */}
        {/* ——————————————————————— */}
        <View style={styles.tabRow}>
          {[
            { key: "friends", label: "Friends" },
            { key: "exercises", label: "Exercises" },
            { key: "utilities", label: "Utilities" },
          ].map((t) => {
            const isActive = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key as any)}
                style={[
                  styles.tabChip,
                  {
                    backgroundColor: isActive ? C.accent : C.bubble,
                    borderColor: isActive ? C.accent : C.border,
                  },
                ]}
              >
                <Text style={[styles.tabText, { color: isActive ? "#fff" : C.text }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ——————————————————————— */}
        {/*         FIND FRIENDS       */}
        {/* ——————————————————————— */}
        {activeTab === "friends" && (
          <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            Find Friends
          </Text>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: C.bubble, color: C.text, borderColor: C.border },
            ]}
            placeholder="Search by name…"
            placeholderTextColor={C.sub}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={searchUsers}
          />

          {searching ? (
            <ActivityIndicator style={{ marginTop: 12 }} />
          ) : (
            results.map((u) => (
              (() => {
                const isFriend = friends.includes(u.uid);
                const isRequested = outgoingRequests.some(
                  (req) => req.toUid === u.uid
                );
                const label = isFriend
                  ? "Friends"
                  : isRequested
                  ? "Requested"
                  : "Add Friend";

                return (
                  <View
                    key={u.uid}
                    style={[
                      styles.resultRow,
                      { backgroundColor: C.bubble, borderColor: C.border },
                    ]}
                  >
                    <Text style={[styles.resultName, { color: C.text }]}>
                      {u.displayName}
                    </Text>

                    <TouchableOpacity
                      onPress={() => sendFriendRequest(u)}
                      disabled={isFriend || isRequested}
                      style={[
                        styles.addBtn,
                        {
                          backgroundColor: isFriend
                            ? C.border
                            : isRequested
                            ? C.btn
                            : C.accent,
                        },
                      ]}
                    >
                      <Text style={{ color: "#fff", fontWeight: "700" }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()
            ))
          )}
          </View>
        )}

        {/* ——————————————————————— */}
        {/*     INCOMING REQUESTS     */}
        {/* ——————————————————————— */}
        {activeTab === "friends" && (
          <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            Incoming Requests
          </Text>

          {incomingRequests.length === 0 ? (
            <Text style={[styles.emptyText, { color: C.sub }]}>
              No incoming requests.
            </Text>
          ) : (
            incomingRequests.map((req) => (
              <View
                key={req.id}
                style={[
                  styles.resultRow,
                  { backgroundColor: C.bubble, borderColor: C.border },
                ]}
              >
                <Text style={[styles.resultName, { color: C.text }]}>
                  {req.fromDisplayName ?? req.fromUid}
                </Text>

                <View style={{ flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={() => acceptFriendRequest(req)}
                    style={[
                      styles.addBtn,
                      { backgroundColor: C.accent, marginRight: 8 },
                    ]}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Accept
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => rejectFriendRequest(req)}
                    style={[styles.addBtn, { backgroundColor: C.btn }]}
                  >
                    <Text style={{ color: "#fff", fontWeight: "700" }}>
                      Reject
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          </View>
        )}

        {/* ——————————————————————— */}
        {/*     OUTGOING REQUESTS     */}
        {/* ——————————————————————— */}
        {activeTab === "friends" && (
          <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            Outgoing Requests
          </Text>

          {outgoingRequests.length === 0 ? (
            <Text style={[styles.emptyText, { color: C.sub }]}>
              No outgoing requests.
            </Text>
          ) : (
            outgoingRequests.map((req) => (
              <View
                key={req.id}
                style={[
                  styles.resultRow,
                  { backgroundColor: C.bubble, borderColor: C.border },
                ]}
              >
                <Text style={[styles.resultName, { color: C.text }]}>
                  {req.toDisplayName ?? req.toUid}
                </Text>

                <TouchableOpacity
                  onPress={() => cancelFriendRequest(req)}
                  style={[styles.addBtn, { backgroundColor: C.btn }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          </View>
        )}

        {/* ——————————————————————— */}
        {/*         FRIEND LIST        */}
        {/* ——————————————————————— */}
        {activeTab === "friends" && (
          <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            Your Friends
          </Text>

          {friendProfiles.length === 0 ? (
            <Text style={[styles.emptyText, { color: C.sub }]}>
              No friends yet.
            </Text>
          ) : (
            <FlatList
              data={friendProfiles}
              keyExtractor={(item) => item.uid}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.friendRow,
                    { backgroundColor: C.bubble, borderColor: C.border },
                  ]}
                >
                  <Text style={[styles.resultName, { color: C.text }]}>
                    {item.displayName}
                  </Text>
                </View>
              )}
            />
          )}
          </View>
        )}

        {/* ——————————————————————— */}
        {/*       EXERCISE LIBRARY     */}
        {/* ——————————————————————— */}
        {activeTab === "exercises" && (
          <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.text }]}>
            Your Exercises ({exercisesList.length})
          </Text>

          <View style={styles.exerciseActions}>
            <TouchableOpacity
              onPress={handleAddExercise}
              style={[
                styles.addExerciseBtn,
                { backgroundColor: C.accent, borderColor: C.accent },
              ]}
            >
              <Text style={styles.addExerciseBtnText}>Add New Exercise</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearExerciseLibrary}
              style={[
                styles.secondaryBtn,
                { backgroundColor: C.danger, borderColor: C.danger },
              ]}
            >
              <Text style={styles.clearBtnText}>Clear Exercise Library</Text>
            </TouchableOpacity>
          </View>

          {exercisesList.length === 0 ? (
            <Text style={[styles.emptyText, { color: C.sub }]}>
              No exercises found.
            </Text>
          ) : (
            exercisesList.map((ex: any) => (
              <Pressable
                key={ex.id}
                onLongPress={() =>
                  navigation.navigate("exercise-detail", { exerciseId: ex.id })
                }
                style={[
                  styles.resultRow,
                  { backgroundColor: C.bubble, borderColor: C.border },
                ]}
              >
                <Text style={[styles.resultName, { color: C.text }]}>
                  {ex.name}
                </Text>
                <Text style={{ color: C.sub, fontSize: 12 }}>{ex.type}</Text>
              </Pressable>
            ))
          )}
          </View>
        )}

        {/* ——————————————————————— */}
        {/*          UTILITIES         */}
        {/* ——————————————————————— */}
        {activeTab === "utilities" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: C.text }]}>
              Utilities
            </Text>

            <View style={styles.resetActions}>
              <TouchableOpacity
                onPress={handleClearCompletedWorkouts}
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: C.btn, borderColor: C.border },
                ]}
              >
                <Text style={[styles.clearBtnText, { color: C.text }]}>
                  Clear Completed Workouts
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClearStorage}
                style={[
                  styles.secondaryBtn,
                  { backgroundColor: C.danger, borderColor: C.danger },
                ]}
              >
                <Text style={styles.clearBtnText}>Clear Async Storage</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },

  // —— PROFILE BUBBLE ——
  bubble: {
    marginTop: 20,
    width: "92%",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    alignSelf: "center",
    alignItems: "center",
  },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  email: { fontSize: 15, marginBottom: 2 },
  uid: { fontSize: 11, marginBottom: 12 },

  logoutBtn: {
    paddingVertical: 10,
    borderRadius: 12,
    width: "55%",
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "700" },

  // —— SECTIONS ——
  section: { marginTop: 32 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },

  // —— SUB TABS ——
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  tabText: { fontWeight: "700", fontSize: 14 },

  input: {
    width: "100%",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },

  // —— SEARCH RESULTS ——
  resultRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultName: { fontSize: 16, fontWeight: "600" },
  addBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },

  // —— FRIEND LIST ——
  friendRow: {
    padding: 12,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
  },

  emptyText: {
    fontSize: 14,
    marginTop: 6,
    fontStyle: "italic",
  },

  exerciseActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  resetActions: {
    marginTop: 12,
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  clearBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },

  addExerciseBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  addExerciseBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
});
