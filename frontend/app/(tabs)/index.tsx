import { Text, View, Pressable, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import CouponThumbnail from '@/components/CouponThumbnail';
import { useUsage } from '@/contexts/UsageContext';

export default function MyCoupons() {


  const { user } = useAuth();

  const [couponTab, setCouponTab] = useState<"active" | "expired">("active");



  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<any[]>([]);

  const { userCouponToUsages, setUserCouponToUsages } = useUsage();
  const [allCoupons, setAllCoupons] = useState<any[]>([]);

  // helper to build a map of KV pairs of coupon_id to usage count
  const buildUserCouponToUsages = (usedCouponData: any[]): Map<number, number> => {
    const usageCounts = new Map<number, number>();

    if (!usedCouponData) return usageCounts;
    
    usedCouponData.forEach(usage => {
      const couponId = usage.coupon_id;
      const currCount = usageCounts.get(couponId) || 0;
      usageCounts.set(couponId, currCount + 1);
    });
    return usageCounts;
  }


  // fetch coupon usages for the user, and feed to the map building helper
  const fetchCouponUsages = async () => {
    if (!user) return;

    try {
      const { data: couponUsagesData, error: couponUsagesError } = await supabase
        .from('coupon_usages')
        .select('coupon_id')
        .eq('user_id', user.id);

      if (couponUsagesError) {
        console.error('Error fetching coupon usages:', couponUsagesError);
      } else {
        const usageCounts = buildUserCouponToUsages(couponUsagesData);
        setUserCouponToUsages(usageCounts);
      }
    } catch (error) {
      console.error('Error fetching coupon usages:', error);
    }
  }


  // fetch all coupons once on app load!
  const fetchAllCoupons = async () => {
    if (!user) return;

    try {
      const { data: allCoupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*');

      if (couponsError) {
        console.error('Error fetching coupons:', couponsError);
      } else {
        setAllCoupons(allCoupons);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  }


  // helper to filter out coupons that are considered expired
  const filterCouponsByUsage = (allCoupons: any[], usageCounts: Map<number, number>) => {
    const activeCoupons: any[] = [];
    const expiredCoupons: any[] = [];

    allCoupons.forEach(coupon => {
      const usageCount = usageCounts.get(coupon.coupon_id) || 0;
      const usageLimit = coupon.usage_limit;

      if (usageLimit > usageCount || usageLimit === 0) {
        activeCoupons.push(coupon);
      } else {
        expiredCoupons.push(coupon);
      }
    })

    setActiveCoupons(activeCoupons);
    setExpiredCoupons(expiredCoupons);
  }

  useEffect(() => {
    if (user) {
      fetchAllCoupons();
      fetchCouponUsages();
    }
  }, [user]);

  // filter coupons whenever either coupons or usage counts change
  useEffect(() => {
    if (allCoupons.length > 0) {
      filterCouponsByUsage(allCoupons, userCouponToUsages);
    }
  }, [allCoupons, userCouponToUsages]);


  
  return (
    
    <View className="flex-1 bg-white">

      {/* purple bar */}
      <View className="bg-purple-80 flex-row">

        {/* active tab */}
        <Pressable className="flex-1 items-center flex-col justify-end" onPress={() => setCouponTab("active")}>
          <Text className="text-white text-3xl font-inter-bold mb-2 pt-5 pb-1">Active ({activeCoupons.length})</Text>
          <View className={`h-1 w-full absolute-bottom-0 ${couponTab === "active" ? "bg-white" : "bg-transparent"}`} />
        </Pressable>

        {/* expired tab */}
        <Pressable className="flex-1 items-center flex-col justify-end" onPress={() => setCouponTab("expired")}>
          <Text className="text-white text-3xl font-inter-bold mb-2 pt-5 pb-1">Expired ({expiredCoupons.length})</Text>
          <View className={`h-1 w-full absolute-bottom-0 ${couponTab === "expired" ? "bg-white" : "bg-transparent"}`} />
        </Pressable>
      </View>


      {/* rest of workable space */}

      <View className="flex-1 bg-white p-4">

        {couponTab === "active" ? (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-10 p-4">
              {activeCoupons.length === 0 ? (
                <Text className="font-inter-bold text-xl text-dark-gray text-center">No active coupons found</Text>
              ) : (
                activeCoupons.map((coupon: any, index: number) => (
                  <CouponThumbnail key={coupon.id || index} coupon={coupon} couponTab={couponTab} />
                ))
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-10 p-4">
              {expiredCoupons.length === 0 ? (
                <Text className="font-inter-bold text-xl text-dark-gray text-center">No expired coupons found</Text>
              ) : (
                expiredCoupons.map((coupon: any, index: number) => (
                  <CouponThumbnail key={coupon.id || index} coupon={coupon} couponTab={couponTab} />
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>



    </View>
  );
}
