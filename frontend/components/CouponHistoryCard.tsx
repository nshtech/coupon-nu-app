import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_PURPLE_SOFT, CARD_SHADOW } from '@/constants/Colors';
import { logoZoomStyle } from '@/utils/couponImages';

// Compact row for the Used tab. Opens the same read-only usage receipt the
// coupon sheet shows for redeemed coupons.

type CouponHistoryCardProps = {
  coupon: any;
  lastUsedAt: string;
  timesUsed: number;
  // true once usage_limit is reached (the app's "expired" state)
  isExpired: boolean;
};

const formatUsedDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function CouponHistoryCard({ coupon, lastUsedAt, timesUsed, isExpired }: CouponHistoryCardProps) {
  const router = useRouter();
  const [imageFailed, setImageFailed] = useState(false);

  const usageLine = coupon.usage_limit === 0
    ? `Used ${timesUsed} time${timesUsed === 1 ? '' : 's'}`
    : `${timesUsed} of ${coupon.usage_limit} use${coupon.usage_limit === 1 ? '' : 's'}`;

  const openReceipt = () => {
    router.push({
      pathname: '/coupon-detail',
      params: { coupon: JSON.stringify(coupon), usedAt: lastUsedAt },
    });
  };

  return (
    <Pressable
      onPress={openReceipt}
      accessibilityRole="button"
      accessibilityLabel={`${coupon.vendor}, ${coupon.offer}. Last used ${formatUsedDate(lastUsedAt)}. ${usageLine}.${isExpired ? ' Redeemed.' : ''}`}
      className="flex-row items-center rounded-2xl border border-brand-tan bg-white p-3 active:opacity-80"
      style={CARD_SHADOW}
    >
      <View className={`h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-brand-cream ${isExpired ? 'opacity-50' : ''}`}>
        {coupon.image_url && !imageFailed ? (
          <Image
            source={{ uri: coupon.image_url }}
            contentFit="cover"
            onError={() => setImageFailed(true)}
            style={{ width: '100%', height: '100%', ...logoZoomStyle(coupon.vendor) }}
          />
        ) : (
          <Ionicons name="pricetag-outline" size={22} color={BRAND_PURPLE_SOFT} />
        )}
      </View>

      <View className="ml-3 flex-1">
        <Text
          numberOfLines={1}
          className={`font-display text-base ${isExpired ? 'text-brand-purple-soft' : 'text-brand-purple'}`}
        >
          {coupon.vendor}
        </Text>
        <Text numberOfLines={1} className={`font-body text-sm ${isExpired ? 'text-brand-purple-soft' : 'text-brand-ink'}`}>
          {coupon.offer}
        </Text>
        <Text className="mt-1 font-body-medium text-xs text-brand-purple-soft">
          Used {formatUsedDate(lastUsedAt)} · {usageLine}
        </Text>
      </View>

      {isExpired ? (
        <View className="ml-2 rounded-full bg-brand-cream-soft px-2.5 py-1">
          <Text className="font-display-medium text-xs text-brand-purple-soft">Redeemed</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
