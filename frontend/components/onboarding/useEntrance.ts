import { useEffect } from 'react';
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

// The one motion the intro uses: a soft spring that settles with barely any
// overshoot. Nothing loops or bounces in place.
export const SOFT_SPRING = { damping: 20, stiffness: 140 };

// Fades an element in and eases it a few points into place when it mounts.
// Onboarding steps remount their content, so each step settles in fresh.
// Off under reduced motion.
export function useEntrance({ delay = 0, x = 0, y = 10 }: { delay?: number; x?: number; y?: number } = {}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withDelay(delay, withSpring(1, SOFT_SPRING));
  }, []);

  return useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateX: (1 - progress.value) * x }, { translateY: (1 - progress.value) * y }],
  }));
}
