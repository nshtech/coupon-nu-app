import { useMemo, useRef } from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import BrandHeader from '@/components/BrandHeader';
import CouponHistoryCard from '@/components/CouponHistoryCard';
import CouponSkeleton from '@/components/CouponSkeleton';
import EmptyState from '@/components/EmptyState';
import WagTail, { useTailRefresh } from '@/components/WagTail';
import { useCoupons } from '@/contexts/CouponsContext';
import { useUsage } from '@/contexts/UsageContext';
import { useAppText } from '@/utils/appText';
import { BRAND_PURPLE_SOFT } from '@/constants/Colors';

// Used: every coupon the user has redeemed at least once, newest first.
export default function Used() {
  const router = useRouter();
  const { allCoupons, isLoading, loadError, refresh, isCouponActive } = useCoupons();
  const { userCouponToUsages, userCouponToLastUsedAt } = useUsage();
  const { isRefreshing, handleRefresh, onScrollEndDrag, refreshControl } = useTailRefresh(refresh);
  const scrollY = useRef(new Animated.Value(0)).current;
  // editable in Supabase: app_text row 'used_headline'
  const headline = useAppText('used_headline', 'Your past perks.');

  const history = useMemo(
    () =>
      allCoupons
        .filter(coupon => userCouponToLastUsedAt.has(coupon.coupon_id))
        .map(coupon => ({
          coupon,
          lastUsedAt: userCouponToLastUsedAt.get(coupon.coupon_id) as string,
          timesUsed: userCouponToUsages.get(coupon.coupon_id) || 0,
          isExpired: !isCouponActive(coupon),
        }))
        .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()),
    [allCoupons, userCouponToUsages, userCouponToLastUsedAt, isCouponActive]
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="items-center pt-16">
          <ActivityIndicator size="large" color={BRAND_PURPLE_SOFT} />
        </View>
      );
    }
    if (loadError && allCoupons.length === 0) {
      return <EmptyState title="Something went wrong" message={loadError} actionLabel="Try again" onAction={handleRefresh} />;
    }
    if (history.length === 0) {
      return (
        <EmptyState
          title="No perks used yet"
          message="Coupons you use will show up here, with the date you used them."
          actionLabel="Find a deal"
          onAction={() => router.navigate('/')}
        />
      );
    }
    return (
      <>
        <Text className="mb-3 font-display-medium text-xs uppercase tracking-widest text-brand-purple-soft">
          {history.length} coupon{history.length === 1 ? '' : 's'} used
        </Text>
        <View className="gap-3">
          {history.map(entry => (
            <View key={entry.coupon.coupon_id}>
              <CouponHistoryCard {...entry} />
              <CouponSkeleton visible={isRefreshing} variant="history" />
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <View className="flex-1 bg-brand-cream-soft">
      {/* drawn above the list so Willie's tail can tuck behind it */}
      <View style={{ zIndex: 1 }}>
        <BrandHeader headline={headline} />
      </View>
      <View className="flex-1">
        <Animated.ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onScrollEndDrag={onScrollEndDrag}
          refreshControl={refreshControl}
        >
          {renderBody()}
        </Animated.ScrollView>
        <WagTail scrollY={scrollY} isWagging={isRefreshing} />
      </View>
    </View>
  );
}
