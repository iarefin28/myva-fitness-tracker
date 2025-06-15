import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { EXERCISES_DB } from "../data/exerciseData";
import { EXERCISE_TYPE_MAP } from "../data/exerciseTypeMap";

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
        placeholder="Enter an exercise name"
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
    maxHeight: "80%",
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