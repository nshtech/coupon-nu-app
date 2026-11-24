import { ReactNode } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Display from '@/components/ui/Display';
import { BRAND_CREAM, BRAND_INK, BRAND_PURPLE, OUTLINE } from '@/constants/Colors';

// Purple header shared by every tab: cream wordmark, an optional right-side
// slot, and a page headline (or custom children). Square bottom edge with a 2px
// ink line. The wordmark uses expo-image, not React Native's Image: on iOS 26
// builds the new architecture can reuse the login screen's native image view
// for the first tab's header and keep showing the login artwork.

// wordmark-basic-dark.png is 700 x 86
export const WORDMARK_HEIGHT = 24;
const WORDMARK_WIDTH = Math.round((WORDMARK_HEIGHT * 700) / 86);

export function BrandLockup() {
  return (
    <Image
      source={require('@/assets/images/brand/wordmark-basic-dark.png')}
      style={{ width: WORDMARK_WIDTH, height: WORDMARK_HEIGHT }}
      contentFit="contain"
      accessible
      accessibilityLabel="Willie's Wallet"
    />
  );
}

export function HeaderHeadline({ children, size = 30 }: { children: ReactNode; size?: number }) {
  return (
    <Display accessibilityRole="header" size={size} color={BRAND_CREAM} style={{ marginTop: 16 }}>
      {children}
    </Display>
  );
}

type BrandHeaderProps = {
  headline?: string;
  right?: ReactNode;
  children?: ReactNode;
  // extra bottom padding, for content that overlaps the header's lower edge
  overlap?: number;
};

export default function BrandHeader({ headline, right, children, overlap = 0 }: BrandHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: BRAND_PURPLE,
        borderBottomWidth: OUTLINE,
        borderBottomColor: BRAND_INK,
        paddingHorizontal: 20,
        paddingTop: insets.top + 8,
        paddingBottom: 22 + overlap,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <BrandLockup />
        {right}
      </View>
      {headline ? <HeaderHeadline>{headline}</HeaderHeadline> : null}
      {children}
    </View>
  );
}
