import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Dimensions, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ExerciseType } from "../types/workout-old";
import RpeSelector from "./RpeSelector";

import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

import { useEffect } from "react";
import { useColorScheme } from "react-native";

type FocusProps = {
    actionIndex: number;
    registerFocus: (id: string, order: number, ref: React.RefObject<TextInput | null>) => void;
    unregisterFocus: (id: string) => void;
    focusNext: (id: string) => boolean;
};

interface ActionInputProps {
    action: any;
    actionId: string;
    updateActionValue: (
        id: string,
        field: "reps" | "weight" | "value" | "unit" | "weightUnit" | "valueUnit" | "note" | "isWarmup" | "RPE" | "restInSeconds",
        value: string
    ) => void;
    exerciseType: ExerciseType;
    isExpanded: boolean;
    onToggle: () => void;
    onExpand?: () => void;
    onExpandAdvanced?: () => void;
    showAdvanced: boolean;
    onToggleAdvanced: () => void;
    onDismiss?: (id: string) => void;
    showInfoIcon?: boolean;
    autoFocusWeight?: boolean;
    onDidAutoFocus?: () => void;
    actionIndex: number;
    registerFocus: FocusProps["registerFocus"];
    unregisterFocus: FocusProps["unregisterFocus"];
    focusNext: FocusProps["focusNext"];
    disabled?: boolean;
}

const RANK = {
    weight: 0,
    reps: 1,
    rest: 2,
} as const;

const ActionInput: React.FC<ActionInputProps> = ({
    action,
    actionId,
    updateActionValue,
    exerciseType,
    isExpanded,
    showAdvanced,
    onToggleAdvanced,
    onToggle,
    onExpand,
    onExpandAdvanced,
    onDismiss,
    showInfoIcon = true,
    autoFocusWeight = false,
    onDidAutoFocus, actionIndex, registerFocus, unregisterFocus, focusNext,
    disabled = false,
}) => {

    const isDark = useColorScheme() === "dark";
    const cardBg = isDark ? "#2a2a2a" : "#d1d1d1";
    const innerBg = isDark ? "#1e1e1e" : "#ffffff";
    const textPrimary = isDark ? "#ffffff" : "#000000";
    const textSecondary = isDark ? "#888" : "#666";
    const unitBg = isDark ? "#444" : "#e5e5e5";
    const unitBorder = isDark ? "#555" : "#ccc";
    const inputBg = isDark ? "#1e1e1e" : "#ffffff";
    const inputText = isDark ? "#fff" : "#000";
    const iconColorPrimary = isDark ? "#ccc" : "#555";

    // refs
    const weightRef = useRef<TextInput | null>(null);
    const repsRef = useRef<TextInput | null>(null);
    const restRef = useRef<TextInput | null>(null);


    useEffect(() => {
        const regs: Array<[string, number, React.RefObject<TextInput | null>]> = [];
        const base = actionIndex * 10;

        if (action.type === "set") {
            if (exerciseType === "weighted") {
                regs.push([`${action.id}:weight`, base + RANK.weight, weightRef]);
            }
            // You said “only weights and reps” – include reps for both bodyweight/weighted
            regs.push([`${action.id}:reps`, base + RANK.reps, repsRef]);
        }

        if (action.type === "rest") {
            regs.push([`${action.id}:rest`, base + RANK.rest, restRef]);
        }

        regs.forEach(([id, order, ref]) => registerFocus(id, order, ref));
        return () => { regs.forEach(([id]) => unregisterFocus(id)); };
    }, [action.type, action.id, actionIndex, exerciseType, registerFocus, unregisterFocus]);


    const screenHeight = Dimensions.get("window").height;

    function formatRestDisplay(raw: string): string {
        const digits = raw.replace(/\D/g, "");

        if (digits.length <= 2) return digits; // don't show colon
        const minutes = digits.slice(0, digits.length - 2);
        const seconds = digits.slice(-2);
        return `${parseInt(minutes)}:${seconds.padStart(2, "0")}`;
    }




    const SCREEN_WIDTH = Dimensions.get('window').width;
    const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.4;

    const translateX = useSharedValue(0);
    const cardHeight = useSharedValue(1); // 1 to avoid initial height of 0
    const cardOpacity = useSharedValue(1);

    const hasTriggeredHaptic = useSharedValue(false);


    const pan = Gesture.Pan()
        .enabled(!disabled)
        .activeOffsetX([-10, 10])        // only activate on meaningful horizontal swipes
        .failOffsetY([-5, 5])            // cancel if vertical movement is detected
        .minDistance(10)                 // prevent ghost touches
        .onUpdate((event) => {
            if (event.translationX < 0) {
                translateX.value = event.translationX;

                // Fire haptic once if nearing threshold
                if (
                    translateX.value < SWIPE_THRESHOLD &&
                    !hasTriggeredHaptic.value
                ) {
                    hasTriggeredHaptic.value = true;
                    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                }
            }
        })
        .onEnd(() => {
            if (translateX.value < SWIPE_THRESHOLD) {
                translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
                cardOpacity.value = withTiming(0, { duration: 200 });
                cardHeight.value = withTiming(0, { duration: 200 }, () => {
                    if (onDismiss) {
                        runOnJS(onDismiss)(actionId);
                    }
                    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
                });
            } else {
                hasTriggeredHaptic.value = false;
                translateX.value = withTiming(0);
            }
        });

    const animatedCardStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateX: translateX.value }],
            opacity: cardOpacity.value,
            borderRadius: 8,
            overflow: "hidden",
            width: "100%",
        };
    });

    const animatedIconStyle = useAnimatedStyle(() => {
        const scale = interpolate(
            translateX.value,
            [-SCREEN_WIDTH * 0.6, -SCREEN_WIDTH * 0.2],
            [1.4, 1],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            }
        );

        return {
            transform: [{ scale }],
        };
    });

    const animatedContainerStyle = useAnimatedStyle(() => {
        return {
            backgroundColor: interpolateColor(
                translateX.value,
                [-SCREEN_WIDTH * 0.6, 0],
                ['#ff3b30', action.type === "rest" ? "#2a2a2a" : action.isWarmup ? "#394d5c" : "#2a2a2a"]
            ),
        };
    });

    const containerStyle = useAnimatedStyle(() => ({
        height: cardHeight.value === 0 ? 0 : undefined,
        overflow: cardHeight.value === 0 ? 'hidden' : 'visible',
    }));

    const deleteBackgroundStyle = useAnimatedStyle(() => ({
        opacity: translateX.value < 0 ? 1 : 0,
        width: -translateX.value,
    }));

    // ───── REST ─────
    if (action.type === "rest") {
        return (

            <Animated.View style={[styles.swipeContainer, containerStyle]}>
                <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
                    <Animated.View style={animatedIconStyle}>
                        <Feather name="trash-2" size={22} color={iconColorPrimary} />
                    </Animated.View>
                </Animated.View>

                <GestureDetector gesture={pan}>
                    <Animated.View style={[animatedCardStyle, { borderRadius: 8, overflow: "hidden", width: "100%" }]} collapsable={false}>
                        <Animated.View style={[styles.container, { backgroundColor: cardBg }]}>
                            <View style={styles.headerRow}>
                                <Text style={[styles.label, { fontSize: 18, fontWeight: "bold", color: textPrimary }]}>
                                    Rest
                                </Text>

                                <View style={styles.rightRow}>
                                    <View style={styles.inputRow}>
                                        {/* <TextInput
                                            ref={restRef}
                                            placeholder="Time"
                                            placeholderTextColor={textSecondary}
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

                                                // save raw digits for formatting (MMSS)
                                                updateActionValue(actionId, "value", clean);

                                                // save parsed seconds for logic use
                                                updateActionValue(actionId, "restInSeconds", seconds.toString());
                                            }}
                                            maxLength={5}
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: inputBg,
                                                    color: inputText,
                                                    borderColor: unitBorder,
                                                }
                                            ]}
                                        /> */}
                                        <TextInput
                                            ref={restRef}
                                            placeholder="Time"
                                            placeholderTextColor={textSecondary}
                                            keyboardType="numeric"
                                            returnKeyType={"next"}
                                            blurOnSubmit={false}
                                            editable={!disabled} // NEW
                                            value={formatRestDisplay(action.value)}
                                            onChangeText={(text) => {
                                                if (disabled) return; // NEW guard
                                                const clean = text.replace(/\D/g, "");
                                                let seconds = 0;
                                                if (clean.length <= 2) {
                                                    seconds = parseInt(clean || "0");
                                                } else {
                                                    const minutes = parseInt(clean.slice(0, -2) || "0");
                                                    const secs = parseInt(clean.slice(-2) || "0");
                                                    seconds = minutes * 60 + secs;
                                                }
                                                updateActionValue(actionId, "value", clean);
                                                updateActionValue(actionId, "restInSeconds", String(seconds));
                                            }}
                                            maxLength={5}
                                            onSubmitEditing={() => {
                                                if (!disabled) focusNext(`${action.id}:rest`);
                                            }}
                                            caretHidden={false}
                                            style={[
                                                styles.input,
                                                {
                                                    backgroundColor: inputBg,
                                                    color: inputText,
                                                    borderColor: unitBorder,
                                                    textAlign: (formatRestDisplay(action.value) || "").length ? "center" : "left",
                                                    opacity: disabled ? 0.6 : 1, // NEW subtle dim on input itself
                                                },
                                            ]}
                                        />
                                    </View>
                                    {showInfoIcon && (
                                        <View style={styles.infoIcon}>
                                            <Feather name="clock" size={20} color={iconColorPrimary} />
                                        </View>
                                    )}
                                </View>
                            </View>
                        </Animated.View>
                    </Animated.View>
                </GestureDetector>
            </Animated.View>
        );
    }

    // ───── SET ─────
    return (
        <Animated.View style={[styles.swipeContainer, containerStyle]}>
            <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
                <Animated.View style={animatedIconStyle}>
                    <Feather name="trash-2" size={22} color="white" />
                </Animated.View>
            </Animated.View>

            <GestureDetector gesture={pan}>
                <Animated.View style={[animatedCardStyle, { borderRadius: 8, overflow: "hidden", width: "100%" }]} collapsable={false}>
                    <Animated.View style={[
                        styles.container,
                        {
                            borderColor: action.isWarmup ? "yellow" : "transparent",
                            borderWidth: 1,
                            backgroundColor: cardBg
                        }
                    ]}>
                        {/* Header */}
                        <View style={styles.headerRow}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (disabled) return; // NEW
                                    const newWarmup = !action.isWarmup;
                                    updateActionValue(actionId, "isWarmup", newWarmup);
                                    if (newWarmup) updateActionValue(actionId, "RPE", "");
                                }}
                                disabled={disabled} // NEW
                                style={{
                                    borderColor: unitBorder,
                                    borderWidth: 1,
                                    paddingVertical: 4,
                                    paddingHorizontal: 12,
                                    borderRadius: 8,
                                    justifyContent: "center",
                                    backgroundColor: innerBg,
                                    opacity: disabled ? 0.6 : 1, // NEW
                                }}
                            >
                                <Text style={{
                                    fontSize: 14,
                                    color: textPrimary,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                }}>
                                    {action.isWarmup ? "Warm-Up" : `Set ${action.setNumber}`}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.rightRow}>
                                <View style={styles.inputRow}>
                                    {exerciseType === "weighted" && (
                                        <>
                                            <TextInput
                                                ref={weightRef}
                                                placeholder="Weight"
                                                placeholderTextColor={textSecondary}
                                                keyboardType="numeric"
                                                value={action.weight ?? ""} // ensure string
                                                onChangeText={(v) => updateActionValue(actionId, "weight", v)}
                                                returnKeyType="next"
                                                blurOnSubmit={false}
                                                onSubmitEditing={() => focusNext(`${action.id}:weight`)}
                                                editable={!disabled}
                                                style={[
                                                    styles.input,
                                                    {
                                                        backgroundColor: inputBg,
                                                        color: inputText,
                                                        borderColor: unitBorder,
                                                        textAlign: (action.weight ?? "").length ? "center" : "left", // show caret when empty
                                                        opacity: disabled ? 0.6 : 1,
                                                    },
                                                ]}
                                            />
                                            <TouchableOpacity
                                                onPress={() => { if (!disabled) updateActionValue(actionId, "weightUnit", action.weightUnit === "lb" ? "kg" : "lb"); }}
                                                style={[
                                                    styles.unitToggle,
                                                    {
                                                        backgroundColor: unitBg,
                                                        borderColor: unitBorder,
                                                        opacity: disabled ? 0.6 : 1
                                                    }
                                                ]}
                                            >
                                                <Text style={[styles.unitText, { color: textPrimary }]}>{action.weightUnit}</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    {(exerciseType === "bodyweight" || exerciseType === "weighted") && (
                                        <TextInput
                                            ref={repsRef}
                                            placeholder="Reps"
                                            placeholderTextColor={textSecondary}
                                            keyboardType="numeric"
                                            value={action.reps ?? ""}
                                            onChangeText={(v) => { if (!disabled) updateActionValue(actionId, "reps", v); }}
                                            returnKeyType="next"
                                            blurOnSubmit={false}
                                            onSubmitEditing={() => { if (!disabled) focusNext(`${action.id}:reps`); }}
                                            editable={!disabled}
                                            style={[
                                                styles.input,
                                                { backgroundColor: inputBg, color: inputText, borderColor: unitBorder, opacity: disabled ? 0.6 : 1 }
                                            ]}
                                        />
                                    )}
                                    {exerciseType === "duration" && (
                                        <>
                                            <TextInput
                                                placeholder="Duration"
                                                placeholderTextColor={textSecondary}
                                                keyboardType="numeric"
                                                value={action.value}
                                                onChangeText={(value) => updateActionValue(actionId, "value", value)}
                                                style={[
                                                    styles.input,
                                                    {
                                                        backgroundColor: inputBg,
                                                        color: inputText,
                                                        borderColor: unitBorder,
                                                    }
                                                ]}
                                            />
                                            <TouchableOpacity
                                                onPress={() => updateActionValue(actionId, "unit", action.unit === "sec" ? "min" : "sec")}
                                                style={[
                                                    styles.unitToggle,
                                                    {
                                                        backgroundColor: unitBg,
                                                        borderColor: unitBorder,
                                                    }
                                                ]}
                                            >
                                                <Text style={[styles.unitText, { color: textPrimary }]}>{action.unit}</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>

                                {showInfoIcon && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (disabled) return;
                                            onToggle();
                                            onExpand?.();
                                        }}
                                        style={[styles.infoIcon, { opacity: disabled ? 0.6 : 1 }]}
                                    >
                                        <Feather name="more-vertical" size={21} color={iconColorPrimary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Expanded Note + Advanced */}
                        {isExpanded && (
                            <>
                                <TextInput
                                    placeholder="Add a note..."
                                    placeholderTextColor={textPrimary}
                                    multiline
                                    numberOfLines={5}
                                    scrollEnabled={true}
                                    style={{
                                        backgroundColor: innerBg,
                                        color: textPrimary,
                                        borderRadius: 6,
                                        padding: 10,
                                        fontSize: 14,
                                        marginTop: 10,
                                        maxHeight: screenHeight * 0.2,
                                        textAlignVertical: "top",
                                    }}
                                    value={action.note}
                                    onChangeText={(text) => updateActionValue(actionId, "note", text)}
                                />

                                {!action.isWarmup && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            onToggleAdvanced();
                                            onExpandAdvanced?.();
                                        }}
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

                                {showAdvanced && !action.isWarmup && (
                                    <View style={{ marginTop: 10 }}>
                                        <RpeSelector
                                            selected={action.RPE}
                                            onSelect={(num) => updateActionValue(actionId, "RPE", num)}
                                        />
                                    </View>
                                )}
                            </>
                        )}
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        padding: 12,
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
    swipeContainer: {
        width: '100%',
        marginBottom: 8,
        position: 'relative',
    },
    deleteBackground: {
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingRight: 20,
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        borderRadius: 8,
        zIndex: -1,
    },
});

export default ActionInput;

