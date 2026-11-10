// Search and filter state shared by the Discover and Saved tabs.
//
// A coupon's place type is its `category` column, edited in the Supabase
// dashboard (backend/sql/007_coupon_category.sql). The keys below must match the
// values of the `coupon_category` enum there; a coupon with no category, or one
// this build does not know, shows when no type is picked.

export type UsageFilter = 'all' | 'unlimited' | 'limited';

export type PlaceType = 'food' | 'coffee' | 'fitness' | 'beauty' | 'shopping' | 'fun';

export const PLACE_TYPES: { key: PlaceType; label: string }[] = [
  { key: 'food', label: 'Food' },
  { key: 'coffee', label: 'Coffee & treats' },
  { key: 'fitness', label: 'Fitness' },
  { key: 'beauty', label: 'Beauty' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'fun', label: 'Things to do' },
];

export const USAGE_OPTIONS: { key: UsageFilter; label: string }[] = [
  { key: 'all', label: 'Any' },
  { key: 'unlimited', label: 'Unlimited use' },
  { key: 'limited', label: 'Limited use' },
];

const isPlaceType = (value: unknown): value is PlaceType =>
  PLACE_TYPES.some(type => type.key === value);

export const getPlaceType = (coupon: any): PlaceType | null => {
  const category = typeof coupon?.category === 'string' ? coupon.category.trim().toLowerCase() : '';
  return isPlaceType(category) ? category : null;
};

export const getPlaceTypeLabel = (coupon: any): string | null => {
  const type = getPlaceType(coupon);
  return PLACE_TYPES.find(option => option.key === type)?.label ?? null;
};

export type CouponFilters = {
  query: string;
  usage: UsageFilter;
  // empty = every place type
  placeTypes: PlaceType[];
};

export const EMPTY_FILTERS: CouponFilters = { query: '', usage: 'all', placeTypes: [] };

export const countActiveFilters = (filters: CouponFilters) =>
  (filters.usage !== 'all' ? 1 : 0) + filters.placeTypes.length;

export const togglePlaceType = (filters: CouponFilters, type: PlaceType): CouponFilters => ({
  ...filters,
  placeTypes: filters.placeTypes.includes(type)
    ? filters.placeTypes.filter(selected => selected !== type)
    : [...filters.placeTypes, type],
});

// place types that occur in the list, in display order, with how many coupons each
export const placeTypeCounts = (coupons: any[]) => {
  const counts = new Map<PlaceType, number>();
  coupons.forEach(coupon => {
    const type = getPlaceType(coupon);
    if (type) counts.set(type, (counts.get(type) ?? 0) + 1);
  });
  return PLACE_TYPES.filter(type => counts.has(type.key)).map(type => ({ ...type, count: counts.get(type.key)! }));
};

export function applyCouponFilters(coupons: any[], filters: CouponFilters) {
  const query = filters.query.trim().toLowerCase();

  return coupons.filter(coupon => {
    if (query) {
      const haystack = [coupon.vendor, coupon.offer, getPlaceTypeLabel(coupon)]
        .filter(value => typeof value === 'string')
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.usage === 'unlimited' && coupon.usage_limit !== 0) return false;
    if (filters.usage === 'limited' && coupon.usage_limit === 0) return false;
    if (filters.placeTypes.length > 0) {
      const type = getPlaceType(coupon);
      if (!type || !filters.placeTypes.includes(type)) return false;
    }
    return true;
  });
}
