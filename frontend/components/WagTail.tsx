import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, NativeScrollEvent, NativeSyntheticEvent, Platform, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { BRAND_CREAM, BRAND_PURPLE } from '@/constants/Colors';

// Willie's tail, used as the pull-to-refresh indicator. It is tucked behind the
// bottom of the purple header (the parent must draw the header above it), slides
// down as the list is pulled, and wags while the refresh runs. useTailRefresh
// wires a scroll view to it so no spinner shows.

// the artwork is drawn at 44×84 and scaled up
const TAIL_WIDTH = 70;
const TAIL_HEIGHT = 134;
// how much of the tail stays tucked behind the header when fully out
const BASE_OVERLAP = 10;
// pull distance at which the tail is all the way out
const FULL_PULL = 100;
// pull distance that triggers a refresh when the finger lifts
const REFRESH_PULL = 80;
// long enough to see a few wags, even when the fetch is quick
const MIN_REFRESH_MS = 1200;

type WagTailProps = {
  // the list's scroll offset; negative while pulling
  scrollY: Animated.Value;
  isWagging: boolean;
};

export default function WagTail({ scrollY, isWagging }: WagTailProps) {
  const reduceMotion = useReducedMotion();
  const wag = useRef(new Animated.Value(0)).current;
  // holds the tail out while refreshing, even after the finger lifts
  const held = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(held, { toValue: isWagging ? 1 : 0, useNativeDriver: true }).start();
    if (!isWagging || reduceMotion) {
      Animated.spring(wag, { toValue: 0, useNativeDriver: true }).start();
      return;
    }
    const swing = (toValue: number, duration: number) =>
      Animated.timing(wag, { toValue, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([swing(1, 160), swing(-1, 320), swing(0, 160)]));
    loop.start();
    return () => loop.stop();
  }, [isWagging, reduceMotion, wag, held]);

  const motion = useMemo(() => {
    const pulled = scrollY.interpolate({ inputRange: [-FULL_PULL, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    const reveal = Animated.add(pulled, held).interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
    const wagDegrees = wag.interpolate({ inputRange: [-1, 1], outputRange: [-20, 20] });
    const leanDegrees = scrollY.interpolate({ inputRange: [-120, 0], outputRange: [10, 0], extrapolate: 'clamp' });
    return {
      translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, TAIL_HEIGHT - BASE_OVERLAP] }),
      rotate: Animated.add(wagDegrees, leanDegrees).interpolate({
        inputRange: [-360, 360],
        outputRange: ['-360deg', '360deg'],
      }),
    };
  }, [scrollY, held, wag]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        top: -TAIL_HEIGHT,
        left: '50%',
        marginLeft: -TAIL_WIDTH / 2,
        width: TAIL_WIDTH,
        height: TAIL_HEIGHT,
        transformOrigin: 'top',
        transform: [{ translateY: motion.translateY }, { rotate: motion.rotate }],
      }}
    >
      <Svg width={TAIL_WIDTH} height={TAIL_HEIGHT} viewBox="0 0 44 84">
        <Path
          d="M22 0 C22 20 10 28 13 45 C16 59 32 57 32 67"
          stroke={BRAND_PURPLE}
          strokeWidth={11}
          strokeLinecap="round"
          fill="none"
        />
        <Path d="M32 67 C32 73 30 77 26 79" stroke={BRAND_CREAM} strokeWidth={11} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

// Pull-to-refresh for a scroll view that shows WagTail. On iOS the pull is read
// from the scroll offset, since RefreshControl draws its spinner even when
// tinted transparent. Android lists do not overscroll, so they keep a
// RefreshControl with an invisible spinner.
export function useTailRefresh(refresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRunning = useRef(false);

  // only a pull gets the haptic, like the system refresh control; a
  // "Try again" button calling handleRefresh does not
  const runRefresh = useCallback(async (pulled: boolean) => {
    if (isRunning.current) return;
    isRunning.current = true;
    if (pulled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsRefreshing(true);
    await Promise.all([refresh(), new Promise(resolve => setTimeout(resolve, MIN_REFRESH_MS))]);
    isRunning.current = false;
    setIsRefreshing(false);
  }, [refresh]);

  const handleRefresh = useCallback(() => runRefresh(false), [runRefresh]);

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (Platform.OS === 'ios' && event.nativeEvent.contentOffset.y <= -REFRESH_PULL) runRefresh(true);
    },
    [runRefresh]
  );

  const refreshControl =
    Platform.OS === 'android' ? (
      <RefreshControl
        refreshing={isRefreshing}
        onRefresh={() => runRefresh(true)}
        colors={['transparent']}
        progressBackgroundColor="transparent"
      />
    ) : undefined;

  return { isRefreshing, handleRefresh, onScrollEndDrag, refreshControl };
}
