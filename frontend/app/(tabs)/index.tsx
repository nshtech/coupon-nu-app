import { Text, View, Pressable, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import CouponThumbnail from '@/components/CouponThumbnail';


export default function MyCoupons() {


  const { user } = useAuth();

  const [couponTab, setCouponTab] = useState<"active" | "expired">("active");

  const [usedCouponIds, setUsedCouponIds] = useState<any[]>([]);
  const [usedCoupons, setUsedCoupons] = useState<any[]>([]);

  const [activeCoupons, setActiveCoupons] = useState<any[]>([]);


  useEffect(() =>{
    fetchUsedCoupons();
  }, [user, usedCouponIds]);

  useEffect(() => {
    fetchActiveCoupons();
  }, [usedCouponIds]);

  // subscription for coupon_usages changes
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('coupon_usages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coupon_usages',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // refetch used and active coupons
          fetchUsedCoupons();
          fetchActiveCoupons();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);



  // refetching on app focus
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUsedCoupons();
        fetchActiveCoupons();
      }
    }, [user?.id])
  );



  
  const fetchUsedCoupons = async () => {
    if (!user) return;

    try {
      const { data: usedCouponIdData, error: usedCouponError } = await supabase
        .from('coupon_usages')
        .select('coupon_id')
        .eq('user_id', user.id)

      if (usedCouponError) {
        console.error('Error fetching used coupon IDs:', usedCouponError);
      } else {

        // Now fetch the complete coupon rows using those IDs
        if (usedCouponIdData && usedCouponIdData.length > 0) {
          const couponIds = usedCouponIdData.map(coupon => coupon.coupon_id);
          setUsedCouponIds(couponIds || []);
          
          const { data: usedCoupons, error: usedCouponsError } = await supabase
            .from('coupons')
            .select('*')
            .in('coupon_id', couponIds);

          if (usedCouponsError) {
            console.error('Error fetching used coupons:', usedCouponsError);
          } else {
            // console.log('usedCoupons', usedCoupons);
            setUsedCoupons(usedCoupons || []);
          }
        }
      }
        
    } catch (error) {
      console.error('Error fetching used coupons:', error);
    }
  }


  const fetchActiveCoupons = async () => {
    if (!user) return;

    try {
      const { data: allCoupons, error: couponsError } = await supabase
        .from('coupons')
        .select('*');

      if (couponsError) {
        console.error('Error fetching coupons:', couponsError);
      } else {
        const activeCoupons = allCoupons.filter(coupon => !usedCouponIds.includes(coupon.coupon_id));
        // console.log('activeCoupons', activeCoupons);
        setActiveCoupons(activeCoupons || []);
      }

    } catch (error) {
      console.error('Error fetching coupon data:', error);
    }
  }

  
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
          <Text className="text-white text-3xl font-inter-bold mb-2 pt-5 pb-1">Expired ({usedCoupons.length})</Text>
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
              {usedCoupons.length === 0 ? (
                <Text className="font-inter-bold text-xl text-dark-gray text-center">No expired coupons found</Text>
              ) : (
                usedCoupons.map((coupon, index) => (
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
