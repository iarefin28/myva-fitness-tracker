import { Feather } from "@expo/vector-icons";
import React from "react";
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'; // at the top
import { ExerciseType } from "../types/workout";
import RpeSelector from "./RpeSelector";


import {
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';


interface ActionInputProps {
    action: any;
    index: number;
    updateActionValue: (
        index: number,
        field: "reps" | "weight" | "value" | "unit" | "weightUnit" | "valueUnit" | "note" | "isWarmup" | "RPE" | "restInSeconds",
        value: string,
    ) => void;
    exerciseType: ExerciseType;
    isExpanded: boolean;
    onToggle: () => void;
    showAdvanced: boolean;
    onToggleAdvanced: () => void;
    onDismiss?: (index: number) => void;

}

const ActionInput: React.FC<ActionInputProps> = ({
    action,
    index,
    updateActionValue,
    exerciseType,
    isExpanded,
    showAdvanced,
    onToggleAdvanced,
    onToggle,

    onDismiss
}) => {
    const screenHeight = Dimensions.get("window").height;

    function formatRestDisplay(raw: string): string {
        const digits = raw.replace(/\D/g, "");

        if (digits.length <= 2) return digits; // don't show colon
        const minutes = digits.slice(0, digits.length - 2);
        const seconds = digits.slice(-2);
        return `${parseInt(minutes)}:${seconds.padStart(2, "0")}`;
    }

    const translateX = useSharedValue(0);
    const SWIPE_THRESHOLD = 100;

    const panGesture = useAnimatedGestureHandler({
        onActive: (event) => {
            translateX.value = event.translationX;
        },
        onEnd: () => {
            if (translateX.value < -SWIPE_THRESHOLD) {
                runOnJS(onDismiss)?.(index);
            } else {
                translateX.value = withSpring(0);
            }
        },
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const renderRightActions = () => (
        <View style={[styles.container, {
            backgroundColor: '#ff3b30',
            justifyContent: 'center',
            alignItems: 'center',
            width: '15%',
        }]}>
            <TouchableOpacity onPress={() => onDismiss?.(index)} style={styles.iconDeleteButton}>
                <Feather name="trash-2" size={20} color="white" />
            </TouchableOpacity>
        </View>
    );

    // ───── REST ─────
    if (action.type === "rest") {
        const renderRightActions = () => (
            <View style={[styles.container, {
                backgroundColor: '#ff3b30',
                justifyContent: 'center',
                alignItems: 'flex-end',
                width: 60
            }]}>
                <TouchableOpacity onPress={() => onDismiss?.(index)} style={styles.iconDeleteButton}>
                    <Feather name="trash-2" size={20} color="white" />
                </TouchableOpacity>
            </View>
        );

        return (
            <ReanimatedSwipeable renderRightActions={renderRightActions}>
                <View style={[styles.container, { backgroundColor: "#2a2a2a" }]}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.label, { fontSize: 18, fontWeight: "bold", color: "white" }]}>
                            Rest
                        </Text>

                        <View style={styles.rightRow}>
                            <View style={styles.inputRow}>
                                <TextInput
                                    placeholder="Time"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={formatRestDisplay(action.value)}
                                    onChangeText={(text) => {
                                        const clean = text.replace(/\D/g, "");

                                        let seconds = 0;
                                        if (clean.length <= 2) {
                                            seconds = parseInt(clean || "0");
                                        } else {
                                            const minutes = parseInt(clean.slice(0, -2));
                                            const secs = parseInt(clean.slice(-2));
                                            seconds = minutes * 60 + secs;
                                        }

                                        // 👇 Save raw digits for formatting (MMSS)
                                        updateActionValue(index, "value", clean);

                                        // 👇 Save parsed seconds for logic use
                                        updateActionValue(index, "restInSeconds", seconds.toString());
                                    }}
                                    maxLength={5}
                                    style={styles.input}
                                />
                            </View>

                            <View style={styles.infoIcon}>
                                <Feather name="clock" size={20} color="white" />
                            </View>
                        </View>
                    </View>
                </View>
            </ReanimatedSwipeable>
        );
    }



    // ───── SET ─────
    return (
        <ReanimatedSwipeable renderRightActions={renderRightActions}>

            <View style={[
                styles.container,
                {
                    backgroundColor: action.isWarmup ? "#394d5c" : "#2a2a2a",
                    borderColor: action.isWarmup ? "#61dafb" : "#2a2a2a",
                    borderWidth: 1,
                }
            ]}>
                {/* Set row: Number left, inputs right */}
                <View style={styles.headerRow}>
                    <TouchableOpacity
                        onPress={() => {
                            const newWarmup = !action.isWarmup;
                            updateActionValue(index, "isWarmup", newWarmup);

                            if (newWarmup) {
                                updateActionValue(index, "RPE", ""); // reset RPE
                            }
                        }}
                        style={{
                            backgroundColor: "#1e1e1e", // slightly darker gray for contrast
                            borderColor: "#555",
                            borderWidth: 1,
                            paddingVertical: 4,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            justifyContent: "center"
                        }}
                    >
                        <Text style={{
                            fontSize: 14,
                            color: "white",
                            fontWeight: "bold",
                            textAlign: "center",
                        }}>
                            {action.isWarmup ? "Warm-Up" : `Set ${action.setNumber}`}
                        </Text>
                    </TouchableOpacity>


                    <View style={styles.rightRow}>
                        <View style={styles.inputRow}>

                            {(exerciseType === "weighted") && (
                                <>
                                    <TextInput
                                        placeholder="Weight"
                                        placeholderTextColor="#888"
                                        keyboardType="numeric"
                                        value={action.weight}
                                        onChangeText={(value) => updateActionValue(index, "weight", value)}
                                        style={styles.input}
                                    />
                                    <TouchableOpacity
                                        onPress={() => updateActionValue(index, "weightUnit", action.weightUnit === "lb" ? "kg" : "lb")}
                                        style={{
                                            ...styles.unitToggle,
                                            minWidth: 40, // safe fallback
                                            alignItems: "center",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <Text style={styles.unitText}>{action.weightUnit}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {(exerciseType === "bodyweight" || exerciseType === "weighted") && (
                                <TextInput
                                    placeholder="Reps"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={action.reps}
                                    onChangeText={(value) => updateActionValue(index, "reps", value)}
                                    style={styles.input}
                                />
                            )}
                            {exerciseType === "duration" && (
                                <>
                                    <TextInput
                                        placeholder="Duration"
                                        placeholderTextColor="#888"
                                        keyboardType="numeric"
                                        value={action.value}
                                        onChangeText={(value) => updateActionValue(index, "value", value)}
                                        style={[styles.input, { borderWidth: 1, borderColor: "#333" }]}
                                    />
                                    <TouchableOpacity
                                        onPress={() => updateActionValue(index, "unit", action.unit === "sec" ? "min" : "sec")}
                                        style={styles.unitToggle}
                                    >
                                        <Text style={styles.unitText}>{action.unit}</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {/* Add other cases like 'weighted duration' and 'weighted distance' here similarly */}
                        </View>

                        <TouchableOpacity onPress={onToggle} style={styles.infoIcon}>
                            <Feather name="more-vertical" size={21} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Note expands below */}
                {isExpanded && (
                    <>
                        <TextInput
                            placeholder="Add a note..."
                            placeholderTextColor="#888"
                            multiline
                            numberOfLines={5}
                            scrollEnabled={true}
                            style={{
                                backgroundColor: "#1e1e1e",
                                color: "white",
                                borderRadius: 6,
                                padding: 10,
                                fontSize: 14,
                                marginTop: 10,
                                maxHeight: screenHeight * 0.2,
                                textAlignVertical: "top",
                            }}
                            value={action.note}
                            onChangeText={(text) => updateActionValue(index, "note", text)}
                        />

                        {!action.isWarmup && (
                            <TouchableOpacity
                                onPress={onToggleAdvanced}
                                style={{
                                    marginTop: 10,
                                    backgroundColor: '#1e90ff',
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                    {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {/* more advanced features tempo, RPE, focus, quality */}
                        {showAdvanced && !action.isWarmup && (
                            <View style={{ marginTop: 10 }}>

                                <RpeSelector
                                    selected={action.RPE}
                                    onSelect={(num) => updateActionValue(index, "RPE", num)}
                                />
                            </View>
                        )}
                    </>
                )}


            </View>

        </ReanimatedSwipeable>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    label: {
        color: "white",
        fontSize: 16,
    },
    inputRow: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
        flexWrap: "nowrap",
    },
    input: {
        backgroundColor: "#1e1e1e",
        color: "white",
        borderRadius: 6,
        padding: 8,
        width: 65,
        textAlign: "center",
        fontSize: 15,
    },
    unitToggle: {
        backgroundColor: "#444",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#555",
        justifyContent: "center",
        alignItems: "center",

    },
    unitText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 14,
    },
    rightRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    infoIcon: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    deleteButton: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginVertical: 8,
    },
    deleteText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },

    swipeBackground: {
        backgroundColor: '#ff3b30', // iOS-style red
        borderRadius: 8,
        marginBottom: 8,
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 16,
        height: '100%',
    },
    iconDeleteButton: {
        backgroundColor: 'transparent',
        borderRadius: 20,
    },
});

export default ActionInput;