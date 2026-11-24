import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { BRAND_INK, BRAND_PURPLE, OUTLINE, WHITE } from '@/constants/Colors';
import { SOFT_SPRING } from '@/components/onboarding/useEntrance';

// Lesson-style progress bar: a thick outlined track whose fill eases forward
// on each step. The white streak along the top is the fill's highlight.

const HEIGHT = 18;
const INNER_RADIUS = (HEIGHT - OUTLINE * 2) / 2;

export default function ProgressBar({ step, count }: { step: number; count: number }) {
  const reduceMotion = useReducedMotion();
  const target = count > 0 ? step / count : 0;
  const progress = useSharedValue(target);

  useEffect(() => {
    progress.value = reduceMotion ? target : withSpring(target, SOFT_SPRING);
  }, [target, reduceMotion]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, progress.value)) * 100}%`,
  }));

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${count}`}
      accessibilityValue={{ min: 0, max: count, now: step }}
      style={{
        height: HEIGHT,
        borderRadius: HEIGHT / 2,
        borderWidth: OUTLINE,
        borderColor: BRAND_INK,
        backgroundColor: WHITE,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={[
          { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: INNER_RADIUS, backgroundColor: BRAND_PURPLE, overflow: 'hidden' },
          fillStyle,
        ]}
      >
        <View
          style={{
            position: 'absolute',
            top: 3,
            left: INNER_RADIUS,
            right: INNER_RADIUS,
            height: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.35)',
          }}
        />
      </Animated.View>
    </View>
  );
}
