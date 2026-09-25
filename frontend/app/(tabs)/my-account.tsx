import { TouchableOpacity, Linking, Alert } from 'react-native';
import { BRAND_PURPLE } from '@/constants/Colors';
import { View, Text } from 'react-native';
import { Settings, MessageCircleQuestionMark, File, Lock, Trash2, LogOut, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { openPrivacyPolicy, openTermsOfService } from '../../utils/pdfViewer';
import PaywallScreen from '@/components/PaywallScreen';
import { useState } from 'react';

export default function MyAccount() {

  const { user, logout, deleteAccount } = useAuth();
  const { unsubscribe, isSubscribed, subscriptionExpiration } = useSubscription();

  const [showPaywall, setShowPaywall] = useState(false);

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
    { icon: MessageCircleQuestionMark, label: 'Support', onPress: handleSupport },
    { icon: File, label: 'Terms of Service', onPress: openTermsOfService },
    { icon: Lock, label: 'Privacy Policy', onPress: openPrivacyPolicy },
    { icon: Trash2, label: 'Delete Account', onPress: handleDeleteAccount },
    { icon: LogOut, label: 'Log Out', onPress: logout },
  ];

  // the paywall closes itself once the purchase lands and isSubscribed flips
  if (showPaywall && !isSubscribed) {
    return <PaywallScreen onClose={() => setShowPaywall(false)} />;
  }

  return (
    <View className="flex-1 bg-brand-cream-soft">
      {/* profile header */}
      <View className="rounded-b-[28px] bg-brand-purple px-6 pb-7 pt-4">
        {/* eventually this will be fetched from the OAuth session */}
        <Text className="font-display text-3xl text-brand-cream">{user?.user_metadata.full_name}</Text>
        <Text className="mt-1 font-body text-base text-brand-purple-soft">{user?.email}</Text>

        <View className="mt-5 rounded-xl bg-white px-4 py-3">
          <Text className="font-body-medium text-xs uppercase tracking-widest text-brand-purple-soft">
            Fall Quarter Coupon Pass
          </Text>
          <Text className="mt-1 font-display text-xl text-brand-purple">
            {isSubscribed
              ? `Expires ${subscriptionExpiration ? subscriptionExpiration.toLocaleDateString('en-US', { timeZone: 'America/Chicago' }) : '—'}`
              : 'Not active yet'}
          </Text>
        </View>
      </View>

      <View className="flex-1 px-5 pt-5">
        <View className="overflow-hidden rounded-card border border-brand-tan bg-white">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center px-4 py-4 active:bg-brand-cream-soft ${index > 0 ? 'border-t border-brand-cream' : ''}`}
                onPress={item.onPress}
              >
                <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-cream">
                  <Icon size={20} color={BRAND_PURPLE} />
                </View>
                <Text className="ml-3 font-body-medium text-base text-brand-ink">{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View className="flex-1 items-center justify-end pb-6">
          <Text className="font-body text-sm text-brand-purple-soft">Version 1.0.0</Text>
        </View>
      </View>
    </View>
  );
}
