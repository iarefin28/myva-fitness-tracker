import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { CalendarList, DateObject } from "react-native-calendars";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toLocaleDateString('en-CA')
  );
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [savedWorkouts, setSavedWorkouts] = useState<any[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<any[]>([]);


  const navigation = useNavigation();
  const router = useRouter();

  const filterOptions = ['Back', 'Chest', 'Legs', 'Push', 'Pull'];

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Calendar',
      headerRight: () => (
        <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
          <Ionicons name="filter" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const saved = await AsyncStorage.getItem("savedWorkouts");
        const scheduled = await AsyncStorage.getItem("scheduledWorkouts");

        if (saved) setSavedWorkouts(JSON.parse(saved));
        if (scheduled) setScheduledWorkouts(JSON.parse(scheduled));
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

    if (
      !selectedMuscleGroup ||
      workout.name?.toLowerCase().includes(selectedMuscleGroup.toLowerCase())
    ) {
      markedDates[date] = {
        ...(markedDates[date] || {}),
        marked: true,
        dotColor: "#ff6f61", // 🔴 red for completed
      };
    }
  });

  // Mark scheduled workouts (upcoming)
  scheduledWorkouts.forEach((workout) => {
    const date = workout.scheduledFor?.split("T")[0];
    if (!date) return;

    markedDates[date] = {
      ...(markedDates[date] || {}),
      marked: true,
      dotColor: markedDates[date]?.dotColor === "#ff6f61" ? "#00ffcc" : "#00adf5", // 🔵 blue-green if not both
    };
  });

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: "#00adf5",
      selectedTextColor: "#ffffff",
    };
  }

  const completed = savedWorkouts.filter(
    (w) => w.date?.split("T")[0] === selectedDate
  );

  const upcoming = scheduledWorkouts.filter(
    (w) => w.scheduledFor?.split("T")[0] === selectedDate
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Calendar Section */}
      <View style={styles.calendarContainer}>
        <CalendarList
          horizontal={false}
          pagingEnabled={false}
          pastScrollRange={1}
          futureScrollRange={1}
          hideExtraDays={true}
          scrollEnabled={true}
          showScrollIndicator={false}
          onDayPress={(day: DateObject) => setSelectedDate(day.dateString)}
          markedDates={markedDates}
          theme={{
            backgroundColor: '#000000',
            calendarBackground: '#000000',
            dayTextColor: '#ffffff',
            monthTextColor: '#ffffff',
            arrowColor: '#ffffff',
          }}
        />
      </View>

      {/* Workout Display Section */}
      <View style={styles.bottomHalf}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {completed.length > 0 && (
            <>
              <Text style={styles.selectedText}>Completed Workouts</Text>
              {completed.map((workout, index) => (
                <TouchableOpacity
                  key={`c-${index}`}
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
              ))}
            </>
          )}

          {upcoming.length > 0 && (
            <>
              <Text style={styles.selectedText}>Upcoming Workouts</Text>
              {upcoming.map((workout, index) => (
                <TouchableOpacity
                  key={`u-${index}`}
                  style={styles.workoutCard}
                  onPress={() => {
                    router.push(`/add-workout?mode=live&templateId=${workout.templateId}`);
                  }}
                >
                  <Text style={styles.workoutText}>{workout.name}</Text>
                  <Text style={styles.workoutNotes}>
                    Scheduled for {new Date(workout.scheduledFor).toLocaleTimeString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      </View>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Muscle Group</Text>
            <FlatList
              data={filterOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.filterOption}
                  onPress={() => {
                    setSelectedMuscleGroup(item === selectedMuscleGroup ? null : item);
                    setFilterModalVisible(false);
                  }}
                >
                  <Text style={styles.filterText}>
                    {item} {item === selectedMuscleGroup ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  calendarContainer: { flex: 1, paddingTop: 10 },
  bottomHalf: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  scrollContainer: { padding: 16 },
  selectedDateFormatted: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'left',
  },
  selectedText: {
    color: '#aaa',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: "#2e2e2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  workoutText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  workoutNotes: { color: "#ccc", marginTop: 6, fontStyle: "italic" },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    marginHorizontal: 32,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { color: 'white', fontSize: 18, marginBottom: 12 },
  filterOption: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  filterText: { color: '#fff', fontSize: 16 },
});
