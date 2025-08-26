import { Button, Text, View } from "react-native";
import { GraduationCap, X } from 'lucide-react-native';
import Colors, { DARK_GRAY } from "@/constants/Colors";
import { TouchableOpacity } from "react-native";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { openPrivacyPolicy, openTermsOfService } from '@/utils/pdfViewer';


export default function PaywallScreen() {

    const { subscribe, getSubscription } = useSubscription();
    const { logout } = useAuth();

    return (
        <View className="flex-1 bg-white px-6">
            <TouchableOpacity 
                className="absolute top-16 left-6 z-10" 
                onPress={logout}
            >
                <X size={24} color={DARK_GRAY} />
            </TouchableOpacity>


            <View className="flex-col items-center justify-center mt-20 mb-8">
                <GraduationCap size={100} color={Colors.PURPLE_80} strokeWidth={1.5} />
                <Text className="text-4xl text-black font-inter-bold text-center leading-tight mt-4">
                    Unlock Exclusive{'\n'}Student Deals
                </Text>
                <Text className="text-xl text-dark-gray font-inter-medium text-center leading-tight mt-4 px-4">
                    Save money at the Evanston spots{'\n'}you already know and love!
                </Text>
            </View>
            

            <View className="flex-1 justify-center py-8 mb-8 px-8">
                <View className="max-w-sm">
                    <View className="flex-row items-start mb-12">
                        <Text className="text-4xl mr-4 mt-1">✅</Text>
                        <Text className="text-xl text-black font-inter-bold flex-1 leading-tight">
                            Quick and easy coupon redemption
                        </Text>
                    </View>
                    
                    <View className="flex-row items-start mb-12">
                        <Text className="text-4xl mr-4 mt-1">💸</Text>
                        <Text className="text-xl text-black font-inter-bold flex-1 leading-tight">
                            An estimated $300 in savings per quarter
                        </Text>
                    </View>
                    
                    <View className="flex-row items-start">
                        <Text className="text-4xl mr-4 mt-1">🙏</Text>
                        <Text className="text-xl text-black font-inter-bold flex-1 leading-tight">
                            Support our network of local businesses
                        </Text>
                    </View>
                </View>
            </View>




            <View className="items-center mb-8">
                <Text className="text-2xl text-dark-gray font-inter-medium text-center mb-6">
                    $9.99/quarter
                </Text>

                <TouchableOpacity 
                    className="bg-purple-80 px-12 py-4 rounded-lg mb-4 w-full max-w-xs" 
                    onPress={() => subscribe()}
                >
                    <Text className="text-white text-xl font-inter-semibold text-center">
                        Continue
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => getSubscription()}>
                    <Text className="text-dark-gray text-lg font-inter-medium text-center">
                        Restore Purchases
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-center gap-8 mb-8">
                <TouchableOpacity onPress={openTermsOfService}>
                    <Text className="text-dark-gray text-base font-inter-medium text-center">
                        Terms of Service
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={openPrivacyPolicy}>
                    <Text className="text-dark-gray text-base font-inter-medium text-center">
                        Privacy Policy
                    </Text>
                </TouchableOpacity>
            </View>
            
        </View>
    );
}
