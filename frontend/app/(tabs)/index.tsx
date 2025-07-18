import { Text, View, Pressable } from 'react-native';
import { useState } from "react";


export default function MyCoupons() {


  const [activeCouponTab, setActiveCouponTab] = useState<"active" | "expired">("active");

  return (
    
    <View className="flex-1 bg-white">
      <View className="bg-purple-80 flex-row py-5">
        <Pressable className="flex-1 items-center">
          <Text className="text-white text-3xl font-inter-bold">Active (2)</Text>
        </Pressable>
        <Pressable className="flex-1 items-center">
          <Text className="text-white text-3xl font-inter-bold">Expired (1)</Text>
        </Pressable>
      </View>

      <View className="flex-1 bg-white p-4">
        
      </View>
    </View>
  );
}
