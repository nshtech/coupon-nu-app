import { Text, TextProps } from 'react-native';
import { BRAND_INK } from '@/constants/Colors';

// Display type: Bricolage Grotesque 800, uppercase, letter-spacing -0.02em,
// line-height 0.95. Used for headlines, offers, names and the countdown.
// Sizes of 36pt and up use the cut drawn for large sizes (optical size 48),
// smaller ones the cut for text sizes (optical size 28).

type DisplayProps = TextProps & {
  size: number;
  color?: string;
};

export default function Display({ size, color = BRAND_INK, style, children, ...rest }: DisplayProps) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: size >= 36 ? 'BricolageGrotesqueDisplay_800ExtraBold' : 'BricolageGrotesque_800ExtraBold',
          fontSize: size,
          lineHeight: Math.round(size * 0.95),
          letterSpacing: -0.02 * size,
          textTransform: 'uppercase',
          color,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
