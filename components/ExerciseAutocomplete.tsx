import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const EXERCISES_DB = [
  // Upper Body - Push
  "Bench Press",
  "Incline Bench Press",
  "Decline Bench Press",
  "Push Ups",
  "Overhead Press",
  "Dumbbell Shoulder Press",
  "Arnold Press",
  "Lateral Raises",
  "Front Raises",
  "Cable Chest Fly",
  "Chest Dips",
  "Tricep Pushdown",
  "Skull Crushers",
  "Close Grip Bench Press",
  "Machine Chest Press",

  // Upper Body - Pull
  "Pull Ups",
  "Chin Ups",
  "Lat Pulldown",
  "Seated Row",
  "Dumbbell Row",
  "Barbell Row",
  "T-Bar Row",
  "Face Pulls",
  "Rear Delt Fly",
  "Shrugs",
  "Deadlift",
  "Trap Bar Deadlift",
  "Rack Pull",
  "Cable Row",
  "Reverse Fly",

  // Legs
  "Squat",
  "Front Squat",
  "Bulgarian Split Squat",
  "Walking Lunges",
  "Reverse Lunges",
  "Leg Press",
  "Romanian Deadlift",
  "Hamstring Curl",
  "Leg Extension",
  "Step Ups",
  "Hip Thrust",
  "Glute Bridge",
  "Calf Raises",
  "Box Jumps",
  "Goblet Squat",

  // Core
  "Plank",
  "Side Plank",
  "Sit Ups",
  "Crunches",
  "Russian Twists",
  "Hanging Leg Raise",
  "Cable Woodchopper",
  "V-Ups",
  "Mountain Climbers",
  "Toe Touches",
  "Ab Rollout",
  "Flutter Kicks",
  "Bicycle Crunches",

  // Functional / Carries / Cardio
  "Farmer's Carry",
  "Kettlebell Swing",
  "Battle Ropes",
  "Sled Push",
  "Sled Pull",
  "Jump Rope",
  "Burpees",
  "Bear Crawl",
  "Medicine Ball Slam",
  "Boxing Shadow Drill",

  // Bodyweight / Mobility
  "Bodyweight Squat",
  "Wall Sit",
  "Superman Hold",
  "Hollow Body Hold",
  "Handstand Hold",
  "Pistol Squat",
  "Inchworm Stretch",
  "World’s Greatest Stretch",
  "Cossack Squat"
];

interface ExerciseAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (exercise: string) => void;
}

const ExerciseAutocomplete: React.FC<ExerciseAutocompleteProps> = ({
  value,
  onChangeText,
  onSelect,
}) => {
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);

  const handleChange = (text: string) => {
    onChangeText(text);
    if (text.length > 0) {
      const filtered = EXERCISES_DB.filter((e) =>
        e.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredExercises(filtered);
    } else {
      setFilteredExercises([]);
    }
  };

  const handleSelect = (exercise: string) => {
    onSelect(exercise);
    setFilteredExercises([]);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Select an exercise"
        placeholderTextColor="#ccc"
        value={value}
        onChangeText={handleChange}
        onSubmitEditing={() => {
          if (filteredExercises.length > 0) {
            handleSelect(filteredExercises[0]);
          }
        }}
        blurOnSubmit={true}
        style={styles.input}
      />
      {filteredExercises.length > 0 && (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item}
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              style={styles.dropdownItem}
            >
              <Text style={styles.dropdownText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#1e1e1e",
    color: "white",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "400",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 6,
  },
  dropdown: {
    marginTop: 8,
    backgroundColor: "#1b1b1b",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomColor: "#2c2c2c",
    borderBottomWidth: 0.5,
  },
  dropdownText: {
    color: "#eaeaea",
    fontSize: 15,
  },
});

export default ExerciseAutocomplete;