import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Exercise } from "../types/workout";

interface Props {
    exercise: Exercise;
    onPress?: () => void;
}

// Helper to format seconds into "X minutes and Y seconds"
function secondsToReadableTime(sec: number): string {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    const parts = [];
    if (minutes > 0) parts.push(`${minutes} min${minutes !== 1 ? "s" : ""}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec${seconds !== 1 ? "s" : ""}`);
    return parts.join(" ");
}

// Color logic for RPE
const getRpeColor = (num: number): string => {
    if (num <= 2) return "#4da6ff";
    if (num <= 4) return "#70e000";
    if (num <= 6) return "#ffd700";
    if (num <= 8) return "#ff8800";
    return "#ff4d4d";
};

const ExerciseCard: React.FC<Props> = ({ exercise, onPress }) => {
    const [expanded, setExpanded] = useState(false);

    const totalSets = exercise.actions.filter((a) => a.type === "set").length;
    const avgReps =
        Math.round(
            exercise.actions
                .filter((a) => a.type === "set")
                .reduce((sum, a) => sum + Number(a.reps || 0), 0) / (totalSets || 1)
        ) || 0;

    const renderSetRestRows = () => {
        const rows = [];
        for (let i = 0; i < exercise.actions.length; i++) {
            const action = exercise.actions[i];
            if (action.type === "set") {
                const next = exercise.actions[i + 1];

                const restText =
                    next && next.type === "rest" && next.restInSeconds
                        ? `Rest: ${secondsToReadableTime(Number(next.restInSeconds))}`
                        : "No Rest";

                rows.push(
                    <View key={`set-${action.setNumber}`} style={styles.row}>
                        {/* Left: Set Info */}
                        <Text style={styles.setText}>
                            {action.isWarmup ? "Warm up:" : `Set #${action.setNumber}:`}{" "}
                            {(() => {
                                if (action.weight && action.value) {
                                    return `${action.weight} ${action.weightUnit} for ${action.value} ${action.valueUnit}`;
                                } else if (action.weight) {
                                    return `${action.weight} ${action.weightUnit} × ${action.reps || 0} reps`;
                                } else if (action.value) {
                                    return `${action.value} ${action.valueUnit}`;
                                } else {
                                    return `${action.reps || 0} reps`;
                                }
                            })()}
                        </Text>

                        {/* Right: Rest + RPE */}
                        <View style={styles.restRpeGroup}>
                            <Text style={styles.restText}>{restText}</Text>
                            {!action.isWarmup && action.RPE != null && (
                                <View style={[styles.rpeBadge, { backgroundColor: getRpeColor(action.RPE) }]}>
                                    <Text style={styles.rpeBadgeText}>RPE: {action.RPE}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                );

                if (next && next.type === "rest") i++; // skip rest next
            }
        }
        return rows;
    };

    return (
        <TouchableOpacity
            onPress={() => setExpanded(!expanded)}
            onLongPress={onPress}
            style={styles.card}
        >
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
        alignItems: "center",
        marginBottom: 6,
        flexWrap: "nowrap",
    },
    restRpeGroup: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 6,
        flexShrink: 0,
        flexGrow: 0,
    },

    rpeValue: {
        fontSize: 13,
        fontWeight: "bold",
    },
    setText: {
        color: "white",
        fontSize: 12.5,  // ⬇️ from 14
        flexShrink: 1,
        flexGrow: 1,
        paddingRight: 4,
    },

    restText: {
        color: "#1e90ff",
        fontSize: 11.5,  // ⬇️ from 13
    },

    rpeBadge: {
        paddingVertical: 2.5,     // tighter
        paddingHorizontal: 6,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },

    rpeBadgeText: {
        color: "#000",
        fontWeight: "bold",
        fontSize: 10.5,  // ⬇️ from 12
    },
});

export default ExerciseCard;
