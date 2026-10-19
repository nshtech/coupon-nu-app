// Some vendor logos were uploaded with lots of white padding, so they look tiny
// in the logo tiles. These get zoomed in. Cropping the file in Storage is the
// real fix; once a logo is re-uploaded tight, drop it from this list.

// vendor name (compared without case, punctuation or accents) → zoom
const PADDED_LOGO_SCALES = new Map<string, number>([
    ['animalrecords', 1.5],
    ['clubpilatesevanston', 1.5],
    ['curtscafe', 1.5],
    ['evanails', 1.5],
    ['evanstoncornerbistro', 2.25],
    ['gatherconsciouslycurated', 2.25],
    ['lacocinita', 1.5],
    ['lockchicago', 1.5],
    ['mogetea', 1.5],
    ['mteverestrestaurant', 1.5],
    ['ovofritocafe', 1.5],
    ['pilatesconnectionchicago', 2.25],
    ['reprisecoffeeroasters', 1.5],
    ['titleboxingevanston', 1.5],
]);

const normalizeVendor = (vendor: string) =>
    vendor.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

// style to spread into a coupon logo <Image>
export const logoZoomStyle = (vendor?: string) => {
    const scale = vendor ? PADDED_LOGO_SCALES.get(normalizeVendor(vendor)) : undefined;
    return scale ? { transform: [{ scale }] } : null;
};
