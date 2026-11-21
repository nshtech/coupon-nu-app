import { Pressable, StyleProp, View, ViewStyle } from 'react-native';
import { BRAND_HEART, BRAND_INK, OUTLINE, WHITE } from '@/constants/Colors';
import Icon from '@/components/ui/Icon';

// White circle, ink outline, ink line heart. Saved = the heart itself fills
// pink-red; the circle stays white. Never yellow.

type HeartButtonProps = {
  saved: boolean;
  onPress: () => void;
  vendor: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export default function HeartButton({ saved, onPress, vendor, size = 40, style }: HeartButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={saved ? `Remove ${vendor} from saved` : `Save ${vendor}`}
      accessibilityState={{ selected: saved }}
      hitSlop={6}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: OUTLINE,
          borderColor: BRAND_INK,
          backgroundColor: WHITE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {({ pressed }) => (
        <View style={{ opacity: pressed ? 0.5 : 1 }}>
          <Icon name="heart" size={20} color={saved ? BRAND_HEART : BRAND_INK} fill={saved ? BRAND_HEART : 'none'} />
        </View>
      )}
    </Pressable>
  );
}
