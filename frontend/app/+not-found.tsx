import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import Display from '@/components/ui/Display';
import { DarkButton } from '@/components/ui/Button';
import { BRAND_CREAM } from '@/constants/Colors';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: BRAND_CREAM }}>
        <Display size={30} style={{ textAlign: 'center' }}>
          This screen doesn't exist.
        </Display>
        <DarkButton label="Go to home screen!" onPress={() => router.replace('/(tabs)')} style={{ marginTop: 24 }} />
      </View>
    </>
  );
}
