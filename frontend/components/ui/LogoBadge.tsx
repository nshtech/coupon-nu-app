import { useState } from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { BRAND_INK, BRAND_PURPLE, OUTLINE, WHITE } from '@/constants/Colors';
import { logoBackground, logoZoom } from '@/utils/couponImages';

// The business logo in a white outlined badge (or the logo's own color for the
// few drawn on one). `spent` greys the logo out for used-up coupons.

type LogoBadgeProps = {
  coupon: any;
  size: number;
  radius: number;
  padding: number;
  spent?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function LogoBadge({ coupon, size, radius, padding, spent, style }: LogoBadgeProps) {
  const [failed, setFailed] = useState(false);
  const hasImage = typeof coupon?.image_url === 'string' && coupon.image_url && !failed;
  const background = logoBackground(coupon?.vendor) ?? WHITE;
  // Zoomed logos are drawn larger than the badge and cropped by it, rather than
  // scaled with a transform, so the image is decoded at the size it shows at
  // and stays sharp. Centred inside the outline (absolute children ignore the
  // badge's padding).
  const zoom = logoZoom(coupon?.vendor);
  const imageSize = (size - OUTLINE * 2 - padding * 2) * zoom;
  const imageOffset = (size - OUTLINE * 2 - imageSize) / 2;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          padding,
          borderRadius: radius,
          borderWidth: OUTLINE,
          borderColor: BRAND_INK,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          isolation: 'isolate',
        },
        style,
      ]}
      accessible={false}
    >
      {hasImage ? (
        <Image
          source={{ uri: coupon.image_url }}
          contentFit="contain"
          transition={150}
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            left: imageOffset,
            top: imageOffset,
            width: imageSize,
            height: imageSize,
            opacity: spent ? 0.6 : 1,
          }}
        />
      ) : (
        <Text style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: size * 0.45, color: spent ? '#8A8A8A' : BRAND_PURPLE }}>
          {coupon?.vendor?.trim()?.[0]?.toUpperCase()}
        </Text>
      )}
      {spent ? (
        // a grey layer in "saturation" blend mode drains the color out of the logo
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#808080', mixBlendMode: 'saturation' }}
        />
      ) : null}
    </View>
  );
}
