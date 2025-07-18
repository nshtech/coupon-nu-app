import { Text, View, Pressable } from 'react-native';
import { useState } from "react";


export default function MyCoupons() {


  const [couponTab, setCouponTab] = useState<"active" | "expired">("active");

  const [activeCouponCount, setActiveCouponCount] = useState<number>(1);
  const [expiredCouponCount, setExpiredCouponCount] = useState<number>(1);


  return (
    
    <View className="flex-1 bg-white">

      {/* purple bar */}
      <View className="bg-purple-80 flex-row">

        {/* active tab */}
        <Pressable className="flex-1 items-center flex-col justify-end" onPress={() => setCouponTab("active")}>
          <Text className="text-white text-3xl font-inter-bold mb-2 pt-5 pb-1">Active ({activeCouponCount})</Text>
          <View className={`h-1 w-full absolute-bottom-0 ${couponTab === "active" ? "bg-white" : "bg-transparent"}`} />
        </Pressable>

        {/* expired tab */}
        <Pressable className="flex-1 items-center flex-col justify-end" onPress={() => setCouponTab("expired")}>
          <Text className="text-white text-3xl font-inter-bold mb-2 pt-5 pb-1">Expired ({expiredCouponCount})</Text>
          <View className={`h-1 w-full absolute-bottom-0 ${couponTab === "expired" ? "bg-white" : "bg-transparent"}`} />
        </Pressable>
      </View>


      {/* rest of workable space */}

      <View className="flex-1 bg-white p-4">
        {/* MAP THE CORRECT COUPON OBJECTS HERE EVENTUALLY */}
        {couponTab === "active" ? (
          <Text className="font-inter-bold text-3xl">Active Coupon</Text>

        ) : (
          <Text className="font-inter-bold text-3xl">EXPIRED COUPON 1</Text>
        )}

      </View>
    </View>
  );
}
