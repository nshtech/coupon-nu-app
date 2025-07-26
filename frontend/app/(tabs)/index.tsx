import { Text, View, Pressable } from 'react-native';
import { useState, useEffect } from "react";
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import CouponThumbnail from '@/components/CouponThumbnail';


export default function MyCoupons() {


  const { user } = useAuth();

  const [couponTab, setCouponTab] = useState<"active" | "expired">("active");


  // TODO: get these from the length of coupons array
  const [expiredCouponCount, setExpiredCouponCount] = useState<number>(0);

  const [coupons, setCoupons] = useState<any[]>([]);
  // const [usages, setUsages] = useState<any[]>([]);


  useEffect(() =>{
    const fetchCouponData = async () => {
      console.log('fetching coupon data');
      if (!user) return;

      try {
        const { data: coupons, error: couponsError } = await supabase
          .from('coupons')
          .select('*');

        // const { data: usages, error: usagesError } = await supabase
        //   .from('coupon_usages')
        //   .select('*')
        //   .eq('user_id', user.id);

        if (couponsError) {
          console.error('Error fetching coupons:', couponsError);
        } else {
          setCoupons(coupons || []);
          console.log('coupons', coupons);
        }

        // if (usagesError) {
        //   console.error('Error fetching usages:', usagesError);
        // } else {
        //   setUsages(usages || []);
        //   console.log('usages', usages);
        // }
      } catch (error) {
        console.error('Error fetching coupon data:', error);
      }
    }
    fetchCouponData();
  }, []);








  return (
    
    <View className="flex-1 bg-white">

      {/* purple bar */}
      <View className="bg-purple-80 flex-row">

        {/* active tab */}
        <Pressable className="flex-1 items-center flex-col justify-end" onPress={() => setCouponTab("active")}>
          <Text className="text-white text-3xl font-inter-bold mb-2 pt-5 pb-1">Active ({coupons.length})</Text>
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

        {couponTab === "active" ? (
          <View className="gap-10 p-4">





            {/* UNDERSTAND THIS  */}
            {coupons.length === 0 ? (
              <Text className="font-inter-medium text-gray-500 text-center">No active coupons found</Text>
            ) : (
              coupons.map((coupon, index) => (
                <CouponThumbnail key={coupon.id || index} coupon={coupon} />
              ))
            )}
            





          </View>
        ) : (
          <Text className="font-inter-bold text-3xl">Expired coupons will go here</Text>
        )}
      </View>



    </View>
  );
}
