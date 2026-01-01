import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.6;

export default function SwipeToDeleteCard() {
  const [visible, setVisible] = useState(true);
  const translateX = useSharedValue(0);
  const cardHeight = useSharedValue(100);
  const cardOpacity = useSharedValue(1);

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setVisible(false);
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd(() => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        cardOpacity.value = withTiming(0, { duration: 200 });
        cardHeight.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(handleDelete)();
        });
      } else {
        translateX.value = withTiming(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    height: cardHeight.value,
  }));

  const deleteBackgroundStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
    width: -translateX.value,
    height: cardHeight.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: cardHeight.value,
    opacity: cardOpacity.value,
  }));

  const backgroundWrapperStyle = useAnimatedStyle(() => ({
    height: cardHeight.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.absoluteFill, backgroundWrapperStyle]}>
        <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
          <Text style={styles.deleteText}>Delete</Text>
        </Animated.View>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Text style={styles.cardText}>Swipe me left to delete</Text>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    overflow: 'hidden',
    paddingRight: 20,
  },
  deleteBackground: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    height: '10%',
    borderRadius: 16,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 16,
    width: '95%',
    alignSelf: 'center',
  },
  cardText: {
    color: 'white',
    fontWeight: '600',
  },
});
