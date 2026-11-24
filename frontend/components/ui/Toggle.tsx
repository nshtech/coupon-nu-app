import { Pressable, View } from 'react-native';
import { BRAND_GREEN, BRAND_INK, OUTLINE, WHITE } from '@/constants/Colors';

// Outlined pill switch. Off = white track, ink knob. On = green track, white
// outlined knob. Moves without animation, like every routine control.

type ToggleProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  accessibilityLabel: string;
  accessibilityHint?: string;
};

export default function Toggle({ value, onValueChange, disabled, accessibilityLabel, accessibilityHint }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ checked: value, disabled: Boolean(disabled) }}
      hitSlop={8}
      style={{
        width: 54,
        height: 32,
        borderRadius: 16,
        borderWidth: OUTLINE,
        borderColor: BRAND_INK,
        backgroundColor: value ? BRAND_GREEN : WHITE,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        style={
          value
            ? { position: 'absolute', top: 2, left: 25, width: 24, height: 24, borderRadius: 12, backgroundColor: WHITE, borderWidth: OUTLINE, borderColor: BRAND_INK }
            : { position: 'absolute', top: 3, left: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: BRAND_INK }
        }
      />
    </Pressable>
  );
}
