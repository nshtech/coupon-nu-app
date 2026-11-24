// The words on a deal card. The design leads with a short offer headline
// ("15% off", max ~18 characters) and a one-line description ("Your first
// visit."). The coupon table only has one long `offer` sentence today, so until
// short copy exists the card shows the business name in the headline slot and
// the existing offer sentence as the description (the fallback in the
// redesign handoff). Add `short_offer` and `short_desc` columns to the coupons
// view and every card, sheet and receipt picks them up with no app change.

export type DealCopy = {
  // small line above the headline; null when the headline is already the name
  business: string | null;
  headline: string;
  description: string | null;
};

const clean = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

export function dealCopy(coupon: any): DealCopy {
  const vendor = clean(coupon?.vendor) ?? '';
  const shortOffer = clean(coupon?.short_offer);
  if (shortOffer) {
    return { business: vendor, headline: shortOffer, description: clean(coupon?.short_desc) };
  }
  return { business: null, headline: vendor, description: clean(coupon?.offer) };
}
