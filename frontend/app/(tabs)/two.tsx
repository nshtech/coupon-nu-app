import { StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EditScreenInfo from '@/components/EditScreenInfo';

export default function TabTwoScreen() {
  return (
    <View>
      <View className="py-4 px-6" style={{ backgroundColor: Colors.PURPLE_80 }}>
        <Text className="text-white text-3xl font-inter-bold">Stephen Levitt</Text>
        <Text className="text-white text-lg font-inter-bold mb-5">ceo@studentholdings.org</Text>
        <Text className="text-white text-2xl font-inter-bold">Subscription renews on January 1, 2026</Text>
      </View>      
      <View className="bg-white p-4">
        
        {/* Settings */}
        <View className="space-y-4">
          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="person-outline" size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-medium ml-3">Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="settings-outline" size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-medium ml-3">Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="card-outline" size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-medium ml-3">Payment Methods</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="help-circle-outline" size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-medium ml-3">Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <Ionicons name="log-out-outline" size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-medium ml-3">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>

  );
}

