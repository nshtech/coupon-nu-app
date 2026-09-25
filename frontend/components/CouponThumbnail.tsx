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

    return (
        <Pressable
            onPress={handlePress}
            className={`${isLocked ? 'opacity-50' : 'active:opacity-70'}`}
        >
            <View className={`bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden ${isLocked ? 'bg-gray-50' : ''}`}>
                {coupon.image_url && !imageFailed ? (
                    <Image
                        source={{ uri: coupon.image_url }}
                        placeholder={{ blurhash: BLURHASH }}
                        transition={200}
                        contentFit="cover"
                        onError={() => setImageFailed(true)}
                        style={{ width: '100%', height: 140, opacity: isLocked ? 0.5 : 1 }}
                    />
                ) : null}
              <View className="p-4">
                <Text className={`text-3xl font-inter-bold ${isLocked ? 'text-gray-500' : 'text-black'}`}>
                    {coupon.vendor}
                </Text>
                <Text className={`text-lg font-inter-regular ${isLocked ? 'text-gray-400' : 'text-black'}`}>
                    {isSubscribed ? coupon.offer : 'Unlock to see the deal!'}
                </Text>

                {Number.isFinite(remainingUses) ? (
                    remainingUses === 1 ? (
                        <Text className={`text-lg font-inter-regular ${isLocked ? 'text-gray-400' : 'text-black'}`}>
                            {remainingUses} use remaining
                        </Text>
                    ) : (
                        <Text className={`text-lg font-inter-regular ${isLocked ? 'text-gray-400' : 'text-black'}`}>
                            {remainingUses} uses remaining
                        </Text>
                    )
                ) : (
                    <Text className={`text-lg font-inter-regular ${isLocked ? 'text-gray-400' : 'text-black'}`}>
                        Unlimited uses
                    </Text>
                )}

              </View>
            </View>
        </Pressable>
    );
}
