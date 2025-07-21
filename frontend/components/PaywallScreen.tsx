import { Button, Text, View } from "react-native";
import { GraduationCap } from 'lucide-react-native';
import Colors from "@/constants/Colors";
import { TouchableOpacity } from "react-native";
import { useSubscription } from "@/contexts/SubscriptionContext";



export default function PaywallScreen() {

    const { subscribe } = useSubscription();
    return (
        <View className="flex-1 bg-white">

            {/* top section */}
            <View className="flex-col items-center justify-center gap-4 mt-10 py-10">
                <GraduationCap size={100} color={Colors.PURPLE_80} strokeWidth={1.5} />
                    <Text className="text-5xl text-black font-inter-bold text-center leading-tight">
                        Unlock Exclusive{'\n'}Student Deals
                    </Text>

                    <Text className="text-dark-gray text-2xl font-inter-medium text-center leading-tight">
                        Save money at the Evanston spots{'\n'}you already know and love!
                    </Text>
            </View>
            
            {/* middle section */}
            <View className="flex-1 items-center justify-center p-4 mb-10">
                <View className="flex-col items-center justify-center gap-1 max-w-xs">

                    <View className="flex-row items-center p-4 justify-center">
                        <Text className="text-4xl">✅</Text>
                        <Text className="text-black text-3xl font-inter-bold ml-5 text-left">Quick and easy coupon redemption</Text>
                    </View>
                    
                    <View className="flex-row items-center p-4 justify-center">
                        <Text className="text-4xl">💸</Text>
                        <Text className="text-black text-3xl font-inter-bold ml-5 text-left">An estimated $300 in savings per quarter</Text>
                    </View>
                    
                    <View className="flex-row items-center p-4 justify-center">
                        <Text className="text-4xl">🙏</Text>
                        <Text className="text-black text-3xl font-inter-bold ml-5 text-left">Support our network of local businesses</Text>
                    </View>

                </View>

            </View>




            <View className="flex-col items-center justify-center p-4 gap-4">
                <Text className="text-dark-gray text-xl font-inter-medium text-center">$19.99/quarter, cancel anytime </Text>

                <TouchableOpacity className="bg-purple-80 px-8 py-4 rounded-lg" onPress={() => subscribe()}>
                    <Text className="text-white text-xl font-inter-semibold text-center">
                        Continue with Apple
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text className="text-dark-gray text-xl font-inter-medium text-center">Restore Purchases</Text>
                </TouchableOpacity>
            </View>

            <View className="mb-16 flex-row items-center justify-center gap-14">
                <TouchableOpacity>
                    <Text className="text-dark-gray text-lg font-inter-medium text-center">Terms of Service</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                    <Text className="text-dark-gray text-lg font-inter-medium text-center">Privacy Policy</Text>
                </TouchableOpacity>
            </View>
            
        </View>
    );
}