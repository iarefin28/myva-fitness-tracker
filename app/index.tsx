import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";


import {
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";


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

  const backgroundColor = scheme === "dark" ? "#000" : "#fff";
  const textColor = scheme === "dark" ? "#fff" : "#000";
  const cardColor = scheme === "dark" ? "#1e1e1e" : "#f2f2f2";
  const dividerColor = scheme === "dark" ? "#333" : "#ccc";

  const buttons = [
    {
      title: "View Completed Workouts",
      path: "/completed-workouts",
      icon: <MaterialIcons name="check-circle-outline" size={22} color={textColor} />,
    },
    {
      title: "View Upcoming Workouts",
      path: "/upcoming-workouts",
      icon: <Ionicons name="calendar-outline" size={22} color={textColor} />,
    },
    {
      title: "Saved Workout Templates",
      path: "/workout-templates",
      icon: <FontAwesome5 name="clipboard-list" size={20} color={textColor} />,
    },
  ];

  // Load workout data and compute this week's count
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

  // Helper: Count workouts in past 7 days
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
    if (count <= 1) return ["#ff5f6d", "#ffc371"];       // red-orange
    if (count === 2) return ["#ff8800", "#ffd700"];      // orange-yellow
    if (count === 3) return ["#ffd700", "#a0e426"];      // yellow-green
    if (count === 4) return ["#70e000", "#00c853"];      // lime to bright green
    if (count >= 5) return ["#00b894", "#00cec9"];       // emerald to teal
    return ["#666", "#999"]; // fallback gray
  }


  return (
    <View style={{ flex: 1, backgroundColor, padding: 24 }}>
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
        <Text
          style={{
            fontSize: 22,
            fontWeight: "600",
            color: textColor,
            marginRight: 6,
          }}
        >
          Today ·
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#888",
            fontWeight: "400",
          }}
        >
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

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
          <Text style={{
            color: "#fff",
            fontWeight: "bold",
            fontSize: 14,
          }}>
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
              <Text style={{ fontSize: 17, color: textColor }}>
                {buttons[idx].title}
              </Text>
            </View>

            {/* Divider */}
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
    </View>
  );
}
