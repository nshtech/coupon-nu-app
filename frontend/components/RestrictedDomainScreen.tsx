import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_CREAM, BRAND_MUTED } from '@/constants/Colors';
import Display from '@/components/ui/Display';
import { DarkButton } from '@/components/ui/Button';

export default function RestrictedDomainScreen() {
  const { logout } = useAuth();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: BRAND_CREAM }}>
      <Image
        source={require('@/assets/images/willie/boba-silly.png')}
        contentFit="contain"
        accessible={false}
        style={{ width: 150, height: 195 }}
      />

      <Display accessibilityRole="header" size={38} style={{ marginTop: 24, textAlign: 'center' }}>
        Wildcats only!
      </Display>
      <Text style={{ marginTop: 12, paddingHorizontal: 16, textAlign: 'center', fontFamily: 'Figtree_400Regular', fontSize: 16, lineHeight: 23, color: BRAND_MUTED }}>
        Willie's Wallet is for Northwestern students. Please sign in with your
        Northwestern University Google account.
      </Text>

      <DarkButton label="Log Out" onPress={logout} style={{ marginTop: 32, alignSelf: 'stretch', marginHorizontal: 24 }} />
    </View>
  );
}
