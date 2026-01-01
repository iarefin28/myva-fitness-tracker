import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import {
    FlatList,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";

interface ScheduledWorkout {
  id: number;
  name: string;
  scheduledFor: string;
  exercises: any[];
  templateId: number;
  status: string;
}

export default function UpcomingWorkouts() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const scheme = useColorScheme();

  const [workouts, setWorkouts] = useState<ScheduledWorkout[]>([]);

  const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
  const textColor = scheme === "dark" ? "#ffffff" : "#000000";
  const cardColor = scheme === "dark" ? "#1a1a1a" : "#ffffff";

  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Upcoming Workouts",
    });
  }, [navigation]);

  const loadScheduledWorkouts = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("scheduledWorkouts");
      if (stored) {
        const parsed: ScheduledWorkout[] = JSON.parse(stored);
        const sorted = parsed
          .filter((w) => w.status === "pending")
          .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

        setWorkouts(sorted);
      } else {
        setWorkouts([]);
      }
    } catch (error) {
      console.error("❌ Failed to load scheduled workouts:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadScheduledWorkouts();
    }, [loadScheduledWorkouts])
  );

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? "Unknown Date" : date.toLocaleString();
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor }}>
      {workouts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: textColor }}>No upcoming workouts</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                router.push(`/add-workout?mode=live&templateId=${item.templateId}`);
              }}
              style={{
                backgroundColor: cardColor,
                padding: 16,
                borderRadius: 12,
                marginBottom: 15,
                elevation: 3,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor }}>
                {item.name}
              </Text>
              <Text style={{ color: textColor, marginTop: 6 }}>
                Scheduled For: {formatDate(item.scheduledFor)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
