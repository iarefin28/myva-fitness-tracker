import React, { useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";

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
  onSelect
}) => {
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);

  const handleChange = (text: string) => {
    onChangeText(text);
    if (text.length > 0) {
      const filtered = EXERCISES_DB.filter(e =>
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
    <View style={{ marginBottom: 12 }}>
      <TextInput
        placeholder="e.g. Bench Press"
        placeholderTextColor="#888"
        value={value}
        onChangeText={handleChange}
        onSubmitEditing={() => {
          if (filteredExercises.length > 0) {
            handleSelect(filteredExercises[0]);
          }
        }}
        blurOnSubmit={true}
        style={{
          backgroundColor: "#3a3a3a",
          color: "white",
          borderRadius: 8,
          padding: 12
        }}
      />
      {filteredExercises.length > 0 && (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelect(item)}
              style={{
                padding: 10,
                backgroundColor: "#2a2a2a",
                borderRadius: 6,
                marginTop: 4
              }}
            >
              <Text style={{ color: "white" }}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default ExerciseAutocomplete;