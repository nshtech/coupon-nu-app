import { StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Settings, MessageCircleQuestionMark, File, Lock, Trash2, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function MyAccount() {

  const { logout} = useAuth();


  return (
    <View className="flex-1 bg-white">
      <View className="py-4 px-6 bg-purple-80"  >
        {/* eventually this will be fetched from the OAuth session */}
        <Text className="text-white text-3xl font-inter-bold">Stephen Levitt</Text>
        <Text className="text-white text-lg font-inter-bold mb-5">ceo@studentholdings.org</Text>
        <Text className="text-white text-2xl font-inter-bold">Subscription renews on January 1, 2026</Text>
      </View>      
      <View className="flex-1 p-4">
        
        {/* Settings */}
        <View className="space-y-4">
          <TouchableOpacity className="flex-row items-center p-4">
            <Settings size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-bold ml-3">Manage Subscription</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <MessageCircleQuestionMark size={24} color={Colors.NU_PURPLE} />
            {/* linke to email our tech email */}
            <Text className="text-black text-lg font-inter-bold ml-3">Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <File size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-bold ml-3">Terms of Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4">
            <Lock size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-bold ml-3">Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-4">
            <Trash2 size={24} color={Colors.NU_PURPLE} />
            {/* modal to confirm deletion and later redirect to log in screen (setting isLoggedIn context to false) */}
            <Text className="text-black text-lg font-inter-bold ml-3">Delete Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4" onPress={() => logout()}>
            <LogOut size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-bold ml-3">Log Out</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-1 justify-end items-center">
          <Text className="text-purple-like-gray text-lg font-inter-medium">Version 1.0.0</Text>
        </View>


      </View>
    </View>

  );
}

