// import { LinearGradient } from 'expo-linear-gradient';
// import { useRef, useState } from 'react';
// import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
// import ExportTemplatesButton from "../components/ExportTemplatesButton";

// // import { signOut } from 'firebase/auth';
// // import { auth } from '../FirebaseConfig';



// //for now treating the myva-insights screen as a debug screen

// export default function MyvaInsightsScreen() {
//   const [selectedPlan, setSelectedPlan] = useState<'pro' | 'proPlus'>('pro');
//   const swipeableRef = useRef(null);
//   const [cardVisible, setCardVisible] = useState(true);

//   const scheme = useColorScheme();
//   const isDark = scheme === "dark";

//   const backgroundColor = isDark ? "#0e0e0e" : "#ffffff";
//   const textColor = isDark ? "#ffffff" : "#000000";
//   const secondaryText = isDark ? "#cfcfcf" : "#444444";
//   const cardBg = isDark ? "#1a1a1a" : "#f2f2f2";
//   const dividerColor = isDark ? "#333" : "#ccc";
//   const toggleBg = isDark ? "#1a1a1a" : "#e8e8e8";



//   // async function signOutt() {
//   //   try { await signOut(auth); } catch { } // Gate sees user=null, flips back to AuthStack
//   // }
//   // signOutt()

//   const handleSwipeOpen = () => {
//     setCardVisible(false);
//   };

//   const renderRightActions = () => (
//     <TouchableOpacity
//       style={{
//         backgroundColor: 'red',
//         justifyContent: 'center',
//         alignItems: 'center',
//         width: 100,
//         height: '100%',
//         borderRadius: 16,
//       }}
//       onPress={() => setCardVisible(false)}
//     >
//       <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={[styles.container, { backgroundColor }]}>

//       {/* Full-Width Top Toggle */}
//       <View style={styles.topToggleContainer}>
//         <TouchableOpacity
//           style={[
//             styles.topToggleButton,
//             { backgroundColor: toggleBg },
//             selectedPlan === 'pro' && styles.topToggleSelectedLeft,
//           ]}
//           onPress={() => setSelectedPlan('pro')}
//         >
//           <Text style={styles.topToggleText}>Pro</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[
//             styles.topToggleButton,
//             { backgroundColor: toggleBg },
//             selectedPlan === 'proPlus' && styles.topToggleSelectedRight,
//           ]}
//           onPress={() => setSelectedPlan('proPlus')}
//         >
//           <Text style={styles.topToggleText}>Pro+</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Dynamic Gradient Card */}
//       {selectedPlan === 'pro' ? (
//         <LinearGradient
//           colors={['#00ffc6', '#003c33']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.proCard}
//         >
//           <Text style={styles.proText}>MYVA Pro</Text>
//           <Text style={styles.cardSubtitle}>
//             Get weekly insights & AI tips to optimize your training.
//           </Text>
//         </LinearGradient>
//       ) : (
//         <LinearGradient
//           colors={['#ffe566', '#aa5000']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.proCard}
//         >
//           <Text style={styles.proText}>MYVA Pro+</Text>
//           <Text style={styles.cardSubtitle}>
//             Unlock deep performance analytics, smart scheduling & elite coaching.
//           </Text>
//         </LinearGradient>
//       )}

//       {/* Description */}
//       <Text style={[styles.title, { color: textColor }]}>MYVA Insights</Text>
//       <Text style={[styles.description, { color: secondaryText }]}>
//         Powered by advanced AI, MYVA Insights is your personal fitness analyst. It studies your workouts, trends, and progress to offer:
//       </Text>

//       {/* Feature List */}
//       <View style={[styles.cardGroup, { backgroundColor: cardBg, borderColor: dividerColor }]}>
//         <View style={{ position: "absolute", right: 16, bottom: 24 }}>
//           <ExportTemplatesButton storageKey="savedTemplates" />
//         </View>

//         <View style={styles.infoCard}>
//           <Text style={[styles.cardText, { color: textColor }]}>Weekly performance breakdowns</Text>
//         </View>
//         <View style={[styles.divider, { backgroundColor: dividerColor }]} />
//         <View style={styles.infoCard}>
//           <Text style={[styles.cardText, { color: textColor }]}>Muscle group workload summaries</Text>
//         </View>
//         <View style={[styles.divider, { backgroundColor: dividerColor }]} />
//         <View style={styles.infoCard}>
//           <Text style={[styles.cardText, { color: textColor }]}>AI-generated recommendations</Text>
//         </View>
//         <View style={[styles.divider, { backgroundColor: dividerColor }]} />
//         <View style={styles.infoCard}>
//           <Text style={[styles.cardText, { color: textColor }]}>Recovery suggestions & volume warnings</Text>
//         </View>
//         <View style={[styles.divider, { backgroundColor: dividerColor }]} />
//         <View style={styles.infoCard}>
//           <Text style={[styles.cardText, { color: textColor }]}>Smart insights tailored to your goals</Text>
//         </View>
//       </View>

//       <Text style={styles.comingSoon}>
//         {selectedPlan === 'pro' ? 'Included in MYVA Pro 🚀' : 'Included in MYVA Pro+ 🔥'}
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#0e0e0e',
//     alignItems: 'center',
//   },
//   topToggleContainer: {
//     flexDirection: 'row',
//     width: '100%',
//     height: 50,
//   },
//   topToggleButton: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#1a1a1a',
//     borderBottomWidth: 1,
//     borderColor: '#333',
//   },
//   topToggleSelectedLeft: {
//     backgroundColor: '#00ffc6',
//   },
//   topToggleSelectedRight: {
//     backgroundColor: '#ffd700',
//   },
//   topToggleText: {
//     color: '#000',
//     fontSize: 16,
//     fontWeight: '700',
//   },
//   proCard: {
//     width: '95%',
//     height: 100,
//     borderRadius: 18,
//     marginTop: 30,
//     marginBottom: 20,
//     padding: 16,
//     justifyContent: 'space-between',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 8,
//   },
//   proText: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#fff', // 🔥 white text
//   },
//   cardSubtitle: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#fff', // 🔥 white text
//     opacity: 0.9,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#ffffff',
//     marginBottom: 12,
//   },
//   description: {
//     fontSize: 16,
//     textAlign: 'center',
//     color: '#cfcfcf',
//     marginHorizontal: 24,
//     marginBottom: 20,
//   },
//   bulletContainer: {
//     width: '100%',
//     paddingHorizontal: 24,
//     marginBottom: 30,
//   },
//   bullet: {
//     fontSize: 15,
//     color: '#b0f0e6',
//     marginVertical: 4,
//   },
//   comingSoon: {
//     fontSize: 16,
//     color: '#ffaa00',
//     fontWeight: '600',
//     marginTop: 30,
//   },
//   cardGroup: {
//     width: '92%',
//     backgroundColor: '#1a1a1a',
//     borderRadius: 16,
//     overflow: 'hidden',
//     marginBottom: 30,
//     borderColor: '#333',
//     borderWidth: 1,
//   },
//   infoCard: {
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#333',
//     marginHorizontal: 16,
//   },
//   cardText: {
//     color: '#ffffff',
//     fontSize: 15,
//     fontWeight: '500',
//   },
// });


// screens/myva-insights.tsx
import { listUserExercises } from "@/services/exerciseService";
import { signOut } from "firebase/auth";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { auth } from "../FirebaseConfig";
import { useAuth } from "../auth/AuthProvider";

// Minimal type shape for render (aligns with your service/types)
type UserExercise = {
  id: string;
  name: string;
  nameLower?: string;
  type?: string;
  createdAt?: number | null;
  usageCount?: number;
};

export default function MyvaInsightsScreen() {
  const { user, loading: authLoading } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [signingOut, setSigningOut] = useState(false);
  const [exLoading, setExLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [exercises, setExercises] = useState<UserExercise[]>([]);

  const C = useMemo(
    () => ({
      bg: isDark ? "#0b0b0b" : "#ffffff",
      text: isDark ? "#ffffff" : "#0b0b0b",
      sub: isDark ? "#bdbdbd" : "#4a4a4a",
      card: isDark ? "#141414" : "#f5f5f5",
      border: isDark ? "#242424" : "#e5e5e5",
      btn: isDark ? "#1e1e1e" : "#ececec",
      danger: "#ff4545",
      accent: isDark ? "#6ea8ff" : "#2f6fff",
      dim: isDark ? "#8a8a8a" : "#6b6b6b",
    }),
    [isDark]
  );

  const formatDate = (ts?: number | null) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleString();
    } catch {
      return "—";
    }
  };

  const fetchExercises = useCallback(
    async (why: "init" | "refresh" = "init") => {
      if (!user?.uid) return;
      why === "refresh" ? setRefreshing(true) : setExLoading(true);
      try {
        const list = (await listUserExercises(user.uid)) as UserExercise[]; // expects array
        // sort newest first by createdAt fallback name
        const sorted = [...(list ?? [])].sort((a, b) => {
          const A = a.createdAt ?? 0;
          const B = b.createdAt ?? 0;
          if (B !== A) return B - A;
          return (a.name ?? "").localeCompare(b.name ?? "");
        });
        setExercises(sorted);
      } catch (e: any) {
        Alert.alert("Couldn’t load exercises", e?.message ?? "Please try again.");
      } finally {
        why === "refresh" ? setRefreshing(false) : setExLoading(false);
      }
    },
    [user?.uid]
  );

  useEffect(() => {
    if (user?.uid) fetchExercises("init");
  }, [user?.uid, fetchExercises]);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut(auth);
    } catch (e: any) {
      Alert.alert("Sign out failed", e?.message ?? "Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  const renderExercise = ({ item }: { item: UserExercise }) => (
    <View style={[styles.row, { borderColor: C.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: C.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.rowSub, { color: C.sub }]} numberOfLines={1}>
          {item.type ?? "exercise"} · added {formatDate(item.createdAt)}
        </Text>
      </View>
      <View style={styles.usagePill}>
        <Text style={[styles.usageText, { color: C.text }]}>{item.usageCount ?? 0}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: C.text }]}>MYVA Hacks</Text>
          <Text style={[styles.subtitle, { color: C.sub }]}>
            Temp utilities while Insights is under construction
          </Text>
        </View>

        {/* AUTH CARD */}
        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.cardTitle, { color: C.text }]}>Auth</Text>
          {authLoading ? (
            <View style={styles.inline}>
              <ActivityIndicator />
              <Text style={[styles.mono, { color: C.sub, marginLeft: 8 }]}>Checking auth…</Text>
            </View>
          ) : user ? (
            <>
              <Text style={[styles.label, { color: C.sub }]}>Signed in as</Text>
              <Text style={[styles.value, { color: C.text }]}>
                {user.displayName ? `${user.displayName} · ` : ""}
                {user.email ?? "No email"}
              </Text>
              <Text style={[styles.mono, { color: C.dim, marginTop: 4 }]} numberOfLines={1}>
                uid: {user.uid}
              </Text>

              <TouchableOpacity
                disabled={signingOut}
                style={[
                  styles.button,
                  { backgroundColor: signingOut ? C.btn : C.danger, marginTop: 14 },
                ]}
                onPress={handleLogout}
                activeOpacity={0.85}
              >
                {signingOut ? (
                  <ActivityIndicator />
                ) : (
                  <Text style={[styles.buttonText, { color: "#fff" }]}>Log out</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={[styles.value, { color: C.text }]}>No user signed in.</Text>
          )}
        </View>

        {/* EXERCISES CARD */}
        <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={[styles.cardHeader]}>
            <Text style={[styles.cardTitle, { color: C.text }]}>Your Exercises</Text>
            <TouchableOpacity
              onPress={() => fetchExercises("refresh")}
              activeOpacity={0.7}
              style={[styles.smallBtn, { backgroundColor: C.btn }]}
            >
              <Text style={[styles.smallBtnText, { color: C.text }]}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {exLoading && !refreshing ? (
            <View style={[styles.center, { paddingVertical: 16 }]}>
              <ActivityIndicator />
              <Text style={[styles.mono, { color: C.sub, marginTop: 8 }]}>Loading…</Text>
            </View>
          ) : exercises.length === 0 ? (
            <Text style={[styles.value, { color: C.sub }]}>
              No custom exercises yet.
            </Text>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(it) => it.id}
              renderItem={renderExercise}
              ItemSeparatorComponent={() => <View style={[styles.sep, { borderColor: C.border }]} />}
              scrollEnabled={false}               // let outer ScrollView handle scroll
              contentContainerStyle={{ paddingTop: 6 }}
              ListFooterComponent={<View style={{ height: 8 }} />} // little breathing room
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.6 },
  value: { fontSize: 16, fontWeight: "600", marginTop: 4 },
  mono: { fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }), fontSize: 12 },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "700" },
  inline: { flexDirection: "row", alignItems: "center" },
  smallBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallBtnText: { fontSize: 12, fontWeight: "700" },
  center: { alignItems: "center", justifyContent: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0,
  },
  rowTitle: { fontSize: 15, fontWeight: "700" },
  rowSub: { fontSize: 12, marginTop: 2 },
  usagePill: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  usageText: { fontSize: 12, fontWeight: "700" },
  sep: { borderTopWidth: 1 },
});
