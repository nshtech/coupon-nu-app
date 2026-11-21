import { ReactNode } from 'react';
import { Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';
import { BRAND_INK, OUTLINE, SHADOW, WHITE } from '@/constants/Colors';

// The hard offset shadow: a solid ink copy of the shape sitting `offset` points
// down and to the right, no blur. Drawn as a real view rather than a native
// shadow so it looks the same on iOS and Android and is never clipped.
// The shadow sticks out past the box, so leave `offset` points of room on the
// right and bottom.

type ShadowProps = {
  offset?: number;
  radius: number;
};

function Shadow({ offset = SHADOW, radius }: ShadowProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: offset,
        left: offset,
        right: -offset,
        bottom: -offset,
        borderRadius: radius,
        backgroundColor: BRAND_INK,
      }}
    />
  );
}

// the outlined surface every card, chip and button is drawn on
export const surface = (radius: number, backgroundColor: string = WHITE): ViewStyle => ({
  borderWidth: OUTLINE,
  borderColor: BRAND_INK,
  borderRadius: radius,
  backgroundColor,
});

type RaisedProps = ShadowProps & {
  children: ReactNode;
  // outer box: margins, width, flex
  style?: StyleProp<ViewStyle>;
  // false draws the element flat (spent or not tappable)
  shadow?: boolean;
};

// A static element with a hard shadow. The child draws the surface.
export function Raised({ children, style, offset = SHADOW, radius, shadow = true }: RaisedProps) {
  return (
    <View style={style}>
      {shadow ? <Shadow offset={offset} radius={radius} /> : null}
      {children}
    </View>
  );
}

type RaisedPressableProps = Omit<PressableProps, 'style' | 'children'> &
  ShadowProps & {
    children: ReactNode;
    // outer box: margins, width, flex
    style?: StyleProp<ViewStyle>;
    // the face: outline, fill, padding, layout
    faceStyle?: StyleProp<ViewStyle>;
    shadow?: boolean;
  };

// A tappable element with a hard shadow. While pressed the face sinks onto its
// shadow; nothing springs or bounces.
export function RaisedPressable({
  children,
  style,
  faceStyle,
  offset = SHADOW,
  radius,
  shadow = true,
  disabled,
  ...pressableProps
}: RaisedPressableProps) {
  return (
    <Pressable {...pressableProps} disabled={disabled} style={style}>
      {({ pressed }) => {
        const sunk = shadow && pressed && !disabled;
        return (
          <>
            {shadow ? <Shadow offset={offset} radius={radius} /> : null}
            <View style={[faceStyle, sunk ? { transform: [{ translateX: offset }, { translateY: offset }] } : null]}>
              {children}
            </View>
          </>
        );
      }}
    </Pressable>
  );
}
