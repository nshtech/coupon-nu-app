import { View, Text } from 'react-native'; 



export default function CouponThumbnail({ coupon }: { coupon: any }) {
    return (
        <View className="bg-white rounded-lg p-4 shadow-md ">
            <Text className="text-black text-2xl font-inter-bold">{coupon.vendor}</Text>
        </View>
    );
}
