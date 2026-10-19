import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

// Primary call to action: a darker base peeks out under the purple face and
// the face sinks onto it while pressed.

type TactileButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  // replaces the label, e.g. a spinner while a purchase is in flight
  children?: ReactNode;
  className?: string;
  textClassName?: string;
};

export default function TactileButton({ label, onPress, disabled, children, className = '', textClassName = 'text-brand-cream' }: TactileButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      className={`${className} ${disabled ? 'opacity-60' : ''}`}
    >
      {({ pressed }) => (
        <View className="rounded-full bg-brand-ink">
          <View
            className="min-h-16 items-center justify-center rounded-full bg-brand-purple px-6"
            style={{ transform: [{ translateY: pressed ? -1 : -5 }] }}
          >
            {children ?? <Text className={`font-display-medium text-xl ${textClassName}`}>{label}</Text>}
          </View>
        </View>
      )}
    </Pressable>
  );
}
