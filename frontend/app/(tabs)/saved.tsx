import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import CouponListScreen from '@/components/CouponListScreen';
import { useCoupons } from '@/contexts/CouponsContext';
import { useSavedCoupons } from '@/contexts/SavedCouponsContext';
import { useAppText } from '@/utils/appText';

export default function Saved() {
  const router = useRouter();
  const { allCoupons } = useCoupons();
  const { savedIds, isSavingAvailable } = useSavedCoupons();
  // editable in Supabase: app_text row 'saved_headline'
  const headline = useAppText('saved_headline', 'Saved for your next outing.');

  const savedCoupons = useMemo(
    () => allCoupons.filter(coupon => savedIds.has(coupon.coupon_id)),
    [allCoupons, savedIds]
  );

  return (
    <CouponListScreen
      headline={headline}
      coupons={savedCoupons}
      searchPlaceholder="Search saved deals"
      emptyState={
        isSavingAvailable
          ? {
              title: 'Nothing saved yet',
              message: 'Tap the heart on any deal and it will wait for you here.',
              actionLabel: 'Browse deals',
              onAction: () => router.navigate('/'),
            }
          : {
              title: 'Saving is coming soon',
              message: "We're still setting up saved deals. Hang tight!",
              actionLabel: 'Browse deals',
              onAction: () => router.navigate('/'),
            }
      }
    />
  );
}
