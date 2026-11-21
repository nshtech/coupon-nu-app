import { Linking, Alert, Modal, ScrollView, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BRAND_CREAM,
  BRAND_DANGER,
  BRAND_INK,
  BRAND_MUTED,
  BRAND_PURPLE,
  BRAND_PURPLE_MID,
  BRAND_YELLOW,
  OUTLINE,
  RADIUS,
  SHADOW,
  WHITE,
} from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCoupons } from '@/contexts/CouponsContext';
import { useUsage } from '@/contexts/UsageContext';
import { useSavedCoupons } from '@/contexts/SavedCouponsContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { openPrivacyPolicy, openTermsOfService } from '../../utils/pdfViewer';
import { BrandLockup } from '@/components/BrandHeader';
import PaywallScreen from '@/components/PaywallScreen';
import NearbyAlertsToggle from '@/components/NearbyAlertsToggle';
import Display from '@/components/ui/Display';
import Icon, { IconName } from '@/components/ui/Icon';
import SettingsRow from '@/components/ui/SettingsRow';
import { Raised } from '@/components/ui/Raised';
import { DarkButton } from '@/components/ui/Button';
import { useState } from 'react';

// Willie stands on a lighter purple circle in the header
const WILLIE_WIDTH = 112;
// arms-up.png is 533 x 700
const WILLIE_HEIGHT = Math.round((WILLIE_WIDTH * 700) / 533);

const getInitials = (name: string | undefined, email: string | undefined) => {
  const source = name?.trim() || email?.split('@')[0] || '';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'W';
};

export default function MyAccount() {

  const { user, logout, deleteAccount } = useAuth();
  const { unsubscribe, isSubscribed, subscriptionExpiration } = useSubscription();
  const { activeCoupons } = useCoupons();
  const { userCouponToUsages } = useUsage();
  const { savedIds, isSavingAvailable } = useSavedCoupons();
  const { replayOnboarding } = useOnboarding();

  const [showPaywall, setShowPaywall] = useState(false);
  const insets = useSafeAreaInsets();

  const fullName: string | undefined = user?.user_metadata?.full_name;
  const firstName = fullName?.trim().split(/\s+/)[0];
  const couponsUsed = Array.from(userCouponToUsages.values()).reduce((total, count) => total + count, 0);

  const handleSupport = () => {
    const email = 'tech@studentholdings.org';
    const subject = 'Support Request - Willie\'s Wallet';

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    Linking.canOpenURL(mailtoUrl).then(supported => {
      if (supported) {
        Linking.openURL(mailtoUrl);
      } else {
        console.log('Email app not available');
        alert('Please email us at tech@studentholdings.org with your issue!');
      }
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            console.log('Account deleted successfully');
            unsubscribe();
          } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert('Error', 'Failed to delete account. Please try again.');
          }
        }
      }
    ]);
  }

  const handleManageSubscription = () => {
    Alert.alert(
      'Unsubscribe',
      "Are you sure you want to unsubscribe from Willie's Wallet? This is irreversible and will remove your access to all features.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => unsubscribe(),
        },
      ]
    );
  }



  const menuItems: { icon: IconName; label: string; onPress: () => void; destructive?: boolean }[] = [
    isSubscribed
      ? { icon: 'unsubscribe', label: 'Unsubscribe', onPress: handleManageSubscription }
      : { icon: 'tag', label: 'Subscribe', onPress: () => setShowPaywall(true) },
    { icon: 'meetWillie', label: 'Meet Willie', onPress: replayOnboarding },
    { icon: 'support', label: 'Support', onPress: handleSupport },
    { icon: 'document', label: 'Terms of Service', onPress: openTermsOfService },
    { icon: 'lock', label: 'Privacy Policy', onPress: openPrivacyPolicy },
    { icon: 'trash', label: 'Delete Account', onPress: handleDeleteAccount, destructive: true },
    { icon: 'logout', label: 'Log Out', onPress: logout },
  ];

  // the header already says how many coupons were used; the rest is one line
  const countsLine = [
    ...(isSavingAvailable ? [`${savedIds.size} saved`] : []),
    `${activeCoupons.length} deal${activeCoupons.length === 1 ? '' : 's'} open`,
  ].join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: BRAND_CREAM }}>
      {/* full-screen modal so the paywall covers the tab bar like it does elsewhere */}
      {/* the paywall closes itself once the purchase lands and isSubscribed flips */}
      <Modal
        visible={showPaywall && !isSubscribed}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen onClose={() => setShowPaywall(false)} />
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* summary header; the profile card overlaps its bottom 44pt */}
        <View
          style={{
            backgroundColor: BRAND_PURPLE,
            borderBottomWidth: OUTLINE,
            borderBottomColor: BRAND_INK,
            paddingHorizontal: 20,
            paddingTop: insets.top + 8,
            paddingBottom: 64,
            overflow: 'hidden',
          }}
        >
          <View
            pointerEvents="none"
            style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, right: 6, top: insets.top + 12, backgroundColor: BRAND_PURPLE_MID }}
          />
          <Image
            source={require('@/assets/images/willie/arms-up.png')}
            contentFit="contain"
            accessible={false}
            style={{ position: 'absolute', right: 26, top: insets.top + 16, width: WILLIE_WIDTH, height: WILLIE_HEIGHT }}
          />
          <BrandLockup />
          <Display accessibilityRole="header" size={34} color={BRAND_CREAM} style={{ marginTop: 16, paddingRight: 120 }}>
            {firstName ? `Hey ${firstName},\n` : 'Hey there,\n'}
            {couponsUsed > 0
              ? `you've used ${couponsUsed} coupon${couponsUsed === 1 ? '' : 's'}.`
              : "let's find your first deal."}
          </Display>
        </View>

        <View style={{ marginTop: -44, marginLeft: 16, marginRight: 16, gap: 10 }}>
          {/* identity card */}
          <Raised radius={RADIUS.card} style={{ marginRight: SHADOW, marginBottom: SHADOW }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: RADIUS.card,
                borderWidth: OUTLINE,
                borderColor: BRAND_INK,
                backgroundColor: WHITE,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: OUTLINE,
                  borderColor: BRAND_INK,
                  backgroundColor: BRAND_PURPLE,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Display size={20} color={BRAND_CREAM}>{getInitials(fullName, user?.email)}</Display>
              </View>
              <View style={{ flex: 1, minWidth: 0, marginLeft: 14 }}>
                {/* eventually this will be fetched from the OAuth session */}
                <Display size={22} numberOfLines={1}>{fullName || 'Wildcat'}</Display>
                <Text numberOfLines={1} style={{ marginTop: 2, fontFamily: 'Figtree_400Regular', fontSize: 14, color: BRAND_MUTED }}>
                  {user?.email}
                </Text>
                <Text style={{ marginTop: 4, fontFamily: 'Figtree_600SemiBold', fontSize: 14, color: BRAND_INK }}>{countsLine}</Text>
              </View>
            </View>
          </Raised>

          {/* student pass */}
          <Raised radius={RADIUS.card} style={{ marginRight: SHADOW, marginBottom: SHADOW }}>
            <View
              style={{
                paddingVertical: 16,
                paddingHorizontal: 18,
                borderRadius: RADIUS.card,
                borderWidth: OUTLINE,
                borderColor: BRAND_INK,
                backgroundColor: BRAND_YELLOW,
              }}
            >
              <Display size={24}>Quarter Coupon Pass</Display>
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ flexShrink: 1, fontFamily: 'Figtree_600SemiBold', fontSize: 15, color: BRAND_INK }}>
                  {!isSubscribed
                    ? 'Not active yet'
                    : subscriptionExpiration
                      ? `Expires ${subscriptionExpiration.toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric' })}`
                      : ''}
                </Text>
                {isSubscribed ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                    <Icon name="check" size={18} strokeWidth={3} />
                    <Text style={{ marginLeft: 4, fontFamily: 'Figtree_700Bold', fontSize: 15, color: BRAND_INK }}>Active</Text>
                  </View>
                ) : (
                  <Text style={{ marginLeft: 12, fontFamily: 'Figtree_700Bold', fontSize: 15, color: BRAND_INK }}>Inactive</Text>
                )}
              </View>
              {!isSubscribed ? (
                <DarkButton label="Get the pass" onPress={() => setShowPaywall(true)} size="sm" style={{ marginTop: 14 }} />
              ) : null}
            </View>
          </Raised>
        </View>

        {/* settings: plain rows on the page, same order as before */}
        <View style={{ marginTop: 6, marginHorizontal: 20 }}>
          <NearbyAlertsToggle />
          {menuItems.map(item => (
            <SettingsRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={item.onPress}
              color={item.destructive ? BRAND_DANGER : BRAND_INK}
              divider
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
