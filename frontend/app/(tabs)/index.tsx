import CouponListScreen from '@/components/CouponListScreen';
import { useCoupons } from '@/contexts/CouponsContext';
import { useAppText } from '@/utils/appText';

// Discover: every coupon the user can still use. Fully redeemed coupons move
// to the Used tab.
export default function Discover() {
  const { activeCoupons } = useCoupons();
  // editable in Supabase: app_text row 'discover_headline'
  const headline = useAppText('discover_headline', 'Good deals, right around the corner.');

  return (
    <CouponListScreen
      headline={headline}
      coupons={activeCoupons}
      emptyState={{
        title: 'No active coupons',
        message: 'Check back soon for new Evanston deals!',
      }}
    />
  );
}
