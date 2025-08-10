import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import type { Exercise } from "../types/workout";

interface Props {
    exercise: Exercise;
    onPress?: () => void;
    defaultExpanded?: boolean;
    disableToggle?: boolean;
    onDelete?: () => void;
    showNotesButton?: boolean
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



const ExerciseCard: React.FC<Props> = ({ exercise, onPress, defaultExpanded = false, disableToggle = false, onDelete, showNotesButton = true }) => {
    const scheme = useColorScheme();
    const isDark = scheme === "dark";

    const cardBg = isDark ? "#2a2a2a" : "#f2f2f2";
    const primaryText = isDark ? "#fff" : "#000";
    const secondaryText = isDark ? "#aaa" : "#444";
    const restTextColor = isDark ? "#1e90ff" : "#0066cc";
    const iconColor = isDark ? "#ccc" : "#555";
    const noteText = isDark ? "#FFD700" : "#bb8800";
    const noteBorder = isDark ? "#FFD700" : "#ccc";

    const [expanded, setExpanded] = useState(defaultExpanded);
    const [showNotes, setShowNotes] = useState(false);

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
                    <View key={action.id} style={{ marginBottom: showNotes && action.note?.trim() !== "" ? 10 : 2 }}>
                        <View style={styles.row}>
                            <View style={styles.setTextContainer}>
                                <Text style={[styles.setText, { color: primaryText }]}>
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
                                {restText && <Text style={[styles.restText, { color: restTextColor }]}>{restText}</Text>}
                            </View>

                            <View style={styles.rpeBadgeContainer}>
                                {!action.isWarmup && (
                                    <View
                                        style={[
                                            styles.rpeBadge,
                                            {
                                                backgroundColor:
                                                    Number(action.RPE) > 0
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

                        {showNotes && (
                            <View
                                style={{
                                    marginTop: 2,
                                    marginLeft: 8,
                                    paddingLeft: 4,
                                    borderLeftWidth: 1,
                                    borderColor: action.note?.trim() ? noteBorder : "#ccc",
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontStyle: "italic",
                                        color: action.note?.trim() ? noteText : secondaryText,
                                    }}
                                >
                                    {action.note?.trim() ? `📝 ${action.note}` : "No note added."}
                                </Text>
                            </View>
                        )}
                    </View>
                );

                if (next && next.type === "rest") i++; // skip rest next
            }
        }
        return rows;
    };

    return (
        <TouchableOpacity
            onLongPress={onPress} // Only long press triggers edit
            style={[styles.card, { backgroundColor: cardBg }]}
            activeOpacity={0.85}
        >
            <View style={styles.headerRow}>
                {/* Left Column: Exercise Name & Details */}
                <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.name, { color: primaryText }]}>{exercise.name}</Text>
                    <Text style={[styles.details, { color: secondaryText }]}>Sets: {totalSets} | Avg Reps: {avgReps}</Text>
                    <Text style={[styles.details, { color: secondaryText }]}>
                        {secondsToReadableTime(exercise.editDurationInSeconds || 0)}
                    </Text>
                </View>

                {/* Right Column: Buttons (always stay top right) */}
                <View style={styles.iconRow}>
                    {expanded ? (
                        <>
                            {/* Collapse */}
                            {!disableToggle && (
                                <TouchableOpacity
                                    onPress={() => setExpanded(false)}
                                    style={styles.iconButton}
                                    activeOpacity={0.6}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="chevron-up-outline" size={20} color={iconColor} />
                                </TouchableOpacity>
                            )}


                            {/* Notes Toggle */}
                            {showNotesButton && (
                                <TouchableOpacity
                                    onPress={() => setShowNotes(prev => !prev)}
                                    style={styles.iconButton}
                                    activeOpacity={0.6}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="document-text-outline" size={20} color="#FFD700" />
                                </TouchableOpacity>
                            )}

                            {/* Delete */}
                            {onDelete && (
                                <TouchableOpacity
                                    onPress={() => onDelete?.()}
                                    style={styles.iconButton}
                                    activeOpacity={0.6}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="red" />
                                </TouchableOpacity>
                            )}
                        </>
                    ) : (
                        // Expand
                        !disableToggle && (
                            <TouchableOpacity
                                onPress={() => setExpanded(true)}
                                style={styles.iconButton}
                                activeOpacity={0.6}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="chevron-down-outline" size={20} color={iconColor} />
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </View>
            {expanded && <View style={styles.detailList}>{renderSetRestRows()}</View>}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start", // important to prevent row drop
        justifyContent: "space-between",
    },

    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 2,
        gap: 10, // 👈 clean spacing between icons
    },
    iconButton: {
        padding: 6,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
    },
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
