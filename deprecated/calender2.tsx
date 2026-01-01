//This component is unused. Has a calendar set up that only shows one month. Performance wise it is much faster. 

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";

export default function CalendarScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState("");
  const [savedWorkouts, setSavedWorkouts] = useState<any[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const stored = await AsyncStorage.getItem("savedWorkouts");
        if (stored) {
          setSavedWorkouts(JSON.parse(stored));
        }
      } catch (e) {
        console.error("❌ Failed to load workouts:", e);
      }
    };

    loadWorkouts();
  }, []);

  const markedDates: Record<string, any> = {};
  savedWorkouts.forEach((workout) => {
    const date = workout.date?.split("T")[0];
    if (!date) return;

    if (!selectedMuscleGroup || workout.name?.toLowerCase().includes(selectedMuscleGroup.toLowerCase())) {
      markedDates[date] = {
        selected: true,
        selectedColor: "#ff6f61",
        selectedTextColor: "#fff",
      };
    }
  });

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: "#00adf5",
      selectedTextColor: "#ffffff",
    };
  }

  const workoutsOnSelectedDate = savedWorkouts.filter(
    (w) => w.date?.split("T")[0] === selectedDate
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#000" : "#fff" }}>
      <Calendar
        style={styles.calendar}
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        theme={{
          calendarBackground: isDark ? "#000" : "#fff",
          dayTextColor: isDark ? "#fff" : "#000",
          monthTextColor: isDark ? "#fff" : "#000",
          arrowColor: isDark ? "#fff" : "#000",
          todayTextColor: "#00adf5",
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollView}>
        {selectedDate ? (
          <>
            <Text style={styles.selectedDateFormatted}>{formatDate(selectedDate)}</Text>

            {workoutsOnSelectedDate.length === 0 ? (
              <Text style={styles.selectedText}>No workouts found for this date.</Text>
            ) : (
              workoutsOnSelectedDate.map((workout, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.workoutCard}
                  onPress={() => {
                    globalThis.tempExercises = workout.exercises;
                    router.push("/exercise-log");
                  }}
                >
                  <Text style={styles.workoutText}>{workout.name}</Text>
                  {!!workout.notes?.trim() && (
                    <Text style={styles.workoutNotes}>“{workout.notes.trim()}”</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        ) : (
          <Text style={styles.selectedText}>Select a date to view workouts</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  scrollView: {
    padding: 16,
  },
  selectedDateFormatted: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#ff6f61",
  },
  selectedText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  workoutCard: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  workoutText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  workoutNotes: {
    color: "#ccc",
    marginTop: 6,
    fontStyle: "italic",
  },
});
