import { Text, View } from "react-native";
import { GraduationCap, X } from 'lucide-react-native';
import { BRAND_PURPLE, BRAND_PURPLE_SOFT } from "@/constants/Colors";
import { TouchableOpacity } from "react-native";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { openPrivacyPolicy, openTermsOfService } from '@/utils/pdfViewer';

interface PaywallScreenProps {
    onClose?: () => void;
}

const PERKS = [
    { emoji: '✅', text: 'Quick and easy coupon redemption' },
    { emoji: '💸', text: 'An estimated $300 in savings per quarter' },
    { emoji: '🙏', text: 'Support our network of local businesses' },
];

export default function PaywallScreen({ onClose }: PaywallScreenProps) {

    const { subscribe, restorePurchases } = useSubscription();
    const { logout } = useAuth();

    return (
        <View className="flex-1 bg-brand-cream-soft">
            <TouchableOpacity
                className="absolute left-6 top-16 z-10 h-9 w-9 items-center justify-center rounded-full bg-brand-cream"
                onPress={onClose ?? logout}
            >
                <X size={20} color={BRAND_PURPLE_SOFT} />
            </TouchableOpacity>

            <View className="mb-6 mt-24 items-center px-6">
                <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-cream">
                    <GraduationCap size={64} color={BRAND_PURPLE} strokeWidth={1.5} />
                </View>
                <Text className="mt-5 text-center font-display text-3xl leading-tight text-brand-purple">
                    Unlock Exclusive{'\n'}Student Deals
                </Text>
                <Text className="mt-3 px-4 text-center font-body text-base leading-snug text-brand-ink">
                    Save money at the Evanston spots{'\n'}you already know and love!
                </Text>
            </View>

            <View className="flex-1 justify-center px-6">
                <View className="gap-3">
                    {PERKS.map((perk) => (
                        <View
                            key={perk.text}
                            className="flex-row items-center rounded-card border border-brand-tan bg-white px-4 py-4"
                        >
                            <Text className="mr-4 text-3xl">{perk.emoji}</Text>
                            <Text className="flex-1 font-body-medium text-base leading-snug text-brand-ink">
                                {perk.text}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            <View className="items-center px-6 pb-4">
                <Text className="mb-4 text-center font-body-medium text-base text-brand-purple-soft">
                    $4.99 for access throughout the rest of the quarter!
                </Text>
                <TouchableOpacity
                    className="mb-4 w-full max-w-xs rounded-full bg-brand-purple px-12 py-4 active:opacity-80"
                    onPress={() => subscribe()}
                >
                    <Text className="text-center font-display text-xl text-brand-cream">
                        Continue
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => restorePurchases()}>
                    <Text className="text-center font-body-medium text-base text-brand-purple-soft">
                        Restore Purchases
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="mb-8 flex-row items-center justify-center gap-8">
                <TouchableOpacity onPress={openTermsOfService}>
                    <Text className="text-center font-body text-sm text-brand-purple-soft">
                        Terms of Service
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={openPrivacyPolicy}>
                    <Text className="text-center font-body text-sm text-brand-purple-soft">
                        Privacy Policy
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
