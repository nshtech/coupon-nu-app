import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BRAND_INK, BRAND_MUTED, OUTLINE, RADIUS, SHADOW, WHITE } from '@/constants/Colors';
import { dealCopy } from '@/utils/dealCopy';
import { RaisedPressable } from '@/components/ui/Raised';
import Display from '@/components/ui/Display';
import Icon from '@/components/ui/Icon';
import LogoBadge from '@/components/ui/LogoBadge';

// Row for the Used tab. Opens the same read-only usage receipt the coupon sheet
// shows for redeemed coupons. A coupon that can be used again is a raised card
// with a chevron; a used-up one goes flat: dashed outline, no shadow, grey
// logo, "Used up" in muted text.

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
  const copy = dealCopy(coupon);

  const usageCount = coupon.usage_limit === 0
    ? `${timesUsed} time${timesUsed === 1 ? '' : 's'}`
    : `${timesUsed} of ${coupon.usage_limit} use${coupon.usage_limit === 1 ? '' : 's'}`;
  const whenLine = isExpired
    ? `Used ${formatUsedDate(lastUsedAt)}`
    : `Last used ${formatUsedDate(lastUsedAt)} · ${usageCount}`;

  const openReceipt = () => {
    router.push({
      pathname: '/coupon-detail',
      params: { couponId: String(coupon.coupon_id), usedAt: lastUsedAt },
    });
  };

  return (
    <RaisedPressable
      onPress={openReceipt}
      accessibilityRole="button"
      accessibilityLabel={`${coupon.vendor}, ${coupon.offer}. ${whenLine}.${isExpired ? ' Used up.' : ''}`}
      accessibilityHint="Shows when you used it"
      radius={RADIUS.card}
      shadow={!isExpired}
      style={{ marginRight: SHADOW, marginBottom: SHADOW }}
      faceStyle={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingLeft: 12,
        paddingRight: 14,
        borderRadius: RADIUS.card,
        borderWidth: OUTLINE,
        borderColor: BRAND_INK,
        borderStyle: isExpired ? 'dashed' : 'solid',
        backgroundColor: isExpired ? 'transparent' : WHITE,
      }}
    >
      <LogoBadge coupon={coupon} size={60} radius={14} padding={5} spent={isExpired} />

      <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 8 }}>
        {copy.business ? (
          <Text numberOfLines={1} style={{ fontFamily: 'Figtree_700Bold', fontSize: 15, color: BRAND_MUTED }}>
            {copy.business}
          </Text>
        ) : null}
        <Display size={22} numberOfLines={2} color={isExpired ? BRAND_MUTED : BRAND_INK} style={{ marginTop: copy.business ? 2 : 0 }}>
          {copy.headline}
        </Display>
        {/* without a short offer headline, the offer sentence tells deals from one business apart */}
        {!copy.business && copy.description ? (
          <Text numberOfLines={1} style={{ marginTop: 2, fontFamily: 'Figtree_400Regular', fontSize: 14, color: BRAND_MUTED }}>
            {copy.description}
          </Text>
        ) : null}
        <Text numberOfLines={1} style={{ marginTop: 3, fontFamily: 'Figtree_600SemiBold', fontSize: 13, color: BRAND_MUTED }}>
          {whenLine}
        </Text>
      </View>

      {isExpired ? (
        <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 14, color: BRAND_MUTED }}>Used up</Text>
      ) : (
        <Icon name="chevronRight" size={22} color={BRAND_INK} strokeWidth={2.5} />
      )}
    </RaisedPressable>
  );
}
