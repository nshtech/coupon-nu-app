// Willie's Wallet palette (design rework values)
export const BRAND_PURPLE = '#4e2078';
export const BRAND_PURPLE_MID = '#7b6496';
export const BRAND_PURPLE_SOFT = '#8b75a1';
export const BRAND_CREAM = '#fceac3';
export const BRAND_CREAM_SOFT = '#fff8eb';
export const BRAND_TAN = '#d4b267';
export const BRAND_PEACH = '#efc6a4';
export const BRAND_MINT = '#e3efe6';
export const BRAND_YELLOW = '#ffd25e';
export const BRAND_INK = '#28173b';
export const BRAND_DANGER = '#b42318';

// legacy names, repointed onto the brand palette
export const NU_PURPLE = BRAND_PURPLE;
export const PURPLE_80 = BRAND_PURPLE;
export const PURPLE_70 = '#523080';
export const PURPLE_60 = '#634296';
export const PURPLE_50 = BRAND_PURPLE_MID;
export const PURPLE_40 = BRAND_PURPLE_SOFT;
export const PURPLE_30 = '#a496b5';
export const PURPLE_20 = '#c4b9cf';

// warm, purple-tinted lift for cards and sheets
export const CARD_SHADOW = {
  shadowColor: BRAND_PURPLE,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 2,
};

export const DARK_GRAY = '#6f6379';
export const LIGHT_GRAY = '#e7ddcb';

export default {
  light: {
    text: BRAND_INK,
    background: BRAND_CREAM_SOFT,
    tint: BRAND_PURPLE,
    tabIconDefault: BRAND_PURPLE_SOFT,
    tabIconSelected: BRAND_PURPLE,
  },
  dark: {
    text: '#fff',
    background: BRAND_PURPLE,
    tint: BRAND_CREAM,
    tabIconDefault: BRAND_PURPLE_SOFT,
    tabIconSelected: BRAND_CREAM,
  },
  BRAND_PURPLE,
  BRAND_PURPLE_MID,
  BRAND_PURPLE_SOFT,
  BRAND_CREAM,
  BRAND_CREAM_SOFT,
  BRAND_TAN,
  BRAND_PEACH,
  BRAND_INK,
  NU_PURPLE,
  PURPLE_80,
  PURPLE_70,
  PURPLE_60,
  PURPLE_50,
  PURPLE_40,
  PURPLE_30,
  PURPLE_20,
};
