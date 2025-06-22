import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from 'expo-router';
import React, { useRef } from 'react';
import { TouchableOpacity, View } from 'react-native';



import {
    Animated,
    Pressable,
    StyleSheet,
    Text
} from 'react-native';
import { Portal } from 'react-native-portalize';


export default function CustomAddButton({ expanded, setExpanded, ...props }) {
    const { dark } = useTheme();
    const navigation = useNavigation();
    const rotateAnim = useRef(new Animated.Value(0)).current;

    const collapseAndNavigate = (mode: string) => {
        Animated.parallel(
            animations.map(anim =>
                Animated.timing(anim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                })
            )
        ).start(() => {
            Animated.timing(rotateAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();

            setExpanded(false);
            navigation.navigate("add-workout", { mode });
        });
    };

    const actions = [
        () => collapseAndNavigate("live"),     // Start live workout
        () => collapseAndNavigate("scheduled"), // Schedule a Workout (future feature)
        () => collapseAndNavigate("template"), // Create Workout Template
    ];

    const animations = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    const buttonBg = dark ? '#1A1A1A' : '#e0e0e0';
    const iconColor = dark ? '#fff' : '#000';
    const shadowColor = dark ? '#000' : '#aaa';

    const toggleButtons = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setExpanded(prev => {
            const expanding = !prev;

            if (expanding) {
                // expand buttons
                Animated.stagger(60, animations.map(anim =>
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 120,
                        useNativeDriver: true,
                    })
                )).start();

                // Rotate +
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            } else {
                // collapse buttons
                Animated.parallel(animations.map(anim =>
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 100,
                        useNativeDriver: true,
                    })
                )).start();

                // rotate back
                Animated.timing(rotateAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }

            return expanding;
        });
    };

    const labels = [
        'Start live workout',
        'Schedule a Workout',
        'Create Workout Template',
    ];

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '45deg'], // + ➜ ×
    });

    const bgColorAnim = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [buttonBg, '#D32F2F'], // your aesthetic red
    });

    return (
        <Portal>
            {/* Animated action buttons */}
            {animations.map((anim, index) => {
                const translateY = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -((index + 1) * 49)],
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.optionButton,
                            {
                                transform: [{ translateY }],
                                opacity: anim,
                                position: 'absolute',
                                bottom: 80,
                                alignSelf: 'center',
                                zIndex: 100,
                                pointerEvents: expanded ? 'auto' : 'none',
                            },
                        ]}
                    >
                        <Pressable
                            style={({ pressed }) => [
                                styles.optionTouch,
                                { opacity: pressed ? 0.6 : 1 },
                            ]}
                            onPress={actions[index]}
                        >
                            <Text style={styles.optionText}>{labels[index]}</Text>
                        </Pressable>
                    </Animated.View>
                );
            })}

            {/* Main floating action button */}
            <View style={{ position: 'absolute', bottom: 55, alignSelf: 'center', zIndex: 101 }}>
                <TouchableOpacity
                    {...props}
                    onPress={toggleButtons}
                    style={{
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: buttonBg,
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        shadowColor,
                        shadowOpacity: 0.2,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 4,
                        elevation: 5,
                    }}
                >
                    <Animated.View
                        style={{
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: bgColorAnim,
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            shadowColor,
                            shadowOpacity: 0.2,
                            shadowOffset: { width: 0, height: 2 },
                            shadowRadius: 4,
                            elevation: 5,
                        }}
                    >
                        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                            <Ionicons name="add" size={32} color={iconColor} />
                        </Animated.View>
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </Portal>
    );
}

const styles = StyleSheet.create({
    optionButton: {
        alignItems: 'center',
    },
    optionTouch: {
        backgroundColor: "#2a2a2a",
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 24,
        width: 190,
        alignItems: 'center',
    },
    optionText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 13,
        textAlign: 'center',
    },
});
