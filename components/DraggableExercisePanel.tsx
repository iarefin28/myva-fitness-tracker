import React, { useEffect } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

import MiniExerciseCard from './MiniExerciseCard';

const screenHeight = Dimensions.get('window').height;

export default function DraggableExercisePanel() {
    const headerOffset = 150;
    const topSnap = headerOffset;
    const midSnap = screenHeight * 0.55;
    const bottomSnap = screenHeight - 75;
    const exercises = ['Bench Press', 'Deadlift', 'Squat', 'Pull Ups', 'Overhead Press'];


    const translateY = useSharedValue(bottomSnap);

    useEffect(() => {
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

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: screenHeight,
                    backgroundColor: '#1e1e1e',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingHorizontal: 16,
                    zIndex: 99,
                },
                animatedStyle,
            ]}
        >
            {/* DRAG HANDLE ONLY */}
            <PanGestureHandler onGestureEvent={gestureHandler}>
                <Animated.View style={{ paddingTop: 16, paddingBottom: 8 }}>
                    <View
                        style={{
                            width: 40,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: '#555',
                            alignSelf: 'center',
                            marginBottom: 8,
                        }}
                    />
                    <Text
                        style={{
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        Your Exercises
                    </Text>
                </Animated.View>
            </PanGestureHandler>

            {/* SCROLLABLE CONTENT */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
            >
                {exercises.map((exercise, index) => (
                    <MiniExerciseCard key={index} title={exercise} />
                ))}
            </ScrollView>
        </Animated.View>
    );
}