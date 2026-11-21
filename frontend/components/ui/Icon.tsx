import { ReactNode } from 'react';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { BRAND_INK } from '@/constants/Colors';

// Line icons drawn for the app (willies-wallet-app-mockups/assets/icons):
// 24pt grid, round caps and joins, ink by default. They sit bare, never inside
// a tinted circle or tile.

const ICONS = {
  search: (
    <>
      <Circle cx={11} cy={11} r={7} />
      <Path d="m20 20-3.5-3.5" />
    </>
  ),
  filters: (
    <>
      <Path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <Circle cx={16} cy={7} r={2} />
      <Circle cx={8} cy={17} r={2} />
    </>
  ),
  food: <Path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3c-2 1-3 4-3 7h3m0-7v18" />,
  coffee: <Path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9ZM16 10h2a2 2 0 0 1 0 5h-2M8 3v2M12 3v2" />,
  treats: (
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M9 9.5v.01M14.5 8.5v.01M15.5 13.5v.01M10.5 14.5v.01" />
    </>
  ),
  fitness: <Path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12" />,
  shopping: <Path d="M5 8h14l-1 12H6L5 8ZM9 8a3 3 0 0 1 6 0" />,
  // beauty and things-to-do were not in the mockups; drawn in the same style
  beauty: <Path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5ZM19 16v4M17 18h4" />,
  fun: (
    <>
      <Path d="M3 9V6h18v3a3 3 0 0 0 0 6v3H3v-3a3 3 0 0 0 0-6Z" />
      <Path d="M14 6v2.5M14 11v2M14 15.5V18" />
    </>
  ),
  heart: <Path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.5 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />,
  check: <Path d="m5 12 5 5L20 7" />,
  chevronRight: <Path d="m9 6 6 6-6 6" />,
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  back: <Path d="M19 12H5M11 6l-6 6 6 6" />,
  location: (
    <>
      <Path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <Circle cx={12} cy={10} r={2.5} />
    </>
  ),
  unsubscribe: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  meetWillie: (
    <>
      <Path d="M12 13c-2.6 0-4.7 2.1-4.7 4.2 0 1.5 1.2 2.5 2.7 2.5.8 0 1.3-.4 2-.4s1.2.4 2 .4c1.5 0 2.7-1 2.7-2.5 0-2.1-2.1-4.2-4.7-4.2Z" />
      <Circle cx={6.3} cy={10.8} r={1.5} />
      <Circle cx={9.8} cy={6.6} r={1.6} />
      <Circle cx={14.2} cy={6.6} r={1.6} />
      <Circle cx={17.7} cy={10.8} r={1.5} />
    </>
  ),
  support: (
    <>
      <Path d="M4 5h16v11H10l-5 4v-4H4V5Z" />
      <Path d="M9 10.5h6" />
    </>
  ),
  document: (
    <>
      <Path d="M6 3h8l4 4v14H6V3Z" />
      <Path d="M14 3v4h4M9 13h6M9 17h4" />
    </>
  ),
  // not in the mockups; same style, for the rows under Terms of Service
  lock: (
    <>
      <Path d="M6 11h12v9H6v-9Z" />
      <Path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  trash: <Path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13M10 11v5M14 11v5" />,
  logout: <Path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" />,
  sparkle: <Path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5Z" />,
  tag: (
    <>
      <Path d="M3 12V4h8l9 9-8 8-9-9Z" />
      <Circle cx={7.5} cy={8} r={1.25} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  // fills closed shapes, e.g. a saved heart
  fill?: string;
};

export default function Icon({ name, size = 22, color = BRAND_INK, strokeWidth = 2.25, fill = 'none' }: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <G fill={fill}>{ICONS[name]}</G>
    </Svg>
  );
}
