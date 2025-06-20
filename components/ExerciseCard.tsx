import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { Exercise } from "../types/workout";

interface Props {
    exercise: Exercise;
    onPress?: () => void;
    defaultExpanded?: boolean;
    disableToggle?: boolean;
}

function secondsToReadableTime(sec: number): string {
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    const parts = [];
    if (minutes > 0) parts.push(`${minutes} min${minutes !== 1 ? "s" : ""}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} sec${seconds !== 1 ? "s" : ""}`);
    return parts.join(" ");
}

const getRpeColor = (num: number): string => {
    if (num <= 2) return "#4da6ff";
    if (num <= 4) return "#70e000";
    if (num <= 6) return "#ffd700";
    if (num <= 8) return "#ff8800";
    return "#ff4d4d";
};

const ExerciseCard: React.FC<Props> = ({ exercise, onPress, defaultExpanded = false, disableToggle = false }) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

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

                let restText = "Rest: Not tracked";
                if (next && next.type === "rest") {
                    restText = Number(next.restInSeconds)
                        ? `Rest: ${secondsToReadableTime(Number(next.restInSeconds))}`
                        : "No Rest";
                }

                rows.push(
                    <View key={`set-${action.setNumber}`} style={styles.row}>
                        <View style={styles.setTextContainer}>
                            <Text style={styles.setText}>
                                {action.isWarmup ? "W. Up:" : `Set #${action.setNumber}:`}{" "}
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
                        </View>

                        <View style={styles.restContainer}>
                            {restText && (
                                <Text style={styles.restText}>{restText}</Text>
                            )}
                        </View>

                        <View style={styles.rpeBadgeContainer}>
                            {!action.isWarmup && (
                                <View
                                    style={[
                                        styles.rpeBadge,
                                        {
                                            backgroundColor: Number(action.RPE) > 0
                                                ? getRpeColor(Number(action.RPE))
                                                : "transparent",
                                            opacity: Number(action.RPE) > 0 ? 1 : 0,
                                        },
                                    ]}
                                >
                                    <Text style={styles.rpeBadgeText}>RPE: {Number(action.RPE)}</Text>
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
            onPress={() => !disableToggle && setExpanded(!expanded)}
            onLongPress={onPress}
            style={styles.card}
            disabled={disableToggle}
            activeOpacity={disableToggle ? 1 : 0.7}
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
    rpeBadge: {
        paddingVertical: 2.5,
        paddingHorizontal: 6,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center"
    },
    rpeBadgeText: {
        color: "#000",
        fontWeight: "bold",
        fontSize: 10.5,
    },
    rpeBadgeContainer: {
        width: 55,
        alignItems: "flex-end",
        justifyContent: "center",
    },



    row: {
        flexDirection: "row",
        alignItems: "flex-start", // align all top-aligned (instead of center)
        minHeight: 22,
    },

    setTextContainer: {
        flex: 1,
        justifyContent: "center",
        paddingTop: 2,
    },

    restContainer: {
        width: 130,
        justifyContent: "center",
        paddingTop: 2,
    },

    setText: {
        color: "white",
        fontSize: 12.5,
        flexShrink: 1,
        flexGrow: 1,
    },

    restText: {
        color: "#1e90ff",
        fontSize: 11.5,
    },
});

export default ExerciseCard;
