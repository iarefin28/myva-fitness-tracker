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

    const renderSetRestRows = () => {
        const rows = [];
        for (let i = 0; i < exercise.actions.length; i++) {
            const action = exercise.actions[i];
            if (action.type === "set") {
                const next = exercise.actions[i + 1];
                const restText = next && next.type === "rest"
                    ? `Rest: ${next.value || 0} ${next.unit}`
                    : "No Rest";

                rows.push(
                    <View key={`set-${action.setNumber}`} style={styles.row}>
                        <Text style={styles.setText}>
                            Set #{action.setNumber}:{' '}
                            {(() => {
                                if (action.weight && action.value) {
                                    // Weighted + Duration or Distance
                                    return `${action.weight} ${action.weightUnit} for ${action.value} ${action.valueUnit}`;
                                } else if (action.weight) {
                                    // Weighted only
                                    return `${action.weight} ${action.weightUnit} × ${action.reps || 0} reps`;
                                } else if (action.value) {
                                    // Duration or Distance only
                                    return `${action.value} ${action.valueUnit}`;
                                } else {
                                    // Bodyweight
                                    return `${action.reps || 0} reps`;
                                }
                            })()}
                        </Text>
                        <Text style={styles.restText}>{restText}</Text>
                    </View>
                );

                // Skip the rest in the next loop iteration if it was paired
                if (next && next.type === "rest") i++;
            }
        }
        return rows;
    };

    return (
        <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.card}>
            <Text style={styles.name}>{exercise.name}</Text>
            <Text style={styles.details}>Sets: {totalSets} | Avg Reps: {avgReps}</Text>

            {expanded && <View style={styles.detailList}>{renderSetRestRows()}</View>}
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
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    setText: {
        color: "white",
        fontSize: 14,
        flex: 1,
    },
    restText: {
        color: "#1e90ff",
        fontSize: 14,
        flex: 1,
        textAlign: "right",
    },
});

export default ExerciseCard;