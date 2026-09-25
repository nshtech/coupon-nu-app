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
import { BRAND_PURPLE_SOFT } from '@/constants/Colors';

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
      <View className="flex-1 items-center justify-center bg-brand-cream-soft px-8">
        <Text className="mb-6 text-center font-display text-2xl text-brand-purple">
          {parseError || 'Coupon not found'}
        </Text>
        <TouchableOpacity
          className="rounded-full bg-brand-purple px-8 py-4"
          onPress={() => router.back()}
        >
          <Text className="font-display text-lg text-brand-cream">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isSubscriptionLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-cream-soft">
        <Text className="font-display text-xl text-brand-purple-soft">Loading...</Text>
      </View>
    );
  }

  // gate coupon usage behind the paywall — browsing the list stays free
  if (!isSubscribed && !usedAt) {
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

  const isRedeemed = Boolean(usedAt) || isActivated;

  return (
    <View className="flex-1 bg-brand-cream-soft">
      {/* brand header */}
      <View className="rounded-b-[28px] bg-brand-purple px-6 pb-6 pt-16">
        <Text className="text-center font-display-bold text-3xl text-white">
          Willie's Wallet
        </Text>
      </View>

      {/* Coupon content */}
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full overflow-hidden rounded-card border border-brand-tan bg-white">
          <View className="h-72 w-full items-center justify-center overflow-hidden bg-brand-cream">
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
              <Ionicons name="pricetag-outline" size={64} color={BRAND_PURPLE_SOFT} />
            )}
          </View>

          <View className="items-center px-6 py-5">
            <Text className="text-center font-display text-3xl text-brand-purple">{coupon.vendor}</Text>
            <Text className="mt-2 text-center font-body text-base text-brand-ink">{coupon.offer}</Text>

            <View className="mt-4 w-full rounded-2xl bg-brand-cream px-4 py-3">
              {usedAt ? (
                <>
                  <Text className="text-center font-body-medium text-sm text-brand-purple">
                    Used on {formatExpirationDate(usedAt, "timestamp")}
                  </Text>
                  <Text className="mt-1 text-center font-body-medium text-sm text-brand-purple">
                    Expired on {formatExpirationDate(new Date(new Date(usedAt).getTime() + 2 * 60 * 1000).toISOString(), "timestamp")}
                  </Text>
                </>
              ) : isActivated === false ? (
                <Text className="text-center font-body-medium text-sm text-brand-purple">
                  Expires on {formatExpirationDate(coupon.expiration_date, "date")}
                </Text>
              ) : (
                <Text className="text-center font-body-medium text-sm text-brand-purple">
                  Expires on {formatExpirationDate(newExpirationDate || coupon.expiration_date, "timestamp")}
                </Text>
              )}
            </View>

            {isRedeemed ? (
              <View className="mt-5 w-full rounded-full bg-brand-peach py-4">
                <Text className="text-center font-display text-2xl text-brand-purple">Redeemed!</Text>
              </View>
            ) : (
              <TouchableOpacity
                className="mt-5 w-full rounded-full bg-brand-purple py-4 active:opacity-80"
                onPress={handleUseCoupon}
              >
                <Text className="text-center font-display text-2xl text-brand-cream">Use Coupon</Text>
              </TouchableOpacity>
            )}

            <Pressable onPress={() => router.back()} className="mt-3 p-2">
              <Text className="text-center font-body-medium text-base text-brand-purple-soft">Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
