// Pictures for a coupon card: the business logo (from the coupon row's
// `image_url`) and a 4:3 photo of the place.

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

// Card photos bundled with the app, from the website (willieswallet.vercel.app):
// the business's own site or photos the owner posted to Google Maps. Matched by
// a prefix of the normalized vendor name, so "Club Pilates Evanston" finds
// "clubpilates". A business with no photo gets a lilac block instead. A
// `photo_url` column on the coupon row, if one is ever added, wins over these.
const PHOTOS: [string, number][] = [
    ['animalrecords', require('../assets/images/photos/animal-records.jpg')],
    ['chengdubistro', require('../assets/images/photos/chengdu-bistro.jpg')],
    ['clubpilates', require('../assets/images/photos/club-pilates.jpg')],
    ['cravecookies', require('../assets/images/photos/crave-cookies.jpg')],
    ['crepeoclock', require('../assets/images/photos/crepe-oclock.jpg')],
    ['curtscafe', require('../assets/images/photos/curts-cafe.jpg')],
    ['devildawgs', require('../assets/images/photos/devil-dawgs.jpg')],
    ['elephantvine', require('../assets/images/photos/elephant-vine.jpg')],
    ['evanails', require('../assets/images/photos/eva-nails.jpg')],
    ['evanstoncornerbistro', require('../assets/images/photos/evanston-corner-bistro.jpg')],
    ['fridas', require('../assets/images/photos/fridas.jpg')],
    ['gather', require('../assets/images/photos/gather.jpg')],
    ['lacocinita', require('../assets/images/photos/la-cocinita.jpg')],
    ['landlake', require('../assets/images/photos/land-and-lake.jpg')],
    ['lockchicago', require('../assets/images/photos/lock-chicago.jpg')],
    // the website spells it "Moge Tee", the coupon table "Moge Tea"
    ['moget', require('../assets/images/photos/moge-tee.jpg')],
    ['mteverest', require('../assets/images/photos/mt-everest.jpg')],
    ['ovofrito', require('../assets/images/photos/ovo-frito.jpg')],
    ['papajohns', require('../assets/images/photos/papa-johns.jpg')],
    ['pilatesconnection', require('../assets/images/photos/pilates-connection.jpg')],
    ['reprisecoffee', require('../assets/images/photos/reprise-coffee.jpg')],
    ['titleboxing', require('../assets/images/photos/title-boxing.jpg')],
    ['yofresh', require('../assets/images/photos/yofresh.jpg')],
    ['zorasplace', require('../assets/images/photos/zoras-place.jpg')],
];

// expo-image source for the coupon's photo, or null for the lilac block
export const couponPhoto = (coupon: any): number | { uri: string } | null => {
    if (typeof coupon?.photo_url === 'string' && coupon.photo_url) return { uri: coupon.photo_url };
    if (typeof coupon?.vendor !== 'string') return null;
    const key = normalizeVendor(coupon.vendor);
    return PHOTOS.find(([prefix]) => key.startsWith(prefix))?.[1] ?? null;
};
