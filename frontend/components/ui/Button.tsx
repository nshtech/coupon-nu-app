import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { BRAND_CREAM, BRAND_INK, BRAND_YELLOW, OUTLINE, SHADOW } from '@/constants/Colors';
import { RaisedPressable, surface } from '@/components/ui/Raised';

// Primary: the yellow pill with a hard shadow. At most one per screen.
// Dark: ink fill, cream text, flat (e.g. "Done").

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  // replaces the label, e.g. a spinner while a purchase is in flight
  children?: ReactNode;
  // 'sm' is the 48pt button used inside panels
  size?: 'md' | 'sm';
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

const HEIGHT = { md: 58, sm: 48 };
const FONT = { md: 18, sm: 16 };

function Label({ label, size, color, loading }: { label: string; size: 'md' | 'sm'; color: string; loading?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {loading ? <ActivityIndicator color={color} style={{ marginRight: 8 }} /> : null}
      <Text style={{ flexShrink: 1, textAlign: 'center', fontFamily: 'Figtree_700Bold', fontSize: FONT[size], color }} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled, loading, children, size = 'md', style, accessibilityHint }: ButtonProps) {
  return (
    <RaisedPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
      radius={HEIGHT[size] / 2}
      offset={SHADOW}
      // a disabled button is not tappable, so it loses its shadow
      shadow={!disabled}
      style={[{ marginRight: SHADOW, marginBottom: SHADOW }, style]}
      faceStyle={[
        surface(HEIGHT[size] / 2, BRAND_YELLOW),
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? 22 : 28,
          paddingVertical: 8,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.55 : 1,
        },
      ]}
    >
      {children ?? <Label label={label} size={size} color={BRAND_INK} loading={loading} />}
    </RaisedPressable>
  );
}

export function DarkButton({ label, onPress, disabled, loading, children, size = 'md', style, accessibilityHint }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
      style={[
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? 22 : 28,
          paddingVertical: 8,
          borderRadius: HEIGHT[size] / 2,
          borderWidth: OUTLINE,
          borderColor: BRAND_INK,
          backgroundColor: BRAND_INK,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.7 : 1 }}>
          {children ?? <Label label={label} size={size} color={BRAND_CREAM} loading={loading} />}
        </View>
      )}
    </Pressable>
  );
}

// Plain text action, e.g. "Restore purchase" or "Clear all"
export function TextButton({ label, onPress, disabled, style, color = BRAND_INK, underline }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  color?: string;
  underline?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled) }}
      hitSlop={8}
      style={[{ minHeight: 44, justifyContent: 'center', opacity: disabled ? 0.45 : 1 }, style]}
    >
      {({ pressed }) => (
        <Text style={{ opacity: pressed ? 0.6 : 1, fontFamily: 'Figtree_700Bold', fontSize: 16, color, textDecorationLine: underline ? 'underline' : 'none' }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
