import { ReactNode } from 'react';
import { View, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Compact purple header shared by every tab: white logo lockup, an optional
// right-side slot, and a page-specific headline (or custom children).

export function BrandLockup() {
  return (
    <Image
      source={require('@/assets/images/logo-white.png')}
      style={{ width: 88, height: 46 }}
      resizeMode="contain"
      accessible
      accessibilityLabel="Willie's Wallet"
    />
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
      className="rounded-b-[34px] bg-brand-purple px-5"
      style={{ paddingTop: insets.top + 8, paddingBottom: 24 + overlap }}
    >
      <View className="flex-row items-center justify-between">
        <BrandLockup />
        {right}
      </View>
      {headline ? (
        <Text accessibilityRole="header" className="mt-5 font-display text-[26px] leading-8 text-white">
          {headline}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
