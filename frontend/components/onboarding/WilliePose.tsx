import { ImageSourcePropType, Text } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { BRAND_PURPLE } from '@/constants/Colors';
import { useEntrance } from '@/components/onboarding/useEntrance';

// A Willie pose that eases up into place when its step appears, then holds
// still. `sleeping` adds z's above his head.

type WilliePoseProps = {
  source: ImageSourcePropType;
  width: number;
  height: number;
  label: string;
  sleeping?: boolean;
  delay?: number;
};

export default function WilliePose({ source, width, height, label, sleeping = false, delay = 0 }: WilliePoseProps) {
  const entrance = useEntrance({ delay, y: 14 });

  return (
    <Animated.View style={[{ width, height }, entrance]}>
      <Image source={source} contentFit="contain" accessibilityLabel={label} style={{ width, height }} />
      {sleeping ? (
        <Text
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={{
            position: 'absolute',
            left: width * 0.24,
            top: -height * 0.1,
            fontFamily: 'Chewy_400Regular',
            fontSize: 22,
            color: BRAND_PURPLE,
          }}
        >
          z z
        </Text>
      ) : null}
    </Animated.View>
  );
}
