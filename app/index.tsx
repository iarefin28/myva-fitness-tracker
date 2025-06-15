import { AntDesign } from "@expo/vector-icons";
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

interface Workout {
  id: number;
  name: string;
  exercises: any[];
  notes?: string;
  date: string;
}

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const scheme = useColorScheme();

  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
  const textColor = scheme === "dark" ? "#ffffff" : "#000000";
  const cardColor = scheme === "dark" ? "#1a1a1a" : "#ffffff";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Workout Log",
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/add-workout")}>
          <AntDesign name="plus" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const loadWorkouts = useCallback(async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem("savedWorkouts");
      if (storedWorkouts) {
        const parsedWorkouts: Workout[] = JSON.parse(storedWorkouts);
        const sorted = parsedWorkouts.sort((a, b) => b.id - a.id);
        setWorkouts(sorted);
      } else {
        setWorkouts([]);
      }
    } catch (error) {
      console.error("Failed to load workouts:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime()) ? "Unknown Date" : date.toLocaleDateString();
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor }}>
      {workouts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ fontSize: 18, color: textColor }}>No workouts available</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                globalThis.tempExercises = item.exercises;
                router.push("/exercise-log");
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
              <Text style={{ color: textColor, marginTop: 4 }}>
                {formatDate(item.date)}
              </Text>

              {!!item.notes?.trim() && (
                <Text style={{ color: "#888", fontStyle: "italic", marginTop: 6 }}>
                  “{item.notes.trim()}”
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
