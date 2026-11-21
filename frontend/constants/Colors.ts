// Willie's Wallet design tokens, mirrored from tailwind.config.js.
export const BRAND_CREAM = '#FFF7EA';
export const BRAND_INK = '#22103D';
export const BRAND_PURPLE = '#401F68';
export const BRAND_PURPLE_MID = '#5A3888';
export const BRAND_YELLOW = '#FFC93C';
export const BRAND_YELLOW_SOFT = '#FFE9A8';
export const BRAND_GREEN = '#1F7A45';
export const BRAND_LILAC = '#E9E2F4';
export const BRAND_LILAC_TEXT = '#EDE4F7';
export const BRAND_MUTED = '#4A3A63';
export const BRAND_WILLIE = '#8C78A4';
// the fluffy tufts on Willie's cheeks and tail tip, and their shading
export const BRAND_WILLIE_FLUFF = '#FAE8C5';
export const BRAND_WILLIE_FLUFF_SHADE = '#ECC8A6';
export const BRAND_HEART = '#D42C6F';
export const BRAND_DANGER = '#B42318';
export const WHITE = '#FFFFFF';

// Every card, button, chip, input, badge and photo gets a 2px ink outline.
export const OUTLINE = 2;

// Hard offset shadows, no blur. A shadow means "you can tap this".
export const SHADOW = 4;
export const SHADOW_SM = 3;

export const RADIUS = {
  card: 22,
  panel: 28,
  sheet: 30,
  badge: 12,
} as const;

export default {
  light: {
    text: BRAND_INK,
    background: BRAND_CREAM,
    tint: BRAND_PURPLE,
    tabIconDefault: BRAND_MUTED,
    tabIconSelected: BRAND_INK,
  },
  dark: {
    text: BRAND_INK,
    background: BRAND_CREAM,
    tint: BRAND_PURPLE,
    tabIconDefault: BRAND_MUTED,
    tabIconSelected: BRAND_INK,
  },
};
