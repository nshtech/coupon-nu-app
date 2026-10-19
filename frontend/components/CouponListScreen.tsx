import { useMemo, useRef, useState } from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLockup } from '@/components/BrandHeader';
import SearchFilterBar from '@/components/SearchFilterBar';
import CouponThumbnail from '@/components/CouponThumbnail';
import CouponSkeleton from '@/components/CouponSkeleton';
import EmptyState from '@/components/EmptyState';
import WagTail, { useTailRefresh } from '@/components/WagTail';
import { useCoupons } from '@/contexts/CouponsContext';
import { BRAND_PURPLE_SOFT } from '@/constants/Colors';
import { EMPTY_FILTERS, applyCouponFilters, countActiveFilters } from '@/utils/couponFilters';

// Header + search/filter + coupon cards, shared by the Discover and Saved tabs.
// The header and search bar float over the cards. Scrolling down folds the
// headline away, leaving a short purple bar with just the logo; pulling down
// moves the whole header with the cards, and Willie's tail drops from under the
// purple and wags while the refresh runs, in place of a spinner.

type CouponListScreenProps = {
  headline: string;
  // the tab's coupons before search and filters are applied
  coupons: any[];
  emptyState: { title: string; message: string; actionLabel?: string; onAction?: () => void };
  searchPlaceholder?: string;
};

export default function CouponListScreen({ headline, coupons, emptyState, searchPlaceholder }: CouponListScreenProps) {
  const { isLoading, loadError, refresh, isCouponActive, allCoupons } = useCoupons();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const { isRefreshing, handleRefresh, onScrollEndDrag, refreshControl } = useTailRefresh(refresh);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  // full height of header + search, and how far the header folds (the headline)
  const [overlayHeight, setOverlayHeight] = useState(0);
  const [foldDistance, setFoldDistance] = useState(0);

  const fold = useMemo(() => {
    const distance = Math.max(foldDistance, 1);
    return {
      overlay: scrollY.interpolate({
        inputRange: [-1, 0, distance],
        outputRange: [1, 0, -distance],
        extrapolateLeft: 'extend',
        extrapolateRight: 'clamp',
      }),
      // cancels the overlay's upward move so the logo stays in place
      logo: scrollY.interpolate({ inputRange: [0, distance], outputRange: [0, distance], extrapolate: 'clamp' }),
      headlineOpacity: scrollY.interpolate({ inputRange: [0, distance * 0.5], outputRange: [1, 0], extrapolate: 'clamp' }),
    };
  }, [scrollY, foldDistance]);

  const visibleCoupons = useMemo(() => applyCouponFilters(coupons, filters), [coupons, filters]);
  const isFiltering = Boolean(filters.query.trim()) || countActiveFilters(filters) > 0;

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="items-center pt-16" accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={BRAND_PURPLE_SOFT} />
          <Text className="mt-3 font-display text-lg text-brand-purple-soft">Loading deals...</Text>
        </View>
      );
    }

    if (loadError && allCoupons.length === 0) {
      return (
        <EmptyState title="Something went wrong" message={loadError} actionLabel="Try again" onAction={handleRefresh} />
      );
    }

    if (coupons.length === 0) {
      return <EmptyState {...emptyState} />;
    }

    if (visibleCoupons.length === 0) {
      return (
        <EmptyState
          title="No matches"
          message="Nothing fits that search. Try a different word or clear your filters."
          actionLabel="Clear search"
          onAction={() => setFilters(EMPTY_FILTERS)}
        />
      );
    }

    return (
      <>
        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="font-display-medium text-xs uppercase tracking-widest text-brand-purple-soft" accessibilityLiveRegion="polite">
            {isFiltering
              ? `${visibleCoupons.length} of ${coupons.length} deals`
              : `${coupons.length} deal${coupons.length === 1 ? '' : 's'}`}
          </Text>
          <Text className="font-body text-xs text-brand-purple-soft">Tap one for details</Text>
        </View>
        <View className="gap-4">
          {visibleCoupons.map((coupon: any, index: number) => (
            <View key={coupon.coupon_id || index}>
              <CouponThumbnail coupon={coupon} couponTab={isCouponActive(coupon) ? 'active' : 'expired'} />
              <CouponSkeleton visible={isRefreshing} variant="thumbnail" />
            </View>
          ))}
        </View>
      </>
    );
  };

  return (
    <View className="flex-1 bg-brand-cream-soft">
      <Animated.ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: overlayHeight, paddingBottom: 32 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        onScrollEndDrag={onScrollEndDrag}
        refreshControl={refreshControl}
      >
        {renderBody()}
      </Animated.ScrollView>

      <Animated.View
        className="absolute left-0 right-0 top-0 bg-brand-cream-soft"
        style={{ transform: [{ translateY: fold.overlay }] }}
        onLayout={event => setOverlayHeight(event.nativeEvent.layout.height)}
      >
        <View
          className="rounded-b-[34px] bg-brand-purple px-5"
          style={{ zIndex: 1, paddingTop: insets.top + 8, paddingBottom: 24 }}
        >
          <Animated.View style={{ zIndex: 1, transform: [{ translateY: fold.logo }] }}>
            <BrandLockup />
          </Animated.View>
          <Animated.View
            style={{ opacity: fold.headlineOpacity }}
            onLayout={event => setFoldDistance(event.nativeEvent.layout.height)}
          >
            <Text accessibilityRole="header" className="mt-5 font-display text-[26px] leading-8 text-white">
              {headline}
            </Text>
          </Animated.View>
        </View>

        <View className="px-5 pb-4 pt-4">
          <SearchFilterBar filters={filters} onChange={setFilters} coupons={coupons} placeholder={searchPlaceholder} />
          <WagTail scrollY={scrollY} isWagging={isRefreshing} />
        </View>
      </Animated.View>
    </View>
  );
}
