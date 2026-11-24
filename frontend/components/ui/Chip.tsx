import { Pressable, Text, View } from 'react-native';
import { BRAND_CREAM, BRAND_INK, OUTLINE, WHITE } from '@/constants/Colors';
import Icon, { IconName } from '@/components/ui/Icon';

// White pill, 44pt tall, 2px outline. Selected = ink fill, cream text.

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: IconName;
  // number of applied filters, shown after the label
  count?: number;
  // shows an x after the label: tapping removes the filter
  removable?: boolean;
  accessibilityLabel?: string;
};

export default function Chip({ label, selected, onPress, icon, count, removable, accessibilityLabel }: ChipProps) {
  const color = selected ? BRAND_CREAM : BRAND_INK;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      style={{
        height: 44,
        justifyContent: 'center',
        paddingHorizontal: 16,
        borderRadius: 22,
        borderWidth: OUTLINE,
        borderColor: BRAND_INK,
        backgroundColor: selected ? BRAND_INK : WHITE,
      }}
    >
      {({ pressed }) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.6 : 1 }}>
      {icon ? (
        <View style={{ marginRight: 7 }}>
          <Icon name={icon} size={18} color={color} />
        </View>
      ) : null}
      <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 15, color }}>
        {label}
        {count ? ` · ${count}` : ''}
      </Text>
      {removable ? (
        <View style={{ marginLeft: 6 }}>
          <Icon name="close" size={14} color={color} strokeWidth={2.5} />
        </View>
      ) : null}
      </View>
      )}
    </Pressable>
  );
}
