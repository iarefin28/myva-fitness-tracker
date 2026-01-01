import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Dimensions } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedGestureHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -SCREEN_WIDTH * 0.3;

export default function SwipeableCardWrapper({ children, onDelete }: { children: React.ReactNode, onDelete: () => void }) {
  const translateX = useSharedValue(0);
  const height = useSharedValue(100);
  const opacity = useSharedValue(1);
  const [visible, setVisible] = useState(true);

  const panGesture = useAnimatedGestureHandler({
    onActive: (event) => {
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    },
    onEnd: () => {
      if (translateX.value < SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 200 });
        height.value = withTiming(0, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy);
          runOnJS(() => {
            onDelete?.();
            setVisible(false);
          })();
        });
      } else {
        translateX.value = withTiming(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    height: height.value,
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <PanGestureHandler onGestureEvent={panGesture}>
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
}
