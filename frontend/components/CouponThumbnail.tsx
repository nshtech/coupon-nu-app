import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useUsage } from '@/contexts/UsageContext';

export default function CouponThumbnail({ coupon, couponTab }: { coupon: any; couponTab: "active" | "expired" }) {
    const router = useRouter();
    const { userCouponToUsages } = useUsage();

    const handlePress = () => {
        if (couponTab === "expired") return;
        
        // Encode the coupon data, map data, and usage setter to pass as URL parameters
        const couponData = encodeURIComponent(JSON.stringify(coupon));
        router.push(`/coupon-detail?coupon=${couponData}`);
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
            <View className={`bg-white p-4 shadow-sm rounded-lg border border-gray-100 ${couponTab === "expired" ? 'bg-gray-50' : ''}`}>
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
        </Pressable>
    );
}
