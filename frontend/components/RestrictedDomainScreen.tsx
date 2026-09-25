import { Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX } from 'lucide-react-native';
import { BRAND_PURPLE } from '@/constants/Colors';

export default function RestrictedDomainScreen() {
  const { logout } = useAuth();

  return (
    <View className="flex-1 items-center justify-center bg-brand-cream-soft px-6">
      <View className="h-32 w-32 items-center justify-center rounded-full bg-brand-cream">
        <ShieldX size={64} color={BRAND_PURPLE} strokeWidth={1.8} />
      </View>

      <Text className="mt-8 text-center font-display text-3xl text-brand-purple">
        Wildcats only!
      </Text>
      <Text className="mt-3 px-4 text-center font-body text-base text-brand-ink">
        Willie's Wallet is for Northwestern students. Please sign in with your
        Northwestern University Google account.
      </Text>

      <TouchableOpacity
        className="mt-10 w-full max-w-xs rounded-full bg-brand-purple px-10 py-4 active:opacity-80"
        onPress={logout}
      >
        <Text className="text-center font-display text-lg text-brand-cream">Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}
