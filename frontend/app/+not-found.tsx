import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-brand-cream-soft p-5">
        <Text className="text-center font-display text-2xl text-brand-purple">
          This screen doesn't exist.
        </Text>

        <Link href="/(tabs)" className="mt-6 rounded-full bg-brand-purple px-8 py-4">
          <Text className="font-display text-base text-brand-cream">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
