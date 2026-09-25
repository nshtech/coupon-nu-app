import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useUsage } from '@/contexts/UsageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

const BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_3fQjZa|j[azf6fQfQfQIpWBj[ayj[a|fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[ayfQfQpwj[fQjEIpayfQj[a|fQjuey';

export default function CouponThumbnail({ coupon, couponTab }: { coupon: any; couponTab: "active" | "expired" }) {
    const router = useRouter();
    const { userCouponToUsages, userCouponToLastUsedAt } = useUsage();
    const { isSubscribed } = useSubscription();
    const [imageFailed, setImageFailed] = useState(false);

    const handlePress = () => {
        // Simple validation
        if (!coupon || !coupon.coupon_id || !coupon.vendor || !coupon.offer) {
            console.error('Invalid coupon object:', coupon);
            return;
        }

        // expired coupons open a read-only usage receipt (when it was used /
        // when the redemption window expired) instead of the active flow
        const usedAt = couponTab === "expired" ? userCouponToLastUsedAt.get(coupon.coupon_id) : undefined;

        // Navigate with the coupon object directly as a param
        // This avoids all the URL encoding issues
        router.push({
            pathname: '/coupon-detail',
            params: {
                coupon: JSON.stringify(coupon),
                ...(usedAt ? { usedAt } : {}),
            }
        });
    };

    const couponUses = userCouponToUsages.get(coupon.coupon_id) || 0;
    const usageLimit = coupon.usage_limit === 0 ? Infinity : coupon.usage_limit;

    const remainingUses = usageLimit - couponUses;

    // locked coupons just look grayed out and still route to the detail
    // screen (usage receipt for expired, paywall for unsubscribed)
    const isExpired = couponTab === "expired";
    const isLocked = isExpired || !isSubscribed;

    const usesLabel = Number.isFinite(remainingUses)
        ? `${remainingUses} use${remainingUses === 1 ? '' : 's'} left`
        : 'Unlimited uses';

    return (
        <Pressable
            onPress={handlePress}
            className={`${isLocked ? 'opacity-60' : 'active:opacity-80'}`}
        >
            <View className="overflow-hidden rounded-card border border-brand-tan bg-white shadow-sm">
                {coupon.image_url && !imageFailed ? (
                    <Image
                        source={{ uri: coupon.image_url }}
                        placeholder={{ blurhash: BLURHASH }}
                        transition={200}
                        contentFit="cover"
                        onError={() => setImageFailed(true)}
                        style={{ width: '100%', height: 150, opacity: isLocked ? 0.6 : 1 }}
                    />
                ) : (
                    <View className="h-4 w-full bg-brand-cream" />
                )}

                <View className="p-4">
                    <Text
                        className={`font-display text-2xl ${isLocked ? 'text-brand-purple-soft' : 'text-brand-purple'}`}
                        numberOfLines={1}
                    >
                        {coupon.vendor}
                    </Text>
                    <Text
                        className={`mt-1 font-body text-base ${isLocked ? 'text-brand-purple-soft' : 'text-brand-ink'}`}
                    >
                        {isSubscribed ? coupon.offer : 'Unlock to see the deal!'}
                    </Text>

                    <Text className="mt-2 font-body-medium text-sm text-brand-purple-soft">
                        {isExpired ? 'Redeemed' : usesLabel}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
}
