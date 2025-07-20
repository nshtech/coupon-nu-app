import { Button, TouchableOpacity, View, Text, Pressable } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';


type LogInScreenProps = {
    setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function LogInScreen() {

    const { login } = useAuth();

    return (
        <View className="flex-1 bg-white ">

            <View className="items-center py-10 mt-20 justify-center">
                <Text className="text-black text-5xl font-inter-bold">Coupon NU</Text>
            </View>

            <View className="items-center justify-center gap-5 mt-60">

                <TouchableOpacity className="bg-purple-80 px-16 py-2 rounded-lg" onPress={() => login()}>
                    <Text className="text-white text-2xl">Sign in with Google</Text>
                </TouchableOpacity>

                <View>
                    <Text className="px-10 text-center text-dark-gray font-inter-medium">

                        By clicking continue, you agree to our{' '}
                        <Text 
                            className="font-inter-bold text-black" 
                            onPress={() => {}}
                        >
                            Terms of Service
                        </Text>

                        {' '}and{' '}

                        <Text 
                            className="font-inter-bold text-black" 
                            onPress={() => {}}
                        >
                            Privacy Policy
                        </Text>

                    </Text>
                </View>

            </View>

        </View>
    );
}