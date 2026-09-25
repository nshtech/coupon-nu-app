import { Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import CouponThumbnail from '@/components/CouponThumbnail';
import { useUsage } from '@/contexts/UsageContext';
import { BRAND_PURPLE_SOFT } from '@/constants/Colors';

export default function MyCoupons() {


  const { user } = useAuth();

  const [couponTab, setCouponTab] = useState<"active" | "expired">("active");



  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<any[]>([]);

  const { userCouponToUsages, setUserCouponToUsages, setUserCouponToLastUsedAt } = useUsage();
  const [allCoupons, setAllCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  // helper to build a map of coupon_id to the most recent used_at timestamp
  const buildUserCouponToLastUsedAt = (usedCouponData: any[]): Map<number, string> => {
    const lastUsedAt = new Map<number, string>();

    if (!usedCouponData) return lastUsedAt;

    usedCouponData.forEach(usage => {
      const couponId = usage.coupon_id;
      const existing = lastUsedAt.get(couponId);
      if (!existing || new Date(usage.used_at) > new Date(existing)) {
        lastUsedAt.set(couponId, usage.used_at);
      }
    });
    return lastUsedAt;
  }


  // fetch coupon usages for the user, and feed to the map building helpers
  const fetchCouponUsages = async () => {
    if (!user) return;

    try {
      const { data: couponUsagesData, error: couponUsagesError } = await supabase
        .from('coupon_usages')
        .select('coupon_id, used_at')
        .eq('user_id', user.id);

      if (couponUsagesError) {
        console.error('Error fetching coupon usages:', couponUsagesError);
      } else {
        const usageCounts = buildUserCouponToUsages(couponUsagesData);
        setUserCouponToUsages(usageCounts);
        setUserCouponToLastUsedAt(buildUserCouponToLastUsedAt(couponUsagesData));
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
        .select('*')
        .order('vendor', { ascending: true });

      if (couponsError) {
        console.error('Error fetching coupons:', couponsError);
      } else {
        // console.log('Raw coupons data from database:', allCoupons);
        // // Check for any problematic data
        // allCoupons?.forEach((coupon, index) => {
        //   if (!coupon.coupon_id) {
        //     console.warn(`Coupon at index ${index} missing coupon_id:`, coupon);
        //   }
        //   if (coupon.coupon_id === null || coupon.coupon_id === undefined) {
        //     console.warn(`Coupon at index ${index} has null/undefined coupon_id:`, coupon);
        //   }
        // });
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
      setIsLoading(true);
      Promise.all([fetchAllCoupons(), fetchCouponUsages()]).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // filter coupons whenever either coupons or usage counts change
  useEffect(() => {
    if (allCoupons.length > 0) {
      filterCouponsByUsage(allCoupons, userCouponToUsages);
    }
  }, [allCoupons, userCouponToUsages]);


  
  const tabs: { key: "active" | "expired"; label: string; count: number }[] = [
    { key: "active", label: "Active", count: activeCoupons.length },
    { key: "expired", label: "Expired", count: expiredCoupons.length },
  ];

  const visibleCoupons = couponTab === "active" ? activeCoupons : expiredCoupons;

  return (
    <View className="flex-1 bg-brand-cream-soft">

      {/* segmented control */}
      <View className="bg-brand-purple px-4 pb-5">
        <View className="flex-row rounded-xl bg-brand-purple-mid/40 p-1">
          {tabs.map((tab) => {
            const isSelected = couponTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setCouponTab(tab.key)}
                className={`flex-1 items-center rounded-lg py-2 ${isSelected ? "bg-white" : "bg-transparent"}`}
              >
                <Text
                  className={`font-display text-xl ${isSelected ? "text-brand-purple" : "text-white/70"}`}
                >
                  {tab.label} ({tab.count})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* rest of workable space */}
      <View className="flex-1 px-5 pt-5">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={BRAND_PURPLE_SOFT} />
            <Text className="mt-3 font-display text-xl text-brand-purple-soft">Loading...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="gap-5 pb-8">
              {visibleCoupons.length === 0 ? (
                <View className="mt-16 items-center rounded-card border border-brand-tan bg-brand-cream px-6 py-10">
                  <Text className="text-center font-display text-xl text-brand-purple">
                    No {couponTab} coupons found
                  </Text>
                  <Text className="mt-2 text-center font-body text-base text-brand-purple-soft">
                    {couponTab === "active"
                      ? "Check back soon for new Evanston deals!"
                      : "Coupons you've fully redeemed will show up here."}
                  </Text>
                </View>
              ) : (
                visibleCoupons.map((coupon: any, index: number) => (
                  <CouponThumbnail key={coupon.coupon_id || index} coupon={coupon} couponTab={couponTab} />
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>

    </View>
  );
}
