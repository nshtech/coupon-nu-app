import { View, Text, Pressable, TouchableOpacity, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUsage } from '@/contexts/UsageContext';
import * as ScreenCapture from 'expo-screen-capture';
import PaywallScreen from '@/components/PaywallScreen';

const BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_3fQjZa|j[azf6fQfQfQIpWBj[ayj[a|fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[ayfQfQpwj[fQjEIpayfQj[a|fQjuey';

export default function CouponDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const usedAt = typeof params.usedAt === 'string' ? params.usedAt : undefined;
  const { user } = useAuth();
  const { isSubscribed, isSubscriptionLoading } = useSubscription();
  const { userCouponToUsages, setUserCouponToUsages, userCouponToLastUsedAt, setUserCouponToLastUsedAt } = useUsage();

  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [newExpirationDate, setNewExpirationDate] = useState<string>();
  const [imageFailed, setImageFailed] = useState<boolean>(false);

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

  if (isSubscriptionLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-dark-gray text-xl font-inter-bold">Loading...</Text>
      </View>
    );
  }

  // gate coupon usage behind the paywall — browsing the list stays free
  if (!isSubscribed) {
    return <PaywallScreen onClose={() => router.back()} />;
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

    const usedAtNow = new Date().toISOString();

    const { error } = await supabase
    .from('coupon_usages')
    .insert({
      user_id: user?.id,
      coupon_id: coupon.coupon_id,
      used_at: usedAtNow,
    });

    if (error) {
      console.error('Error using coupon:', error);
    } else {
      setIsActivated(true);
      setNewExpirationDate(new Date(Date.now() + 2 * 60 * 1000).toISOString());

      const newUserCouponToUsages = new Map(userCouponToUsages);
      newUserCouponToUsages.set(coupon.coupon_id, (newUserCouponToUsages.get(coupon.coupon_id) || 0) + 1);
      setUserCouponToUsages(newUserCouponToUsages);

      const newUserCouponToLastUsedAt = new Map(userCouponToLastUsedAt);
      newUserCouponToLastUsedAt.set(coupon.coupon_id, usedAtNow);
      setUserCouponToLastUsedAt(newUserCouponToLastUsedAt);

    }
  }

  return (
    <View className="flex-1 bg-white">
      <Text className="text-purple-80 text-5xl font-inter-bold text-center mt-24">Willie's Wallet</Text>

      {/* Coupon content */}
      <View className="flex-1 justify-center items-center px-8">
        <View className="bg-white mb-6 shadow-lg items-center w-full">
          <View className="w-full h-80 bg-gray-200 mb-4 justify-center items-center overflow-hidden">
            {coupon.image_url && !imageFailed ? (
              <Image
                source={{ uri: coupon.image_url }}
                placeholder={{ blurhash: BLURHASH }}
                transition={200}
                contentFit="cover"
                onError={() => setImageFailed(true)}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Ionicons name="pricetag-outline" size={64} color="#9CA3AF" />
            )}
          </View>
          
          <View className="items-center mb-6 w-full">
            <Text className="text-black text-3xl font-inter-bold mb-2 text-center">{coupon.vendor}</Text>
            <Text className="text-black text-lg font-inter-regular mb-2 text-center">{coupon.offer}</Text>

            {usedAt ? (
              <>
                <Text className="text-black text-xl font-inter-bold text-center">
                  Used on {formatExpirationDate(usedAt, "timestamp")}
                </Text>
                <Text className="text-black text-xl font-inter-bold text-center mt-1">
                  Expired on {formatExpirationDate(new Date(new Date(usedAt).getTime() + 2 * 60 * 1000).toISOString(), "timestamp")}
                </Text>
              </>
            ) : isActivated === false ? (
              <Text className="text-black text-xl font-inter-bold text-center">
                Expires on {formatExpirationDate(coupon.expiration_date, "date")}
              </Text>
            ) : (
              <Text className="text-black text-xl font-inter-bold text-center">
                Expires on {formatExpirationDate(newExpirationDate || coupon.expiration_date, "timestamp")}
              </Text>
            )}
          </View>

          {usedAt ? (
            <Text className="text-black text-3xl p-4 font-inter-bold text-center">Redeemed!</Text>
          ) : isActivated === false ? (
          <TouchableOpacity className="bg-purple-80 rounded-lg p-4 mb-4" onPress={handleUseCoupon}>
            <Text className="text-white text-3xl px-2 font-inter-bold text-center">Use Coupon</Text>
          </TouchableOpacity>
          ) : (
            <Text className="text-black text-3xl p-4 font-inter-bold text-center">Redeemed!</Text>
          )}

          <Pressable onPress={() => router.back()} className="p-2 mb-2">
            <Text className="text-black text-xl font-inter-bold text-center">Close</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}