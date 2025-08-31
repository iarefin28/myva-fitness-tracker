import React, { useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { EXERCISES_DB } from "../data/exerciseData";
import { EXERCISE_TYPE_MAP } from "../data/exerciseTypeMap";

interface ExerciseAutocompleteProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (
    exercise: string,
    type:
      | "bodyweight"
      | "weighted"
      | "duration"
      | "unknown"
      | "weighted distance"
      | "weighted duration"
  ) => void;
}

const ExerciseAutocomplete: React.FC<ExerciseAutocompleteProps> = ({
  value,
  onChangeText,
  onSelect,
}) => {
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

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
    onChangeText(exercise);
    onSelect(exercise, type);
    setFilteredExercises([]);
  };

  const styles = {
    container: {
      marginBottom: 12,
    },
    input: {
      backgroundColor: isDark ? "#2d2d2d" : "#f0f0f0",
      color: isDark ? "#fff" : "#000",
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      fontSize: 15,
      fontWeight: "500" as const,
      borderColor: isDark ? "#444" : "#ccc",
      borderWidth: 1,
    },
    dropdown: {
      marginTop: 6,
      backgroundColor: isDark ? "#2a2a2a" : "#fff",
      borderRadius: 10,
      paddingVertical: 4,
      maxHeight: "80%",
      borderColor: isDark ? "#444" : "#ccc",
      borderWidth: 1,
    },
    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderBottomColor: isDark ? "#444" : "#ddd",
      borderBottomWidth: 0.5,
    },
    dropdownText: {
      color: isDark ? "#fff" : "#000",
      fontSize: 14,
      fontWeight: "400" as const,
    },
    placeholderColor: isDark ? "#aaa" : "#666",
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter an exercise name"
        placeholderTextColor={styles.placeholderColor}
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

export default ExerciseAutocomplete;
