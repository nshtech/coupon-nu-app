import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { BRAND_INK, BRAND_PURPLE, OUTLINE, WHITE } from '@/constants/Colors';
import { SOFT_SPRING } from '@/components/onboarding/useEntrance';

// Willie's speech bubble. It eases in, then types its text out one letter at a
// time; a tap shows the rest at once. The untyped letters are laid out but
// transparent, so the bubble keeps its final size while typing. Not
// tappable-looking (no shadow): the tap is a shortcut, not a control.

const CHAR_MS = 24;
// a beat between the pop and the first letter
const TYPE_DELAY_MS = 140;
export const TAIL = 12;

type SpeechBubbleProps = {
  text: string;
  // 'down' points at Willie under the bubble, 'left' at Willie beside it
  tail: 'down' | 'left';
  // where the down tail sits, as a share of the bubble's width
  tailAt?: number;
  fontSize?: number;
  style?: StyleProp<ViewStyle>;
};

export default function SpeechBubble({ text, tail, tailAt = 0.5, fontSize = 22, style }: SpeechBubbleProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? text.length : 0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pop = useSharedValue(reduceMotion ? 1 : 0);

  const stopTyping = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }, []);

  const showAll = useCallback(() => {
    stopTyping();
    setShown(text.length);
  }, [text, stopTyping]);

  useEffect(() => {
    if (reduceMotion) {
      setShown(text.length);
      return;
    }
    pop.value = withSpring(1, SOFT_SPRING);
    setShown(0);
    let count = 0;
    const start = setTimeout(() => {
      timer.current = setInterval(() => {
        count += 1;
        setShown(count);
        if (count >= text.length) stopTyping();
      }, CHAR_MS);
    }, TYPE_DELAY_MS);
    return () => {
      clearTimeout(start);
      stopTyping();
    };
  }, [text, reduceMotion]);

  const popStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pop.value, [0, 0.5], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: 0.97 + 0.03 * pop.value }],
  }));

  return (
    <Animated.View style={[{ transformOrigin: tail === 'down' ? 'bottom' : 'left' }, popStyle, style]}>
      <Pressable
        onPress={showAll}
        accessible
        accessibilityRole="text"
        accessibilityLabel={text}
        style={{
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 22,
          borderWidth: OUTLINE,
          borderColor: BRAND_INK,
          backgroundColor: WHITE,
        }}
      >
        <Text
          style={{
            textAlign: tail === 'down' ? 'center' : 'left',
            fontFamily: 'Chewy_400Regular',
            fontSize,
            lineHeight: Math.round(fontSize * 1.2),
            color: BRAND_PURPLE,
          }}
        >
          {text.slice(0, shown)}
          <Text style={{ color: 'transparent' }}>{text.slice(shown)}</Text>
        </Text>

        {/* the tail's fill covers the bubble's outline where they meet */}
        {tail === 'down' ? (
          <View
            pointerEvents="none"
            style={{ position: 'absolute', bottom: -TAIL - OUTLINE, left: `${tailAt * 100}%`, marginLeft: -12 }}
          >
            <Svg width={24} height={TAIL + OUTLINE}>
              <Path d={`M1 0 L12 ${TAIL} L23 0 Z`} fill={WHITE} />
              <Path d={`M1 1 L12 ${TAIL} L23 1`} stroke={BRAND_INK} strokeWidth={OUTLINE} strokeLinejoin="round" fill="none" />
            </Svg>
          </View>
        ) : (
          <View pointerEvents="none" style={{ position: 'absolute', left: -TAIL - OUTLINE, top: 12 }}>
            <Svg width={TAIL + OUTLINE} height={24}>
              <Path d={`M${TAIL + OUTLINE} 1 L0 12 L${TAIL + OUTLINE} 23 Z`} fill={WHITE} />
              <Path
                d={`M${TAIL + 1} 1 L1 12 L${TAIL + 1} 23`}
                stroke={BRAND_INK}
                strokeWidth={OUTLINE}
                strokeLinejoin="round"
                fill="none"
              />
            </Svg>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
