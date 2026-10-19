import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { BRAND_CREAM, BRAND_PURPLE, CARD_SHADOW } from "@/constants/Colors";
import { QUARTER_PASS_DISPLAY_DATE, QUARTER_PASS_NAME } from '@/constants/quarterPass';
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { openPrivacyPolicy, openTermsOfService } from '@/utils/pdfViewer';
import TactileButton from '@/components/TactileButton';

interface PaywallScreenProps {
    onClose?: () => void;
}

const PERKS = ['Local favorites', 'Easy redemption', 'New discoveries'];

// "Fall 2026 Quarter Pass" → "Fall Quarter Pass", "December 13, 2026" → "December 13"
const PASS_BADGE = QUARTER_PASS_NAME.replace(/\s\d{4}\b/, '');
const ACCESS_THROUGH = QUARTER_PASS_DISPLAY_DATE.replace(/,\s*\d{4}$/, '');

export default function PaywallScreen({ onClose }: PaywallScreenProps) {
    const insets = useSafeAreaInsets();

    const {
        subscribe,
        restorePurchases,
        redeemOfferCode,
        canRedeemOfferCodes,
        isPurchasing,
        isRestoring,
        isRedeemingOfferCode,
    } = useSubscription();
    const { logout } = useAuth();

    // one purchase flow at a time — StoreKit queues sheets badly if they overlap
    const isBusy = isPurchasing || isRestoring || isRedeemingOfferCode;

    return (
        <View className="flex-1 bg-brand-cream-soft">
            <StatusBar style="light" />
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* purple hero */}
                <View
                    className="overflow-hidden rounded-b-[40px] bg-brand-purple px-6 pb-9"
                    style={{ paddingTop: insets.top + 8 }}
                >
                    {/* decorative rings */}
                    <View pointerEvents="none" className="absolute -right-24 -top-10 h-72 w-72 rounded-full border-[28px] border-white/5" />
                    <View pointerEvents="none" className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full border-[28px] border-white/5" />

                    <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                            className="h-11 w-11 items-center justify-center rounded-full bg-white/15"
                            onPress={onClose ?? logout}
                            accessibilityRole="button"
                            accessibilityLabel={onClose ? 'Close' : 'Sign out'}
                        >
                            <X size={18} color={BRAND_CREAM} strokeWidth={2.5} />
                        </TouchableOpacity>
                        <View className="rounded-full bg-brand-cream px-4 py-2">
                            <Text className="font-display text-xs uppercase tracking-widest text-brand-purple">
                                {PASS_BADGE}
                            </Text>
                        </View>
                    </View>

                    <View className="mt-2 h-48 items-center justify-center">
                        <View className="absolute h-44 w-44 rounded-full bg-white/5" />
                        <Image
                            source={require('../assets/images/willie/make-it-rain.png')}
                            contentFit="contain"
                            accessibilityLabel="Willie tossing dollar bills"
                            style={{ width: 176, height: 176 }}
                        />
                        <View
                            className="absolute right-0 top-0 items-center rounded-2xl bg-white px-4 py-3"
                            style={[CARD_SHADOW, { transform: [{ rotate: '4deg' }] }]}
                        >
                            <Text className="font-display text-[10px] uppercase tracking-widest text-brand-purple-soft">
                                Potential savings
                            </Text>
                            <Text className="font-display-bold text-2xl text-brand-purple">$300+</Text>
                        </View>
                    </View>

                    <Text accessibilityRole="header" className="mt-4 text-center font-display-bold text-[32px] leading-10 text-white">
                        Make Evanston{'\n'}
                        <Text className="text-brand-cream">a little more affordable.</Text>
                    </Text>
                    <Text className="mt-3 px-2 text-center font-body text-base leading-6 text-white/75">
                        Unlock the student deals you'll actually use—all quarter long.
                    </Text>
                </View>

                <View className="flex-1 px-6 pt-6">
                    <View className="flex-row gap-3">
                        {PERKS.map((perk) => (
                            <View
                                key={perk}
                                className="flex-1 items-center rounded-card border border-brand-tan/50 bg-white px-2 py-4"
                            >
                                <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-cream">
                                    <Check size={16} color={BRAND_PURPLE} strokeWidth={3} />
                                </View>
                                <Text className="mt-2.5 text-center font-display-medium text-[13px] leading-4 text-brand-ink">
                                    {perk}
                                </Text>
                            </View>
                        ))}
                    </View>

                    <View className="mt-4 flex-row items-center rounded-card border border-brand-tan bg-white px-5 py-5">
                        <View className="flex-1 pr-3">
                            <Text className="font-display text-xs uppercase tracking-widest text-brand-purple-soft">
                                One-time quarter pass
                            </Text>
                            <Text className="mt-1.5 font-body text-base text-brand-ink">
                                Access through {ACCESS_THROUGH}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="font-display-bold text-4xl leading-[44px] text-brand-purple">$4.99</Text>
                            <Text className="font-body text-xs text-brand-purple-soft">No subscription</Text>
                        </View>
                    </View>

                    <TactileButton
                        label="Get my quarter pass"
                        onPress={() => subscribe()}
                        disabled={isBusy}
                        className="mt-6"
                    >
                        {isPurchasing ? <ActivityIndicator color={BRAND_CREAM} /> : undefined}
                    </TactileButton>
                    <Text className="mt-3 text-center font-body text-sm text-brand-purple-soft">
                        That's less than one coffee for a full quarter of deals.
                    </Text>

                    {canRedeemOfferCodes && (
                        <TouchableOpacity
                            className="mt-5 min-h-11 items-center justify-center"
                            onPress={() => redeemOfferCode()}
                            disabled={isBusy}
                            accessibilityRole="button"
                        >
                            {isRedeemingOfferCode ? (
                                <ActivityIndicator color={BRAND_PURPLE} />
                            ) : (
                                <Text className={`font-display-medium text-lg text-brand-purple ${isBusy ? 'opacity-60' : ''}`}>
                                    Have a promo code?
                                </Text>
                            )}
                        </TouchableOpacity>
                    )}
                    {isRedeemingOfferCode && (
                        <Text className="mt-1 px-6 text-center font-body text-sm leading-snug text-brand-purple-soft">
                            Finishing up your promo code… this can take a few seconds.
                        </Text>
                    )}

                    <View className="mt-auto flex-row items-center justify-center pt-5">
                        <TouchableOpacity onPress={() => restorePurchases()} disabled={isBusy} className="min-h-11 justify-center px-2">
                            <Text className={`font-body text-sm text-brand-purple-soft ${isBusy ? 'opacity-60' : ''}`}>
                                {isRestoring ? 'Restoring…' : 'Restore purchase'}
                            </Text>
                        </TouchableOpacity>
                        <View className="mx-2 h-1 w-1 rounded-full bg-purple-20" />
                        <TouchableOpacity onPress={openTermsOfService} className="min-h-11 justify-center px-2">
                            <Text className="font-body text-sm text-brand-purple-soft">Terms</Text>
                        </TouchableOpacity>
                        <View className="mx-2 h-1 w-1 rounded-full bg-purple-20" />
                        <TouchableOpacity onPress={openPrivacyPolicy} className="min-h-11 justify-center px-2">
                            <Text className="font-body text-sm text-brand-purple-soft">Privacy</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
