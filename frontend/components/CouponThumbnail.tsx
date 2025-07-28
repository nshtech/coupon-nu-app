import { View, Text } from 'react-native'; 

export default function CouponThumbnail({ coupon }: { coupon: any }) {
    return (
        <View className="bg-white p-4 shadow-sm">
            <Text className="text-black text-3xl font-inter-bold">{coupon.vendor}</Text>
            <Text className="text-black text-lg font-inter-regular">{coupon.offer}</Text>
        </View>
    );
}
