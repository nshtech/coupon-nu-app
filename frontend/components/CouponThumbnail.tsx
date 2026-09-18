import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useUsage } from '@/contexts/UsageContext';

const BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_3fQjZa|j[azf6fQfQfQIpWBj[ayj[a|fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[ayfQfQpwj[fQjEIpayfQj[a|fQjuey';

export default function CouponThumbnail({ coupon, couponTab }: { coupon: any; couponTab: "active" | "expired" }) {
    const router = useRouter();
    const { userCouponToUsages } = useUsage();
    const [imageFailed, setImageFailed] = useState(false);

    const handlePress = () => {
        if (couponTab === "expired") return;
        
        // Simple validation
        if (!coupon || !coupon.coupon_id || !coupon.vendor || !coupon.offer) {
            console.error('Invalid coupon object:', coupon);
            return;
        }
        
        // Navigate with the coupon object directly as a param
        // This avoids all the URL encoding issues
        router.push({
            pathname: '/coupon-detail',
            params: { coupon: JSON.stringify(coupon) }
        });
    };

    const couponUses = userCouponToUsages.get(coupon.coupon_id) || 0;
    const usageLimit = coupon.usage_limit === 0 ? Infinity : coupon.usage_limit;

    const remainingUses = usageLimit - couponUses;

    return (
        <Pressable 
            onPress={handlePress} 
            className={`${couponTab === "expired" ? 'opacity-50' : 'active:opacity-70'}`}
            disabled={couponTab === "expired"}
        >
            <View className={`bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden ${couponTab === "expired" ? 'bg-gray-50' : ''}`}>
                {coupon.image_url && !imageFailed ? (
                    <Image
                        source={{ uri: coupon.image_url }}
                        placeholder={{ blurhash: BLURHASH }}
                        transition={200}
                        contentFit="cover"
                        onError={() => setImageFailed(true)}
                        style={{ width: '100%', height: 140, opacity: couponTab === "expired" ? 0.5 : 1 }}
                    />
                ) : null}
              <View className="p-4">
                <Text className={`text-3xl font-inter-bold ${couponTab === "expired" ? 'text-gray-500' : 'text-black'}`}>
                    {coupon.vendor}
                </Text>
                <Text className={`text-lg font-inter-regular ${couponTab === "expired" ? 'text-gray-400' : 'text-black'}`}>
                    {coupon.offer}
                </Text>

                {Number.isFinite(remainingUses) ? (
                    remainingUses === 1 ? (
                        <Text className={`text-lg font-inter-regular ${couponTab === "expired" ? 'text-gray-400' : 'text-black'}`}>
                            {remainingUses} use remaining
                        </Text>
                    ) : (
                        <Text className={`text-lg font-inter-regular ${couponTab === "expired" ? 'text-gray-400' : 'text-black'}`}>
                            {remainingUses} uses remaining
                        </Text>
                    )
                ) : (
                    <Text className={`text-lg font-inter-regular ${couponTab === "expired" ? 'text-gray-400' : 'text-black'}`}>
                        Unlimited uses
                    </Text>
                )}

              </View>
            </View>
        </Pressable>
    );
}
