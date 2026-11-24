import { useMemo, useRef, useState } from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageSource } from 'expo-image';
import { BrandLockup, HeaderHeadline } from '@/components/BrandHeader';
import SearchFilterBar from '@/components/SearchFilterBar';
import CouponThumbnail from '@/components/CouponThumbnail';
import CouponSkeleton from '@/components/CouponSkeleton';
import EmptyState from '@/components/EmptyState';
import WagTail, { useTailRefresh } from '@/components/WagTail';
import { DarkButton } from '@/components/ui/Button';
import { useCoupons } from '@/contexts/CouponsContext';
import { BRAND_CREAM, BRAND_INK, BRAND_MUTED, BRAND_PURPLE, OUTLINE, RADIUS, WHITE } from '@/constants/Colors';
import { EMPTY_FILTERS, applyCouponFilters, countActiveFilters } from '@/utils/couponFilters';

// Header + search/filter + coupon cards, shared by the Discover and Saved tabs.
// The header and search bar float over the cards. Scrolling down folds the
// headline away, leaving a short purple bar with just the wordmark; pulling
// down moves the whole header with the cards, and Willie's tail drops from
// under the purple and wags while the refresh runs, in place of a spinner.

const GUTTER = 16;

type CouponListScreenProps = {
  headline: string;
  // the tab's coupons before search and filters are applied
  coupons: any[];
  // words after the count above the list: "30 deals this quarter", "3 saved"
  countLabel: (count: number) => string;
  emptyState: { title: string; message: string; actionLabel?: string; onAction?: () => void; image?: ImageSource | number };
  searchPlaceholder?: string;
};

export function ListHead({ count, label }: { count: number; label: string }) {
  return (
    <Text
      accessibilityLiveRegion="polite"
      style={{ marginBottom: 10, fontFamily: 'Figtree_600SemiBold', fontSize: 14, color: BRAND_MUTED }}
    >
      <Text
        style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: 20, letterSpacing: -0.4, color: BRAND_INK }}
      >
        {count}
      </Text>{' '}
      {label}
    </Text>
  );
}

export default function CouponListScreen({ headline, coupons, countLabel, emptyState, searchPlaceholder }: CouponListScreenProps) {
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
      // cancels the overlay's upward move so the wordmark stays in place
      logo: scrollY.interpolate({ inputRange: [0, distance], outputRange: [0, distance], extrapolate: 'clamp' }),
      headlineOpacity: scrollY.interpolate({ inputRange: [0, distance * 0.5], outputRange: [1, 0], extrapolate: 'clamp' }),
    };
  }, [scrollY, foldDistance]);

  const visibleCoupons = useMemo(() => applyCouponFilters(coupons, filters), [coupons, filters]);
  const isFiltering = Boolean(filters.query.trim()) || countActiveFilters(filters) > 0;

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={{ alignItems: 'center', paddingTop: 64 }} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={BRAND_INK} />
          <Text style={{ marginTop: 12, fontFamily: 'Figtree_700Bold', fontSize: 17, color: BRAND_MUTED }}>Loading deals...</Text>
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
        {loadError ? (
          // a failed refresh keeps the last list on screen; say so without hiding it
          <View
            style={{
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: RADIUS.card,
              borderWidth: OUTLINE,
              borderColor: BRAND_INK,
              backgroundColor: WHITE,
            }}
            accessibilityLiveRegion="polite"
          >
            <Text style={{ flex: 1, paddingRight: 12, fontFamily: 'Figtree_500Medium', fontSize: 14, color: BRAND_INK }}>{loadError}</Text>
            <DarkButton label="Try again" onPress={handleRefresh} size="sm" />
          </View>
        ) : null}
        <ListHead
          count={visibleCoupons.length}
          label={isFiltering ? `of ${coupons.length} deals` : countLabel(coupons.length)}
        />
        <View style={{ gap: 10 }}>
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
    <View style={{ flex: 1, backgroundColor: BRAND_CREAM }}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: overlayHeight + 14, paddingBottom: 32 }}
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
        style={{ position: 'absolute', left: 0, right: 0, top: 0, backgroundColor: BRAND_CREAM, transform: [{ translateY: fold.overlay }] }}
        onLayout={event => setOverlayHeight(event.nativeEvent.layout.height)}
      >
        <View
          style={{
            zIndex: 1,
            backgroundColor: BRAND_PURPLE,
            borderBottomWidth: OUTLINE,
            borderBottomColor: BRAND_INK,
            paddingHorizontal: 20,
            paddingTop: insets.top + 8,
            paddingBottom: 14,
          }}
        >
          <Animated.View style={{ zIndex: 1, transform: [{ translateY: fold.logo }] }}>
            <BrandLockup />
          </Animated.View>
          <Animated.View
            style={{ opacity: fold.headlineOpacity, paddingBottom: 8 }}
            onLayout={event => setFoldDistance(event.nativeEvent.layout.height)}
          >
            <HeaderHeadline>{headline}</HeaderHeadline>
          </Animated.View>
        </View>

        <View style={{ paddingHorizontal: GUTTER, paddingTop: 16, paddingBottom: 4 }}>
          <SearchFilterBar filters={filters} onChange={setFilters} coupons={coupons} placeholder={searchPlaceholder} />
          <WagTail scrollY={scrollY} isWagging={isRefreshing} />
        </View>
      </Animated.View>
    </View>
  );
}
