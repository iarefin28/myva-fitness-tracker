import { AntDesign } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";

import { useState } from "react";
import { ActionSheetIOS, Alert, Keyboard, useColorScheme } from "react-native";
import Animated, { Layout } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { ExerciseAction, ExerciseType, TagState } from "../types/workout";
import ActionInput from "./ActionInput";
import ExerciseAutocomplete from "./ExerciseAutocomplete";

import { useCallback } from "react";

import TagSearchPicker from "./TagPicker";

interface Props {
    visible: boolean;
    exerciseName: string;
    exerciseNameBlurred: boolean;
    lockedExerciseTitle: string;
    exerciseType: ExerciseType;
    actionsList: ExerciseAction[];
    updateActionValue: (
        id: string,
        field: "reps" | "weight" | "value" | "unit" | "weightUnit" | "valueUnit" | "note" | "isWarmup" | "RPE" | "restInSeconds",
        value: string
    ) => void;
    updateActionsList: (newList: ExerciseAction[]) => void;
    onClose: () => void;
    onSave: () => void;
    onSelectExercise: (exercise: string, type: ExerciseType) => void;
    onChangeExerciseName: (text: string) => void;
    addSet: () => void;
    addRest: () => void;
    onDeleteAction: (id: string) => void;
    isEditing?: boolean;
    resetExpansionTrigger: number;
    scrollToBottom: boolean;
    onScrolledToBottom: () => void;
    initialEditDuration?: number;
    onCloseWithDuration?: (duration: number) => void;
    trackTime?: boolean;
    mode?: "live" | "template";
    tags: TagState;
    onChangeTags: (t: TagState) => void;
    pendingFocusId?: string | null;
    onPendingFocusHandled?: () => void;

}

export default function ExerciseEditorModal({
    visible,
    exerciseName,
    exerciseNameBlurred,
    lockedExerciseTitle,
    exerciseType,
    actionsList,
    updateActionValue,
    updateActionsList,
    onClose,
    onSave,
    onSelectExercise,
    onChangeExerciseName,
    addSet,
    addRest,
    onDeleteAction,
    isEditing,
    resetExpansionTrigger,
    scrollToBottom,
    onScrolledToBottom,
    initialEditDuration,
    onCloseWithDuration,
    trackTime = true,
    mode = "live",
    tags,
    onChangeTags,
    pendingFocusId,
    onPendingFocusHandled
}: Props) {
    const scrollViewRef = useRef<ScrollView>(null);
    const canAddRest = actionsList.length === 0 || actionsList[actionsList.length - 1].type !== "rest";

    const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
    const [advancedOptionsIndices, setAdvancedOptionsIndices] = React.useState<number[]>([]);
    const [keyboardVisible, setKeyboardVisible] = React.useState(false);

    const [modalTimer, setModalTimer] = useState(initialEditDuration || 0);
    const modalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scheme = useColorScheme();
    const isDark = scheme === "dark";

    const modalOverlay = isDark ? "#2a2a2a" : "rgba(0, 0, 0, 0.2)";
    const modalBg = isDark ? "#000" : "#f7f7f7";
    const cardBg = isDark ? "#1e1e1e" : "#ffffff";
    const textPrimary = isDark ? "#fff" : "#000";
    const textSecondary = isDark ? "#aaa" : "#444";
    const blueAccent = isDark ? "#1e90ff" : "#007aff";
    const borderColor = isDark ? "#444" : "#ccc";

    const insets = useSafeAreaInsets();

    type InputNode = { id: string; order: number; ref: React.RefObject<any> };
    const focusNodesRef = useRef<InputNode[]>([]);

    const registerFocus = useCallback((id: string, order: number, ref: React.RefObject<any>) => {
        const nodes = focusNodesRef.current;
        const i = nodes.findIndex(n => n.id === id);
        if (i >= 0) nodes[i] = { id, order, ref };
        else nodes.push({ id, order, ref });
        nodes.sort((a, b) => a.order - b.order);
    }, []);

    const unregisterFocus = useCallback((id: string) => {
        focusNodesRef.current = focusNodesRef.current.filter(n => n.id !== id);
    }, []);

    const focusNext = useCallback((id: string) => {
        const nodes = focusNodesRef.current;
        const idx = nodes.findIndex(n => n.id === id);
        if (idx >= 0 && idx + 1 < nodes.length) {
            nodes[idx + 1].ref.current?.focus?.();
            return true;
        }
        return false;
    }, []);

    useEffect(() => {
        setExpandedIndex(null);
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [resetExpansionTrigger]);

    useEffect(() => {
        if (visible && trackTime) {
            modalTimerRef.current = setInterval(() => {
                setModalTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => {
            if (modalTimerRef.current) clearInterval(modalTimerRef.current);
            modalTimerRef.current = null;
        };
    }, [visible, trackTime]);

    useEffect(() => {
        if (!pendingFocusId) return;

        const tryFocus = (suffix: "weight" | "reps" | "rest") => {
            const targetId = `${pendingFocusId}:${suffix}`;
            const node = focusNodesRef.current.find(n => n.id === targetId);
            if (node?.ref?.current?.focus) {
                node.ref.current.focus();
                return true;
            }
            return false;
        };

        // allow inputs to mount & register first
        requestAnimationFrame(() => {
            if (tryFocus("weight") || tryFocus("reps") || tryFocus("rest")) {
                onPendingFocusHandled?.();
            } else {
                // one retry next frame in case registration is a tick late
                requestAnimationFrame(() => {
                    tryFocus("weight") || tryFocus("reps") || tryFocus("rest");
                    onPendingFocusHandled?.();
                });
            }
        });
    }, [pendingFocusId, onPendingFocusHandled]);

    const formatElapsedTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };


    const toggleExpand = (index: number) => {
        setExpandedIndex(prev => {
            const newIndex = prev === index ? null : index;

            // Delay scroll until after state updates
            if (newIndex !== null) {
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 300); // You can tweak this delay based on testing
            }

            return newIndex;
        });
    };

    const toggleAdvancedOptions = (index: number) => {
        setAdvancedOptionsIndices((prev) =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };


    const confirmClose = () => {
        const isIOS = Platform.OS === "ios";

        const message = isEditing
            ? "Are you sure you want to go back? Any updates made will not be saved."
            : "Are you sure you want to delete this exercise? This action cannot be undone.";

        const options = isEditing ? ["Cancel", "Confirm"] : ["Cancel", "Delete"];
        const destructiveButtonIndex = isEditing ? 1 : 1;

        if (isIOS) {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    message,
                    options,
                    cancelButtonIndex: 0,
                    destructiveButtonIndex,
                    userInterfaceStyle: scheme ?? "light",
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) {
                        onCloseWithDuration?.(modalTimer); // ✅ for iOS
                        onClose();
                    }
                }
            );
        } else {
            Alert.alert(
                isEditing ? "Discard Changes?" : "Delete Exercise?",
                message,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: isEditing ? "Confirm" : "Delete",
                        style: isEditing ? "default" : "destructive",
                        onPress: () => {
                            onCloseWithDuration?.(modalTimer);
                            onClose();
                        }
                    },
                ]
            );
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: modalOverlay }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{
                        backgroundColor: modalBg,
                        height: "95%",
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 20,
                    }}
                >
                    <SafeAreaView style={{ flex: 1 }}>
                        <View style={{ flex: 1 }}>
                            {/* Header */}
                            <View style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 20,
                            }}>
                                <TouchableOpacity onPress={confirmClose} style={{ padding: 4, minWidth: 50 }}>
                                    <AntDesign name="close" size={24} color={textPrimary} />
                                </TouchableOpacity>
                                {/* <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                                    {exerciseNameBlurred && !!lockedExerciseTitle && (
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                            style={{
                                                color: textPrimary,
                                                fontSize: 16,
                                                fontWeight: "bold",
                                                textAlign: "center",
                                                maxWidth: "90%",
                                            }}
                                        >
                                            {lockedExerciseTitle}
                                        </Text>
                                    )}
                                </View> */}
                                {trackTime && (
                                    <View style={{ flexDirection: "row" }}>
                                        <AntDesign name="clockcircleo" size={18} color={textPrimary} style={{ marginRight: 6 }} />
                                        <Text style={{ fontSize: 16, color: textPrimary, fontWeight: "bold" }}>
                                            {formatElapsedTime(modalTimer)}
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={() => {
                                        onCloseWithDuration?.(modalTimer); // ✅ Save the timer before closing
                                        onSave();                          // Then trigger save
                                    }}
                                    style={{ padding: 4, minWidth: 50, alignItems: "flex-end" }}
                                >
                                    <Text style={{ color: textPrimary, fontWeight: "bold", fontSize: 16 }}>
                                        {isEditing ? "Update" : "Save"}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Autocomplete or Locked Name */}
                            {exerciseNameBlurred && !!lockedExerciseTitle ? (
                                <View style={{
                                    backgroundColor: cardBg,
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
                                    <Text style={{ color: textPrimary, fontSize: 16, fontWeight: "400" }}>
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
                                    <View>
                                        <TagSearchPicker value={tags} onChange={onChangeTags} />
                                    </View>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                                        <TouchableOpacity
                                            style={{
                                                flex: 1,
                                                backgroundColor: blueAccent,
                                                paddingVertical: 16,
                                                borderRadius: 12,
                                                marginRight: 4,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderWidth: 1,
                                                borderColor: borderColor
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
                                        keyboardShouldPersistTaps="handled"
                                        keyboardDismissMode="none"
                                        onContentSizeChange={() => {
                                            if (scrollToBottom) {
                                                scrollViewRef.current?.scrollToEnd({ animated: true });
                                                onScrolledToBottom(); // reset flag
                                            }
                                        }}
                                    >

                                        {actionsList.map((action, index) => (
                                            <Animated.View
                                                layout={Layout.springify()}
                                                key={action.id}
                                            >
                                                <ActionInput
                                                    key={action.id}
                                                    action={action}
                                                    actionId={action.id}
                                                    updateActionValue={updateActionValue}
                                                    exerciseType={exerciseType}
                                                    isExpanded={expandedIndex === index}
                                                    showAdvanced={advancedOptionsIndices.includes(index)}
                                                    onToggle={() => toggleExpand(index)}
                                                    onDismiss={onDeleteAction}
                                                    onToggleAdvanced={() => toggleAdvancedOptions(index)}
                                                    onExpand={() => {
                                                        // fallback scroll trigger if needed
                                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                                    }}
                                                    onExpandAdvanced={() => {
                                                        // Small timeout to wait for layout shift
                                                        setTimeout(() => {
                                                            scrollViewRef.current?.scrollToEnd({ animated: true });
                                                        }, 200);
                                                    }}
                                                    showInfoIcon={mode !== "template"}
                                                    autoFocusWeight={action.type === "set" && action.id === pendingFocusId}
                                                    onDidAutoFocus={onPendingFocusHandled}
                                                    actionIndex={index}
                                                    registerFocus={registerFocus}
                                                    unregisterFocus={unregisterFocus}
                                                    focusNext={focusNext}
                                                />
                                            </Animated.View>
                                        ))}
                                    </ScrollView>

                                    {/* Save button at bottom for user ease */}
                                    {!keyboardVisible && (
                                        <TouchableOpacity
                                            onPress={onSave}
                                            style={{
                                                backgroundColor: blueAccent,
                                                paddingVertical: 16,
                                                borderRadius: 12,
                                                alignItems: "center",
                                                justifyContent: "center",
                                                borderWidth: 1,
                                                borderColor: borderColor,
                                                marginTop: 10,
                                                marginBottom: insets.bottom
                                            }}
                                        >
                                            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
                                                Save Exercise
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
