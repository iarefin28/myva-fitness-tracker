import { AntDesign } from "@expo/vector-icons";
import React, { useRef } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

import type { ExerciseAction, ExerciseType } from "../types/workout";
import ActionInput from "./ActionInput";
import ExerciseAutocomplete from "./ExerciseAutocomplete";

interface Props {
    visible: boolean;
    exerciseName: string;
    exerciseNameBlurred: boolean;
    lockedExerciseTitle: string;
    exerciseType: ExerciseType;
    actionsList: ExerciseAction[];
    updateActionValue: (
        index: number,
        field: "reps" | "weight" | "value" | "unit" | "weightUnit" | "valueUnit",
        value: string
    ) => void;
    onClose: () => void;
    onSave: () => void;
    onSelectExercise: (exercise: string, type: ExerciseType) => void;
    onChangeExerciseName: (text: string) => void;
    addSet: () => void;
    addRest: () => void;
    isEditing?: boolean;
}

export default function ExerciseEditorModal({
    visible,
    exerciseName,
    exerciseNameBlurred,
    lockedExerciseTitle,
    exerciseType,
    actionsList,
    updateActionValue,
    onClose,
    onSave,
    onSelectExercise,
    onChangeExerciseName,
    addSet,
    addRest,
    isEditing
}: Props) {
    const scrollViewRef = useRef<ScrollView>(null);
    const canAddRest = actionsList.length === 0 || actionsList[actionsList.length - 1].type !== "rest";


    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#2a2a2a"}}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{

                        backgroundColor: "black",
                        height: "95%",
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 20,
                    }}
                >
                    {/* Header */}
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 20,
                    }}>
                        <TouchableOpacity onPress={onClose} style={{ padding: 4, minWidth: 50 }}>
                            <AntDesign name="close" size={24} color="white" />
                        </TouchableOpacity>

                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            {exerciseNameBlurred && !!lockedExerciseTitle && (
                                <Text
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                    style={{
                                        color: "white",
                                        fontSize: 16,
                                        fontWeight: "bold",
                                        textAlign: "center",
                                        maxWidth: "90%",
                                    }}
                                >
                                    {lockedExerciseTitle}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={onSave}
                            style={{ padding: 4, minWidth: 50, alignItems: "flex-end" }}
                        >
                            <Text style={{ color: "#1e90ff", fontWeight: "bold", fontSize: 16 }}>
                                {isEditing ? "Update" : "Save"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Autocomplete or Locked Name */}
                    {exerciseNameBlurred && !!lockedExerciseTitle ? (
                        <View style={{
                            backgroundColor: "#1e1e1e",
                            borderRadius: 16,
                            paddingVertical: 14,
                            paddingHorizontal: 16,
                            shadowColor: "#000",
                            shadowOpacity: 0.15,
                            shadowOffset: { width: 0, height: 6 },
                            shadowRadius: 10,
                            elevation: 6,
                            marginBottom: 8,
                        }}>
                            <Text style={{ color: "white", fontSize: 16, fontWeight: "400" }}>
                                {lockedExerciseTitle}
                            </Text>
                        </View>
                    ) : (
                        <ExerciseAutocomplete
                            value={exerciseName}
                            onChangeText={onChangeExerciseName}
                            onSelect={onSelectExercise}
                        />
                    )}

                    {/* Set & Rest Buttons */}
                    {lockedExerciseTitle && (
                        <>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#1e90ff",
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        marginRight: 4,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 1,
                                        borderColor: "#444",
                                    }}
                                    onPress={addSet}
                                >
                                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>+ Add Set</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        flex: 1,
                                        backgroundColor: "#2a2a2a",
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        marginLeft: 4,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 1,
                                        borderColor: "#444",
                                        opacity: canAddRest ? 1 : 0.5,
                                    }}
                                    onPress={canAddRest ? addRest : undefined}
                                    disabled={!canAddRest}
                                >
                                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>+ Add Rest</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Action Inputs */}
                            <ScrollView
                                ref={scrollViewRef}
                                style={{ flex: 1 }}
                                showsVerticalScrollIndicator={false}
                                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                            >
                                {actionsList.map((action, index) => (
                                    <ActionInput
                                        key={index}
                                        action={action}
                                        index={index}
                                        updateActionValue={updateActionValue}
                                        exerciseType={exerciseType}
                                    />
                                ))}
                            </ScrollView>
                        </>
                    )}
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
