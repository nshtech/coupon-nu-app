import { Text, View, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX } from 'lucide-react-native';
import Colors from '@/constants/Colors';

export default function RestrictedDomainScreen() {
  const { logout } = useAuth();

  return (
    <View className="flex-1 bg-white px-6 items-center justify-center">
      <ShieldX size={72} color={Colors.PURPLE_80} strokeWidth={1.8} />
      <Text className="text-black text-3xl font-inter-bold text-center mt-6">
        This app is for Northwestern students only.
      </Text>
      <Text className="text-dark-gray text-lg font-inter-medium text-center mt-4 px-4">
        Please sign in with a Northwestern University Google account!
      </Text>

      <TouchableOpacity
        className="bg-purple-80 px-10 py-4 rounded-lg mt-10"
        onPress={logout}
      >
        <Text className="text-white text-xl font-inter-bold text-center">Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}
