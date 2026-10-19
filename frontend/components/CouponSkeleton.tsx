import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { BRAND_TAN } from '@/constants/Colors';

// Skeleton placeholder laid over a coupon card while the list refreshes. It
// covers the real card (the parent must be sized by the card) instead of
// replacing it, so the list keeps its layout, and fades away when done.

const VARIANTS = {
  // CouponThumbnail: 96 px logo tile, category chip, title, offer, uses line
  thumbnail: { radius: 24, padding: 16, tile: 96, tileRadius: 16, lines: [56, 140, '90%', '70%', 80] },
  // CouponHistoryCard: 56 px logo tile, title, offer, used-on line
  history: { radius: 16, padding: 12, tile: 56, tileRadius: 12, lines: [120, '85%', 150] },
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
        right: 0,
        bottom: 0,
        left: 0,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: BRAND_TAN,
        backgroundColor: 'white',
        borderRadius: shape.radius,
        padding: shape.padding,
        opacity: fade,
      }}
    >
      <Animated.View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', opacity: pulse }}>
        <View
          className="bg-brand-cream"
          style={{ width: shape.tile, height: shape.tile, borderRadius: shape.tileRadius }}
        />
        <View style={{ flex: 1, marginLeft: shape.padding, gap: 8 }}>
          {shape.lines.map((width, index) => (
            <View key={index} className="h-3 rounded-full bg-brand-cream" style={{ width }} />
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
