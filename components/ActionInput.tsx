import { Feather } from "@expo/vector-icons";
import React from "react";
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ExerciseType } from "../types/workout";


interface ActionInputProps {
    action: any;
    index: number;
    updateActionValue: (
        index: number,
        field: "reps" | "weight" | "value" | "unit" | "weightUnit" | "valueUnit" | "note",
        value: string
    ) => void;
    exerciseType: ExerciseType;
    isExpanded: boolean;
    onToggle: () => void;
}

const ActionInput: React.FC<ActionInputProps> = ({
    action,
    index,
    updateActionValue,
    exerciseType,
    isExpanded,
    onToggle
}) => {
    const screenHeight = Dimensions.get("window").height;

    function formatRestDisplay(raw: string): string {
        const digits = raw.replace(/\D/g, "");

        if (digits.length <= 2) return digits; // don't show colon
        const minutes = digits.slice(0, digits.length - 2);
        const seconds = digits.slice(-2);
        return `${parseInt(minutes)}:${seconds.padStart(2, "0")}`;
    }

    // ───── REST ─────
    if (action.type === "rest") {
        return (
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
                                    updateActionValue(index, "value", clean);
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
        );
    }


    // ───── SET ─────
    return (
        <View style={[styles.container, { backgroundColor: "#2a2a2a" }]}>
            {/* Set row: Number left, inputs right */}
            <View style={styles.headerRow}>
                <Text style={[styles.label, { fontSize: 18, fontWeight: "bold", color: "white" }]}>
                    Set {action.setNumber}
                </Text>

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
                                    onPress={() => updateActionValue(index, "unit", action.weightUnit === "lb" ? "kg" : "lb")}
                                    style={styles.unitToggle}
                                >
                                    <Text style={styles.unitText}>{action.unit}</Text>
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
            )}
        </View>
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
        backgroundColor: "black",
        color: "white",
        borderRadius: 6,
        padding: 8,
        width: 80,
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
});

export default ActionInput;