import { View, Text, Pressable, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext'; 
import { useUsage } from '@/contexts/UsageContext';
import * as ScreenCapture from 'expo-screen-capture';

export default function CouponDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { userCouponToUsages, setUserCouponToUsages } = useUsage();
  
  // // anti-screenshots
  // useEffect(() => {
  //   ScreenCapture.preventScreenCaptureAsync();
    
  //   // this acts as a cleanup function that triggers when we unmount
  //   return () => {
  //     ScreenCapture.allowScreenCaptureAsync();
  //   };
  // }, []);
  
  // Parse the coupon data from the params with simple error handling
  let coupon = null;
  let parseError = null;
  
  try {
    if (params.coupon) {
      const couponParam = params.coupon as string;
      // console.log('Raw coupon param:', couponParam);
      
      // Simple JSON parse - no complex decoding needed
      coupon = JSON.parse(couponParam);
      // console.log('Parsed coupon object:', coupon);
      
    } else {
      parseError = 'No coupon data provided';
    }
  } catch (error) {
    console.error('Error parsing coupon data:', error);
    console.error('Raw params:', params);
    
    if (error instanceof SyntaxError) {
      parseError = 'Invalid JSON format in coupon data';
    } else {
      parseError = 'Failed to load coupon data';
    }
  }
  
  if (parseError || !coupon) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <Text className="text-black text-xl font-inter-bold mb-4">
          {parseError || 'Coupon not found'}
        </Text>
        <TouchableOpacity 
          className="bg-purple-80 rounded-lg p-4" 
          onPress={() => router.back()}
        >
          <Text className="text-white text-lg font-inter-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }



  const formatExpirationDate = (dateString: string, displayType: "date" | "timestamp") => {
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      if (displayType === "date") {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  };


  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [newExpirationDate, setNewExpirationDate] = useState<string>();
  
  // navigate back after 2 min are up
  useEffect(() => {
    if (isActivated && newExpirationDate) {
      const expirationTime = new Date(newExpirationDate).getTime();
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      if (timeUntilExpiration > 0) {
        const timer = setTimeout(() => {
          router.back();
        }, timeUntilExpiration);
        
        return () => clearTimeout(timer);
      } else {
        router.back();
      }
    }
  }, [isActivated, newExpirationDate, router]);
  
  const handleUseCoupon = async () => {

    Alert.alert('Use Coupon', 'Are you sure you want to use this coupon? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Use', onPress: () => {
        useCoupon();
      } }
    ]);
  };

  const useCoupon = async () => {
    if (!user) {
      console.error('User not found');
      return;
    }

    const { error } = await supabase
    .from('coupon_usages')
    .insert({
      user_id: user?.id,
      coupon_id: coupon.coupon_id,
      used_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error using coupon:', error);
    } else {
      setIsActivated(true);
      setNewExpirationDate(new Date(Date.now() + 2 * 60 * 1000).toISOString());

      const newUserCouponToUsages = new Map(userCouponToUsages);
      newUserCouponToUsages.set(coupon.coupon_id, (newUserCouponToUsages.get(coupon.coupon_id) || 0) + 1);
      setUserCouponToUsages(newUserCouponToUsages);

    }
  }

  return (
    <View className="flex-1 bg-white">
      <Text className="text-purple-80 text-5xl font-inter-bold text-center mt-24">Purple Picks</Text>

      {/* Coupon content */}
      <View className="flex-1 justify-center items-center px-8">
        <View className="bg-white mb-6 shadow-lg items-center w-full">
          <View className="w-full h-80 bg-gray-200 mb-4 justify-center items-center">
            <Text className="text-gray-500 text-lg">Coupon Image</Text>
          </View>
          
          <View className="items-center mb-6">
            <Text className="text-black text-3xl font-inter-bold mb-2">{coupon.vendor}</Text>
            <Text className="text-black text-lg font-inter-regular mb-2">{coupon.offer}</Text>
            
            {isActivated === false ? (
              <Text className="text-black text-xl font-inter-bold">
                Expires on {formatExpirationDate(coupon.expiration_date, "date")}
              </Text>
            ) : (
              <Text className="text-black text-xl font-inter-bold">
                Expires on {formatExpirationDate(newExpirationDate || coupon.expiration_date, "timestamp")}
              </Text>
            )}
          </View>

          {isActivated === false ? (
          <TouchableOpacity className="bg-purple-80 rounded-lg p-4 mb-4" onPress={handleUseCoupon}>
            <Text className="text-white text-3xl px-2 font-inter-bold">Use Coupon</Text>
          </TouchableOpacity>
          ) : (
            <Text className="text-black text-3xl p-4 font-inter-bold">Redeemed!</Text>
          )}

          <Pressable onPress={() => router.back()} className="p-2 mb-2">
            <Text className="text-black text-xl font-inter-bold">Close</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}