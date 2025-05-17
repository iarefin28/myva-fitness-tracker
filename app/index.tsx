import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useLayoutEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, useColorScheme, View } from "react-native";


interface Workout {
  id: number;
  workoutName: string;
  exercises: string[];
  notes?: string;
  date: string;
}

export default function Index() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);

  const scheme = useColorScheme();
  const backgroundColor = scheme === "dark" ? "#000000" : "#ffffff";
  const textColor = scheme === "dark" ? "#ffffff" : "#000000";
  const cardColor = scheme === "dark" ? "#1a1a1a" : "#ffffff";
  const buttonColor = scheme === "dark" ? "#1e90ff" : "#007bff";

  const navigation = useNavigation();
  const { colors } = useTheme();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Workout Log',
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push("/add-workout")} style={{paddingRight: 15}}>
          <AntDesign name="plus" size={20} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const loadWorkouts = useCallback(async () => {
    try {
      const storedWorkouts = await AsyncStorage.getItem("workouts");
      if (storedWorkouts) {
        const parsedWorkouts: Workout[] = JSON.parse(storedWorkouts);
        const sortedWorkouts = parsedWorkouts.sort((a, b) => b.id - a.id);
        setWorkouts(sortedWorkouts);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Unknown Date";
    return date.toLocaleDateString();
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
            <View
              style={{
                backgroundColor: cardColor,
                padding: 20,
                marginBottom: 15,
                borderRadius: 12,
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold", color: textColor }}>{item.workoutName}</Text>
              <Text style={{ color: textColor, marginTop: 5, marginBottom: 10 }}>{formatDate(item.date)}</Text>
              {Array.isArray(item.exercises) && item.exercises.map((exercise, idx) => (
                <Text key={idx.toString()} style={{ color: textColor, marginLeft: 10 }}>• {exercise}</Text>
              ))}
              {!!item.notes && item.notes.trim().length > 0 && (
                <Text style={{ color: textColor, marginTop: 10, fontStyle: "italic" }}>
                  "{item.notes}"
                </Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}