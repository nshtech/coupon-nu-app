import { ReactNode } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { BRAND_CREAM, BRAND_INK, BRAND_MUTED, OUTLINE, WHITE } from '@/constants/Colors';

// The coupon itself: a white outlined card split by a dashed tear line with a
// half-circle notch at each end. Used for coupon details and the redeemed coupon.

const RADIUS = 20;
const NOTCH = 20;

export function Ticket({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        { borderWidth: OUTLINE, borderColor: BRAND_INK, borderRadius: RADIUS, backgroundColor: WHITE, overflow: 'hidden' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// `background` is whatever the ticket sits on, so the notches look cut out
export function TicketTear({ background = BRAND_CREAM }: { background?: string }) {
  const notch = (side: 'left' | 'right') => (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 1 - NOTCH / 2,
        // centred on the ticket's outer edge; the ticket clips the outer half
        [side]: -OUTLINE - NOTCH / 2,
        width: NOTCH,
        height: NOTCH,
        borderRadius: NOTCH / 2,
        borderWidth: OUTLINE,
        borderColor: BRAND_INK,
        backgroundColor: background,
      }}
    />
  );

  return (
    <View style={{ height: 2, paddingHorizontal: 14 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height={2}>
        <Line x1="0" y1="1" x2="100%" y2="1" stroke={BRAND_INK} strokeWidth={2} strokeDasharray="6 4" />
      </Svg>
      {notch('left')}
      {notch('right')}
    </View>
  );
}

export function TicketRow({ label, value, valueAccessibilityLabel }: { label: string; value: string; valueAccessibilityLabel?: string }) {
  return (
    <View
      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18 }}
      accessible
      accessibilityLabel={`${label}: ${valueAccessibilityLabel ?? value}`}
    >
      <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 15, color: BRAND_MUTED }}>{label}</Text>
      <Text style={{ marginLeft: 16, flexShrink: 1, textAlign: 'right', fontFamily: 'Figtree_700Bold', fontSize: 15, color: BRAND_INK }}>
        {value}
      </Text>
    </View>
  );
}
