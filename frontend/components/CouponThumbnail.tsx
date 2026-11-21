import { useState } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useUsage } from '@/contexts/UsageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSavedCoupons } from '@/contexts/SavedCouponsContext';
import { BRAND_INK, BRAND_LILAC, BRAND_MUTED, OUTLINE, RADIUS, SHADOW, WHITE } from '@/constants/Colors';
import { couponPhoto } from '@/utils/couponImages';
import { dealCopy } from '@/utils/dealCopy';
import { RaisedPressable } from '@/components/ui/Raised';
import Display from '@/components/ui/Display';
import HeartButton from '@/components/ui/HeartButton';
import Icon from '@/components/ui/Icon';
import LogoBadge from '@/components/ui/LogoBadge';
import UsesLeft, { usesLeftLabel } from '@/components/ui/UsesLeft';

// Deal card for the Discover and Saved lists: photo on the left with the logo
// badge on it, then business name, offer headline, one-line description and
// uses left. Used-up coupons go flat with a dashed outline and grey pictures.
//
// Every card is the same height, so every photo is cropped to the same frame
// (112 × 150 at default text size). Long text is clamped to fit: the headline
// gets two lines and the description as many lines as are left.

export const PHOTO_WIDTH = 112;
const CARD_HEIGHT = 154;
// outline top and bottom plus the text column's vertical padding; the rest of
// the height is text and grows with the system text size
const CARD_CHROME = OUTLINE * 2 + 14 + 12;
const DESCRIPTION_LINE_HEIGHT = 20;

export default function CouponThumbnail({ coupon, couponTab }: { coupon: any; couponTab: "active" | "expired" }) {
    const router = useRouter();
    const { userCouponToUsages, userCouponToLastUsedAt } = useUsage();
    const { isSubscribed } = useSubscription();
    const { isSaved, toggleSaved, isSavingAvailable } = useSavedCoupons();
    const [photoFailed, setPhotoFailed] = useState(false);
    const [descriptionLines, setDescriptionLines] = useState(3);
    const { fontScale } = useWindowDimensions();
    const cardHeight = Math.round(CARD_CHROME + (CARD_HEIGHT - CARD_CHROME) * Math.max(1, fontScale));

    const handlePress = () => {
        // Simple validation
        if (!coupon || !coupon.coupon_id || !coupon.vendor || !coupon.offer) {
            console.error('Invalid coupon object:', coupon);
            return;
        }

        // expired coupons open a read-only usage receipt (when it was used /
        // when the redemption window expired) instead of the active flow
        const usedAt = couponTab === "expired" ? userCouponToLastUsedAt.get(coupon.coupon_id) : undefined;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        // only the id travels in the route; the sheet looks the coupon up in
        // CouponsContext rather than trusting params a deep link could forge
        router.push({
            pathname: '/coupon-detail',
            params: {
                couponId: String(coupon.coupon_id),
                ...(usedAt ? { usedAt } : {}),
            }
        });
    };

    const couponUses = userCouponToUsages.get(coupon.coupon_id) || 0;
    const usageLimit = coupon.usage_limit === 0 ? Infinity : coupon.usage_limit;
    const remainingUses = usageLimit - couponUses;

    // Pass-locked cards still show the whole deal so people can see what a pass
    // gets them; tapping opens the paywall. Expired (used-up) cards open the
    // usage receipt.
    const isExpired = couponTab === "expired";
    const isPassLocked = !isExpired && !isSubscribed;
    const saved = isSaved(coupon.coupon_id);
    const copy = dealCopy(coupon);
    const photo = photoFailed ? null : couponPhoto(coupon);
    const statusLabel = isExpired ? 'Used up' : isPassLocked ? 'Unlock with a pass' : usesLeftLabel(remainingUses);

    return (
        <View>
            <RaisedPressable
                onPress={handlePress}
                accessibilityRole="button"
                accessibilityLabel={[copy.business, copy.headline, copy.description, statusLabel].filter(Boolean).join('. ')}
                accessibilityHint={isExpired ? 'Shows when you used it' : isPassLocked ? 'Get a quarter pass to unlock' : 'Opens coupon details'}
                radius={RADIUS.card}
                shadow={!isExpired}
                style={{ marginRight: SHADOW, marginBottom: SHADOW }}
                faceStyle={{
                    flexDirection: 'row',
                    height: cardHeight,
                    borderWidth: OUTLINE,
                    borderColor: BRAND_INK,
                    borderStyle: isExpired ? 'dashed' : 'solid',
                    borderRadius: RADIUS.card,
                    backgroundColor: isExpired ? 'transparent' : WHITE,
                    overflow: 'hidden',
                }}
            >
                {/* photo column; a lilac block when the business has no photo */}
                <View
                    style={{
                        width: PHOTO_WIDTH,
                        backgroundColor: BRAND_LILAC,
                        borderRightWidth: OUTLINE,
                        borderRightColor: BRAND_INK,
                        borderStyle: isExpired ? 'dashed' : 'solid',
                        isolation: 'isolate',
                    }}
                >
                    {photo ? (
                        <Image
                            source={photo}
                            contentFit="cover"
                            transition={150}
                            onError={() => setPhotoFailed(true)}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isExpired ? 0.6 : 1 }}
                        />
                    ) : null}
                    {isExpired ? (
                        <View
                            pointerEvents="none"
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#808080', mixBlendMode: 'saturation' }}
                        />
                    ) : null}
                    <LogoBadge
                        coupon={coupon}
                        size={44}
                        radius={12}
                        padding={4}
                        spent={isExpired}
                        style={{ position: 'absolute', left: 8, bottom: 8 }}
                    />
                </View>

                <View style={{ flex: 1, minWidth: 0, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 12 }}>
                    {copy.business ? (
                        <Text
                            numberOfLines={1}
                            style={{ paddingRight: isSavingAvailable ? 44 : 0, fontFamily: 'Figtree_700Bold', fontSize: 15, lineHeight: 20, color: BRAND_MUTED }}
                        >
                            {copy.business}
                        </Text>
                    ) : null}
                    <Display
                        size={26}
                        color={isExpired ? BRAND_MUTED : BRAND_INK}
                        numberOfLines={2}
                        style={{ marginTop: copy.business ? 4 : 0, paddingRight: isSavingAvailable ? 40 : 0 }}
                    >
                        {copy.headline}
                    </Display>
                    {/* fills the space between headline and status; the description
                        shows as many whole lines as fit (none when the headline
                        took it all) instead of being cut mid-line */}
                    <View
                        style={{ flex: 1, minHeight: 0, marginTop: 5, overflow: 'hidden' }}
                        onLayout={(event) => {
                            const lines = Math.floor((event.nativeEvent.layout.height + 1) / (DESCRIPTION_LINE_HEIGHT * fontScale));
                            setDescriptionLines(Math.max(0, lines));
                        }}
                    >
                        {copy.description && descriptionLines > 0 ? (
                            <Text
                                numberOfLines={descriptionLines}
                                style={{ fontFamily: 'Figtree_400Regular', fontSize: 15, lineHeight: DESCRIPTION_LINE_HEIGHT, color: BRAND_MUTED }}
                            >
                                {copy.description}
                            </Text>
                        ) : null}
                    </View>
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                        {isPassLocked ? (
                            <>
                                <Icon name="lock" size={16} color={BRAND_INK} strokeWidth={2.25} />
                                <Text style={{ marginLeft: 5, fontFamily: 'Figtree_700Bold', fontSize: 14, lineHeight: 20, color: BRAND_INK }}>
                                    Unlock with a pass
                                </Text>
                            </>
                        ) : (
                            <UsesLeft remaining={isExpired ? 0 : remainingUses} />
                        )}
                    </View>
                </View>
            </RaisedPressable>

            {isSavingAvailable ? (
                <HeartButton
                    saved={saved}
                    vendor={coupon.vendor}
                    onPress={() => toggleSaved(coupon)}
                    style={{ position: 'absolute', top: 10, right: 10 + SHADOW }}
                />
            ) : null}
        </View>
    );
}
