import { TouchableOpacity, Linking, Alert } from 'react-native';
import Colors from '@/constants/Colors';
import { View, Text } from 'react-native';
import { Settings, MessageCircleQuestionMark, File, Lock, Trash2, LogOut } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

export default function MyAccount() {

  const { user, logout, deleteAccount } = useAuth();
  const { unsubscribe, subscriptionExpiration } = useSubscription();

  const handleSupport = () => {
    const email = 'purpleperks@studentholdings.org';
    const subject = 'Support Request - PurplePerks';

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
    
    Linking.canOpenURL(mailtoUrl).then(supported => {
      if (supported) {
        Linking.openURL(mailtoUrl);
      } else {
        console.log('Email app not available');
        // Fallback: copy email to clipboard or show alert
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


  return (
    <View className="flex-1 bg-white">
      <View className="py-4 px-6 bg-purple-80"  >
        {/* eventually this will be fetched from the OAuth session */}
        <Text className="text-white text-3xl font-inter-bold">{user?.user_metadata.full_name}</Text>
        <Text className="text-white text-lg font-inter-bold mb-5">{user?.email}</Text>
        <Text className="text-white text-2xl font-inter-bold">Subscription renews on {subscriptionExpiration?.toLocaleDateString()}</Text>
      </View>      
      <View className="flex-1 p-4">
        
        {/* Settings */}
        <View className="space-y-4">
          <TouchableOpacity className="flex-row items-center p-4" onPress={unsubscribe}>
            <Settings size={24} color={Colors.NU_PURPLE} />
            <Text className="text-black text-lg font-inter-bold ml-3">Manage Subscription</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4" onPress={handleSupport}>
            <MessageCircleQuestionMark size={24} color={Colors.NU_PURPLE} />
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

          <TouchableOpacity className="flex-row items-center p-4" onPress={handleDeleteAccount}>
            <Trash2 size={24} color={Colors.NU_PURPLE} />
            {/* modal to confirm deletion and later redirect to log in screen (setting isLoggedIn context to false) */}
            <Text className="text-black text-lg font-inter-bold ml-3">Delete Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center p-4" onPress={logout}>
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

