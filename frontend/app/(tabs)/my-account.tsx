import { TouchableOpacity, Linking, Alert, Modal, ScrollView } from 'react-native';
import { BRAND_DANGER, BRAND_PURPLE, CARD_SHADOW } from '@/constants/Colors';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Settings, MessageCircleQuestionMark, File, Lock, Trash2, LogOut, Sparkles, ChevronRight, Cat } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useCoupons } from '@/contexts/CouponsContext';
import { useUsage } from '@/contexts/UsageContext';
import { useSavedCoupons } from '@/contexts/SavedCouponsContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { openPrivacyPolicy, openTermsOfService } from '../../utils/pdfViewer';
import BrandHeader from '@/components/BrandHeader';
import PaywallScreen from '@/components/PaywallScreen';
import NearbyAlertsToggle from '@/components/NearbyAlertsToggle';
import { useState } from 'react';

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



  const menuItems = [
    isSubscribed
      ? { icon: Settings, label: 'Unsubscribe', onPress: handleManageSubscription }
      : { icon: Sparkles, label: 'Subscribe', onPress: () => setShowPaywall(true) },
    { icon: Cat, label: 'Meet Willie', onPress: replayOnboarding },
    { icon: MessageCircleQuestionMark, label: 'Support', onPress: handleSupport },
    { icon: File, label: 'Terms of Service', onPress: openTermsOfService },
    { icon: Lock, label: 'Privacy Policy', onPress: openPrivacyPolicy },
    { icon: Trash2, label: 'Delete Account', onPress: handleDeleteAccount, destructive: true },
  ];

  const stats = [
    { label: 'Coupons used', value: couponsUsed },
    ...(isSavingAvailable ? [{ label: 'Saved', value: savedIds.size }] : []),
    { label: 'Open deals', value: activeCoupons.length },
  ];

  return (
    <View className="flex-1 bg-brand-cream-soft">
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

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* summary header */}
        <BrandHeader overlap={44}>
          <View className="flex-row items-end">
            <View className="flex-1">
              <Text accessibilityRole="header" className="mt-5 font-display text-[26px] leading-8 text-white">
                {firstName ? `Hey ${firstName},` : 'Hey there,'}
              </Text>
              <Text className="font-display text-[26px] leading-8 text-brand-cream">
                {couponsUsed > 0
                  ? `you've used ${couponsUsed} coupon${couponsUsed === 1 ? '' : 's'}.`
                  : "let's find your first deal."}
              </Text>
            </View>
            <Image
              source={require('@/assets/images/willie/arms-up.png')}
              style={{ width: 96, height: 96, marginLeft: 8 }}
              contentFit="contain"
              accessible={false}
            />
          </View>
        </BrandHeader>

        <View className="-mt-11 px-5">
          {/* identity card */}
          <View className="rounded-card border border-brand-tan bg-white p-4" style={CARD_SHADOW}>
            <View className="flex-row items-center">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-purple">
                <Text className="font-display text-xl text-white">{getInitials(fullName, user?.email)}</Text>
              </View>
              <View className="ml-3 flex-1">
                {/* eventually this will be fetched from the OAuth session */}
                <Text numberOfLines={1} className="font-display text-xl text-brand-purple">{fullName || 'Wildcat'}</Text>
                <Text numberOfLines={1} className="font-body text-sm text-brand-purple-soft">{user?.email}</Text>
              </View>
            </View>

            <View className="mt-4 flex-row border-t border-brand-cream pt-3">
              {stats.map((stat, index) => (
                <View
                  key={stat.label}
                  className={`flex-1 items-center ${index > 0 ? 'border-l border-brand-cream' : ''}`}
                  accessible
                  accessibilityLabel={`${stat.value} ${stat.label}`}
                >
                  <Text className="font-display text-2xl text-brand-purple">{stat.value}</Text>
                  <Text className="font-display-medium text-xs text-brand-purple-soft">{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* student pass card */}
          <View className="mt-4 rounded-card border border-brand-tan bg-brand-cream p-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="font-display-medium text-xs uppercase tracking-widest text-brand-purple-soft">
                  Student pass
                </Text>
                <Text className="mt-1 font-display text-xl text-brand-purple">Quarter Coupon Pass</Text>
                <Text className="mt-1 font-body-medium text-sm text-brand-ink">
                  {isSubscribed
                    ? `Expires ${subscriptionExpiration ? subscriptionExpiration.toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'long', day: 'numeric', year: 'numeric' }) : '—'}`
                    : 'Not active yet'}
                </Text>
              </View>
              <View className={`rounded-full px-3 py-1.5 ${isSubscribed ? 'bg-brand-purple' : 'bg-white'}`}>
                <Text className={`font-display-medium text-xs ${isSubscribed ? 'text-brand-cream' : 'text-brand-purple-soft'}`}>
                  {isSubscribed ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
            {!isSubscribed ? (
              <TouchableOpacity
                onPress={() => setShowPaywall(true)}
                accessibilityRole="button"
                className="mt-4 min-h-12 items-center justify-center rounded-full bg-brand-purple"
              >
                <Text className="font-display text-lg text-brand-cream">Get the pass</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <NearbyAlertsToggle />

          {/* account and support */}
          <View className="mt-4 overflow-hidden rounded-card border border-brand-tan bg-white">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const tint = item.destructive ? BRAND_DANGER : BRAND_PURPLE;
              return (
                <TouchableOpacity
                  key={item.label}
                  accessibilityRole="button"
                  className={`min-h-14 flex-row items-center px-4 py-3 ${index > 0 ? 'border-t border-brand-cream' : ''}`}
                  onPress={item.onPress}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-cream">
                    <Icon size={18} color={tint} />
                  </View>
                  <Text
                    className={`ml-3 flex-1 font-body-medium text-base ${item.destructive ? 'text-brand-danger' : 'text-brand-ink'}`}
                  >
                    {item.label}
                  </Text>
                  <ChevronRight size={18} color={tint} opacity={0.4} />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={logout}
            accessibilityRole="button"
            className="mt-6 min-h-12 flex-row items-center justify-center rounded-card border border-brand-tan bg-white"
          >
            <LogOut size={18} color={BRAND_PURPLE} />
            <Text className="ml-2 font-body-medium text-base text-brand-purple">Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
