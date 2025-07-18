import { Button, Text, View } from "react-native";

type PaywallScreenProps = {
    setIsSubscribed: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PaywallScreen({ setIsSubscribed }: PaywallScreenProps) {
    return (
        <View className="flex-1 items-center justify-center bg-white">
            <Text className="text-2xl text-black font-inter-medium"></Text>
            <Button 
                title="Continue with Apple" 
                onPress={() => setIsSubscribed(true)} 
            />
        </View>
    );
}