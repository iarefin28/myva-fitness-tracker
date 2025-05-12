import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

interface ActionInputProps {
    action: any;
    index: number;
    updateActionValue: (index: number, field: "reps" | "weight" | "value" | "unit", value: string) => void;
    exerciseType: "weighted" | "bodyweight" | "duration" | "unknown" | "weighted distance" | "weighted duration";
}

const ActionInput: React.FC<ActionInputProps> = ({ action, index, updateActionValue, exerciseType }) => {
    return (
        <View style={[styles.container, { backgroundColor: action.type === "set" ? "#3a3a3a" : "#262626" }]}>
            <View style={styles.headerRow}>
                <Text style={styles.label}>
                    {action.type === "set"
                        ? `Set #${action.setNumber}`
                        : `Rest #${action.restNumber} (${action.unit})`}
                </Text>
                {action.type === "set" ? (
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
                                    onPress={() => updateActionValue(index, "unit", action.unit === "lb" ? "kg" : "lb")}
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
                        {exerciseType === "weighted duration" && (
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
                                    <Text style={styles.unitText}>{action.weightUnit}</Text>
                                </TouchableOpacity>

                                <TextInput
                                    placeholder="Duration"
                                    placeholderTextColor="#888"
                                    keyboardType="numeric"
                                    value={action.value}
                                    onChangeText={(value) => updateActionValue(index, "value", value)}
                                    style={[styles.input, { borderWidth: 1, borderColor: "#333" }]}
                                />
                                <TouchableOpacity
                                    onPress={() => updateActionValue(index, "unit", action.valueUnit === "sec" ? "min" : "sec")}
                                    style={styles.unitToggle}
                                >
                                    <Text style={styles.unitText}>{action.valueUnit}</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                ) : (
                    // Rest timer input
                    <View style={styles.inputRow}>
                        <TextInput
                            placeholder="Time"
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
                    </View>
                )}
            </View>
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
    },
    input: {
        backgroundColor: "#2a2a2a",
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
});

export default ActionInput;