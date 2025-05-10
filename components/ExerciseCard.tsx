import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Exercise } from "../types/workout";

interface Props {
    exercise: Exercise;
}

const ExerciseCard: React.FC<Props> = ({ exercise }) => {
    const [expanded, setExpanded] = useState(false);

    const totalSets = exercise.actions.filter(a => a.type === "set").length;
    const avgReps =
        Math.round(
            exercise.actions
                .filter(a => a.type === "set")
                .reduce((sum, a) => sum + Number(a.reps || 0), 0) / (totalSets || 1)
        ) || 0;

    return (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.card}>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.details}>Sets: {totalSets} | Avg Reps: {avgReps}</Text>

            {expanded && (
                <View style={styles.detailList}>
                    {exercise.actions.map((action, i) => (
                        <Text key={i} style={styles.action}>
                            {action.type === "set"
                                ? `Set #${action.setNumber}: ${action.weight}${action.unit} x ${action.reps} reps`
                                : `Rest #${action.restNumber}: ${action.value} ${action.unit}`}
                        </Text>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#2a2a2a",
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    name: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    details: {
        color: "#aaa",
        marginTop: 4,
    },
    detailList: {
        marginTop: 10,
    },
    action: {
        color: "white",
        fontSize: 14,
        marginBottom: 4,
    },
});

export default ExerciseCard;