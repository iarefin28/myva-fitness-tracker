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
  "Pull Ups (Weighted)",
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
  "Farmer's Carry (Time)",
  "Farmer's Carry (Distance)",
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

const EXERCISE_TYPE_MAP: Record<string, "bodyweight" | "weighted" | "duration" | "weighted duration" | "weighted distance"> = {
  // Upper Body - Push
  "Bench Press": "weighted",
  "Incline Bench Press": "weighted",
  "Decline Bench Press": "weighted",
  "Push Ups": "bodyweight",
  "Overhead Press": "weighted",
  "Dumbbell Shoulder Press": "weighted",
  "Arnold Press": "weighted",
  "Lateral Raises": "weighted",
  "Front Raises": "weighted",
  "Cable Chest Fly": "weighted",
  "Chest Dips": "bodyweight",
  "Tricep Pushdown": "weighted",
  "Skull Crushers": "weighted",
  "Close Grip Bench Press": "weighted",
  "Machine Chest Press": "weighted",

  // Upper Body - Pull
  "Pull Ups": "bodyweight",
  "Pull Ups (Weighted)": "weighted",
  "Chin Ups": "bodyweight",
  "Lat Pulldown": "weighted",
  "Seated Row": "weighted",
  "Dumbbell Row": "weighted",
  "Barbell Row": "weighted",
  "T-Bar Row": "weighted",
  "Face Pulls": "weighted",
  "Rear Delt Fly": "weighted",
  "Shrugs": "weighted",
  "Deadlift": "weighted",
  "Trap Bar Deadlift": "weighted",
  "Rack Pull": "weighted",
  "Cable Row": "weighted",
  "Reverse Fly": "weighted",

  // Legs
  "Squat": "weighted",
  "Front Squat": "weighted",
  "Bulgarian Split Squat": "weighted",
  "Walking Lunges": "weighted",
  "Reverse Lunges": "weighted",
  "Leg Press": "weighted",
  "Romanian Deadlift": "weighted",
  "Hamstring Curl": "weighted",
  "Leg Extension": "weighted",
  "Step Ups": "weighted",
  "Hip Thrust": "weighted",
  "Glute Bridge": "bodyweight",
  "Calf Raises": "weighted",
  "Box Jumps": "bodyweight",
  "Goblet Squat": "weighted",

  // Core
  "Plank": "duration",
  "Side Plank": "duration",
  "Sit Ups": "bodyweight",
  "Crunches": "bodyweight",
  "Russian Twists": "bodyweight",
  "Hanging Leg Raise": "bodyweight",
  "Cable Woodchopper": "weighted",
  "V-Ups": "bodyweight",
  "Mountain Climbers": "duration",
  "Toe Touches": "bodyweight",
  "Ab Rollout": "weighted",
  "Flutter Kicks": "duration",
  "Bicycle Crunches": "bodyweight",

  // Functional / Carries / Cardio
  "Farmer's Carry (Time)": "weighted duration",
  "Farmer's Carry (Distance)": "weighted distance",
  "Kettlebell Swing": "weighted",
  "Battle Ropes": "duration",
  "Sled Push": "duration",
  "Sled Pull": "duration",
  "Jump Rope": "duration",
  "Burpees": "bodyweight",
  "Bear Crawl": "duration",
  "Medicine Ball Slam": "weighted",
  "Boxing Shadow Drill": "duration",

  // Bodyweight / Mobility
  "Bodyweight Squat": "bodyweight",
  "Wall Sit": "duration",
  "Superman Hold": "duration",
  "Hollow Body Hold": "duration",
  "Handstand Hold": "duration",
  "Pistol Squat": "bodyweight",
  "Inchworm Stretch": "duration",
  "World’s Greatest Stretch": "duration",
  "Cossack Squat": "bodyweight"
};

interface ExerciseAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (exercise: string, type: "bodyweight" | "weighted" | "duration" | "unknown" | "weighted distance" | "weighted duration") => void;
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
    const type = EXERCISE_TYPE_MAP[exercise] || "unknown";
    onSelect(exercise, type);
    setFilteredExercises([]);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="e.g. Bench Press"
        placeholderTextColor="#aaa"
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
    backgroundColor: "#2d2d2d",
    color: "white",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "500",
    borderColor: "#444",
    borderWidth: 1,
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 10,
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomColor: "#444",
    borderBottomWidth: 0.5,
  },
  dropdownText: {
    color: "white",
    fontSize: 14,
    fontWeight: "400",
  },
});

export default ExerciseAutocomplete;