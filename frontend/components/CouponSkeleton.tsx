import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { BRAND_INK, BRAND_LILAC, OUTLINE, RADIUS, SHADOW, WHITE } from '@/constants/Colors';

// Skeleton placeholder laid over a coupon card while the list refreshes. It
// covers the real card (the parent must be sized by the card, which leaves
// SHADOW points on the right and bottom for its shadow) instead of replacing
// it, so the list keeps its layout, and fades away when done.

const VARIANTS = {
  // CouponThumbnail: 112 pt photo column, name, offer, description, uses line
  thumbnail: { radius: RADIUS.card, column: 112, lines: [96, '80%', '90%', 72] },
  // CouponHistoryCard: 60 pt logo, name, offer, used-on line
  history: { radius: RADIUS.card, column: 0, lines: [120, 90, 150] },
} as const;

type CouponSkeletonProps = {
  visible: boolean;
  variant: keyof typeof VARIANTS;
};

export default function CouponSkeleton({ visible, variant }: CouponSkeletonProps) {
  const reduceMotion = useReducedMotion();
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const shape = VARIANTS[variant];

  useEffect(() => {
    Animated.timing(fade, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : 220,
      useNativeDriver: true,
    }).start();
    if (!visible || reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const step = (toValue: number) =>
      Animated.timing(pulse, { toValue, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    const loop = Animated.loop(Animated.sequence([step(0.45), step(1)]));
    loop.start();
    return () => loop.stop();
  }, [visible, reduceMotion, fade, pulse]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: SHADOW,
        bottom: SHADOW,
        flexDirection: 'row',
        borderWidth: OUTLINE,
        borderColor: BRAND_INK,
        backgroundColor: WHITE,
        borderRadius: shape.radius,
        overflow: 'hidden',
        opacity: fade,
      }}
    >
      <Animated.View style={{ flex: 1, flexDirection: 'row', opacity: pulse }}>
        {shape.column ? (
          <View style={{ width: shape.column, backgroundColor: BRAND_LILAC, borderRightWidth: OUTLINE, borderRightColor: BRAND_INK }} />
        ) : (
          <View style={{ width: 60, height: 60, margin: 12, borderRadius: 14, backgroundColor: BRAND_LILAC }} />
        )}
        <View style={{ flex: 1, padding: 14, gap: 10, justifyContent: 'center' }}>
          {shape.lines.map((width, index) => (
            <View key={index} style={{ height: 12, borderRadius: 6, width, backgroundColor: BRAND_LILAC }} />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
