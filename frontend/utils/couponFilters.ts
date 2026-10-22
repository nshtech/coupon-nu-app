// Search and filter state shared by the Discover and Saved tabs.
//
// The `coupons` table has no category column, so a coupon's place type comes
// from the vendor name (see VENDOR_PLACE_TYPES). If a `category` column is
// added later and holds one of the place type keys, it wins over the map.

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

// vendor name (compared without case, punctuation or accents) → place type.
// Vendors missing here have no place type: they show when no type is picked.
const VENDOR_PLACE_TYPES = new Map<string, PlaceType>([
  ['chengdubistro', 'food'],
  ['curtscafe', 'food'],
  ['devildawgsevanston', 'food'],
  ['evanstoncornerbistro', 'food'],
  ['fridasevanston', 'food'],
  ['lacocinita', 'food'],
  ['landlakecafe', 'food'],
  ['mteverestrestaurant', 'food'],
  ['ovofritocafe', 'food'],
  ['papajohnspizza', 'food'],
  ['yofresh', 'food'],
  ['cravecookies', 'coffee'],
  ['mogetea', 'coffee'],
  ['reprisecoffeeroasters', 'coffee'],
  ['clubpilatesevanston', 'fitness'],
  ['pilatesconnectionchicago', 'fitness'],
  ['titleboxingevanston', 'fitness'],
  ['evanails', 'beauty'],
  ['animalrecords', 'shopping'],
  ['gatherconsciouslycurated', 'shopping'],
  ['lockchicago', 'fun'],
  ['zorasplace', 'fun'],
]);

const normalizeVendor = (vendor: string) =>
  vendor.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

const isPlaceType = (value: unknown): value is PlaceType =>
  PLACE_TYPES.some(type => type.key === value);

export const getPlaceType = (coupon: any): PlaceType | null => {
  const category = typeof coupon?.category === 'string' ? coupon.category.trim().toLowerCase() : '';
  if (isPlaceType(category)) return category;
  return typeof coupon?.vendor === 'string' ? VENDOR_PLACE_TYPES.get(normalizeVendor(coupon.vendor)) ?? null : null;
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
