// Pictures for a coupon card: the business logo (from the coupon row's
// `image_url`) and a 4:3 photo of the place (its `photo_url`).

// vendor name compared without case, punctuation or accents
export const normalizeVendor = (vendor: string) =>
    vendor.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

// Some vendor logos were uploaded with lots of white padding, so they look tiny
// in the logo badges. These get zoomed in; the badge crops the overflow.
// Cropping the file in Storage is the real fix; once a logo is re-uploaded
// tight, drop it from this list.
//
// The measured ones are set so the artwork spans about 84% of the badge:
// zoom = 1.05 / (artwork's share of the file, on its longer side). Logo files
// are 1000 × 1000.
const PADDED_LOGO_SCALES = new Map<string, number>([
    ['animalrecords', 1.5],
    // the navy square fills the badge, hiding the file's white frame
    ['chengdubistro', 1.9],
    ['clubpilatesevanston', 2.7],
    ['cravecookies', 1.3],
    // round logos are set a little smaller so they clear the badge's edge
    ['crepeoclock', 1.2],
    ['curtscafe', 2.6],
    // its light grey backing box runs off the badge's sides
    ['devildawgsevanston', 1.4],
    ['elephantvine', 2.9],
    ['evanails', 1.5],
    ['evanstoncornerbistro', 2.25],
    ['gatherconsciouslycurated', 4.8],
    // artwork is 37% of the file
    ['lacocinita', 2.9],
    ['lockchicago', 1.5],
    ['mogetea', 1.5],
    ['mteverestrestaurant', 1.5],
    ['ovofritocafe', 1.5],
    ['pilatesconnectionchicago', 2.25],
    ['reprisecoffeeroasters', 1.5],
    ['titleboxingevanston', 1.5],
]);

// how far to zoom a coupon's logo inside its badge (1 = fit the whole file)
export const logoZoom = (vendor?: string): number =>
    (vendor ? PADDED_LOGO_SCALES.get(normalizeVendor(vendor)) : undefined) ?? 1;

// Logos drawn on their own colored background fill the badge with that color.
// Keys are prefixes of the normalized vendor name.
const LOGO_BACKGROUNDS: [string, string][] = [
    ['ovofrito', '#FDC14E'],
    ['mteverest', '#03A6A1'],
    ['chengdubistro', '#03004D'],
];

export const logoBackground = (vendor?: string): string | null => {
    if (!vendor) return null;
    const key = normalizeVendor(vendor);
    return LOGO_BACKGROUNDS.find(([prefix]) => key.startsWith(prefix))?.[1] ?? null;
};

// expo-image source for the coupon's photo (the `photo_url` column, a Supabase
// Storage URL), or null for the lilac block
export const couponPhoto = (coupon: any): { uri: string } | null =>
    typeof coupon?.photo_url === 'string' && coupon.photo_url ? { uri: coupon.photo_url } : null;
