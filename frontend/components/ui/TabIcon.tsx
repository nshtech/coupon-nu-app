import { ReactNode } from 'react';
import { Image } from 'expo-image';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { BRAND_INK, BRAND_MUTED, BRAND_WILLIE } from '@/constants/Colors';

// Tab bar icons drawn for this app (assets/icons/tab-*.svg in the mockups).
// Inactive: muted outline, no fill. Active: filled with Willie's purple, with
// the same shape in solid ink offset 1.6 down-right behind it. Profile is
// Willie's own face, full color when active and greyed out when not.

export type TabIconName = 'discover' | 'saved' | 'used' | 'profile';

const SHAPES: Record<Exclude<TabIconName, 'profile'>, { shape: ReactNode; detail?: (color: string) => ReactNode }> = {
  discover: {
    shape: <Circle cx={10.5} cy={10.5} r={6.5} />,
    detail: () => <Path d="M15.3 15.3 20.5 20.5" strokeWidth={2.8} />,
  },
  saved: {
    shape: <Path d="M12 20.5s-8-4.7-8-10.5a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 10.5-8 10.5Z" />,
  },
  // a coupon torn in two, with a % on the left half
  used: {
    shape: (
      <>
        <G transform="rotate(-9 11 18)">
          <Path d="M1.5 6.5h9l-1.6 2.8 1.6 2.7-1.6 2.7 1.6 2.8h-9v-3.2a2.3 2.3 0 0 0 0-4.6V6.5Z" />
        </G>
        <G transform="rotate(9 13 18)">
          <Path d="M14 6.5h8.5v3.2a2.3 2.3 0 0 0 0 4.6v3.2H14l-1.6-2.8 1.6-2.7-1.6-2.7 1.6-2.8Z" />
        </G>
      </>
    ),
    detail: color => (
      <G transform="rotate(-9 11 18)">
        <Path d="M4.3 14.2 7.3 9.8" strokeWidth={1.5} />
        <Circle cx={4.2} cy={10.3} r={0.5} fill={color} strokeWidth={1.3} />
        <Circle cx={7.4} cy={13.7} r={0.5} fill={color} strokeWidth={1.3} />
      </G>
    ),
  },
};

export default function TabIcon({ name, focused }: { name: TabIconName; focused: boolean }) {
  if (name === 'profile') {
    return (
      <Image
        source={
          focused
            ? require('@/assets/images/willie/willie-face-tab.png')
            : require('@/assets/images/willie/willie-face-tab-inactive.png')
        }
        style={{ width: 30, height: 21, marginVertical: 3.5 }}
        contentFit="contain"
        accessible={false}
      />
    );
  }

  const { shape, detail } = SHAPES[name];
  const color = focused ? BRAND_INK : BRAND_MUTED;

  return (
    <Svg
      width={name === 'used' ? 32 : 28}
      height={28}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {focused ? (
        <G fill={BRAND_INK} transform="translate(1.6 1.6)">
          {shape}
        </G>
      ) : null}
      <G fill={focused ? BRAND_WILLIE : 'none'}>{shape}</G>
      {detail?.(color)}
    </Svg>
  );
}
