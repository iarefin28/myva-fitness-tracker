// DraggableExercisePanel.tsx
import React from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    Extrapolate,
    interpolate,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import { useColorScheme } from 'react-native';



const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

import type { Exercise } from "../types/workout";
import ExerciseCard from './ExerciseCard'; // full version

type Props = {
    exercises: Exercise[];
    onPressExercise: (index: number) => void;
    onDeleteExercise: (index: number) => void;
    mode?: "template" | "live";
};

const screenHeight = Dimensions.get('window').height;

export default function DraggableExercisePanel({
    exercises,
    onPressExercise,
    onDeleteExercise,
    mode = "live",
}: Props) {
    const headerOffset = 100;
    const topSnap = headerOffset;
    const midSnap = mode === "template"
        ? screenHeight * 0.33 
        : screenHeight * 0.51; 

    const bottomSnap = screenHeight - 75;

    const translateY = useSharedValue(bottomSnap);
    const borderRadius = useSharedValue(24);

    const scheme = useColorScheme();
    const isDark = scheme === "dark";

    const panelBg = isDark ? "#1e1e1e" : "#d1d1d1";
    const textColor = isDark ? "#fff" : "#000";
    const handleColor = isDark ? "#555" : "#bbb";


    React.useEffect(() => {
        translateY.value = withTiming(midSnap, {
            duration: 250,
            easing: Easing.out(Easing.ease),
        });
    }, []);

    const gestureHandler = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.startY = translateY.value;
        },
        onActive: (event, ctx) => {
            const next = ctx.startY + event.translationY;
            translateY.value = Math.min(Math.max(next, topSnap), bottomSnap);
        },
        onEnd: (event) => {
            const velocity = event.velocityY;
            const position = translateY.value;
            let target = bottomSnap;

            if (velocity < -800) {
                target = position > midSnap ? midSnap : topSnap;
            } else if (velocity > 800) {
                target = position < midSnap ? midSnap : bottomSnap;
            } else {
                if (position < (midSnap + topSnap) / 2) {
                    target = topSnap;
                } else if (position < (bottomSnap + midSnap) / 2) {
                    target = midSnap;
                } else {
                    target = bottomSnap;
                }
            }

            translateY.value = withTiming(target, {
                duration: 250,
                easing: Easing.out(Easing.ease),
            });
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        const radius = interpolate(
            translateY.value,
            [midSnap, bottomSnap],
            [24, 0],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ translateY: translateY.value }],
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
        };
    });

    const scrollContainerStyle = useAnimatedStyle(() => {
        const visibleHeight = screenHeight - translateY.value;
        return {
            height: visibleHeight - 100, // adjust padding/margins as needed
        };
    });

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: screenHeight,
                    backgroundColor: panelBg,
                    paddingHorizontal: 16,
                    zIndex: 99,
                },
                animatedStyle,
            ]}
        >
            <PanGestureHandler onGestureEvent={gestureHandler}>
                <Animated.View style={{ paddingTop: 16, paddingBottom: 8 }}>
                    <View
                        style={{
                            width: 40,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: handleColor,
                            alignSelf: 'center',
                            marginBottom: 8,
                        }}
                    />
                    <Text
                        style={{
                            color: textColor,
                            fontSize: 18,
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        Your Exercises
                    </Text>
                </Animated.View>
            </PanGestureHandler>


            <Animated.View style={[{ overflow: 'hidden' }, scrollContainerStyle]}>
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 50, paddingTop: 20 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {exercises.map((exercise, index) => (
                        <ExerciseCard
                            key={index}
                            exercise={exercise}
                            onPress={() => onPressExercise(index)}
                            onDelete={() => onDeleteExercise(index)}
                            defaultExpanded={false}
                            showNotesButton={mode !== "template"}
                        />
                    ))}
                </ScrollView>
            </Animated.View>
        </Animated.View>
    );
}
