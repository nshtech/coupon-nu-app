import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    BRAND_CREAM,
    BRAND_INK,
    BRAND_LILAC_TEXT,
    BRAND_MUTED,
    BRAND_PURPLE,
    BRAND_PURPLE_MID,
    OUTLINE,
    RADIUS,
    SHADOW,
    WHITE,
} from "@/constants/Colors";
import { QUARTER_PASS_DISPLAY_DATE, QUARTER_PASS_NAME } from '@/constants/quarterPass';
import { PRODUCT_TYPE } from 'react-native-purchases';
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useAuth } from "@/contexts/AuthContext";
import { openPrivacyPolicy, openTermsOfService } from '@/utils/pdfViewer';
import Display from '@/components/ui/Display';
import Icon from '@/components/ui/Icon';
import { DarkButton, PrimaryButton, TextButton } from '@/components/ui/Button';

interface PaywallScreenProps {
    onClose?: () => void;
    // a way past the paywall without buying, e.g. "View coupons first" in the intro
    skipLabel?: string;
    onSkip?: () => void;
}

// "Fall 2026 Quarter Pass" → "Fall Quarter Pass", "December 13, 2026" → "December 13"
const PASS_BADGE = QUARTER_PASS_NAME.replace(/\s\d{4}\b/, '');
const ACCESS_THROUGH = QUARTER_PASS_DISPLAY_DATE.replace(/,\s*\d{4}$/, '');

const ONE_TIME_PRODUCT_TYPES: string[] = [
    PRODUCT_TYPE.CONSUMABLE,
    PRODUCT_TYPE.NON_CONSUMABLE,
    PRODUCT_TYPE.NON_RENEWABLE_SUBSCRIPTION,
    PRODUCT_TYPE.PREPAID_SUBSCRIPTION,
];

export default function PaywallScreen({ onClose, skipLabel, onSkip }: PaywallScreenProps) {
    const insets = useSafeAreaInsets();

    const {
        subscribe,
        restorePurchases,
        redeemOfferCode,
        canRedeemOfferCodes,
        isPurchasing,
        isRestoring,
        isRedeemingOfferCode,
        passProduct,
        isPassUnavailable,
        reloadPassProduct,
    } = useSubscription();
    const { logout } = useAuth();

    // StoreKit 1 reports UNKNOWN; show no renewal claim rather than a wrong one
    const isAutoRenewing = passProduct?.productType === PRODUCT_TYPE.AUTO_RENEWABLE_SUBSCRIPTION;
    const isOneTime = !!passProduct && ONE_TIME_PRODUCT_TYPES.includes(passProduct.productType);
    const renewalLabel = isAutoRenewing
        ? 'Renews automatically'
        : isOneTime
            ? 'No subscription'
            : null;

    // one purchase flow at a time — StoreKit queues sheets badly if they overlap
    const isBusy = isPurchasing || isRestoring || isRedeemingOfferCode;

    const footerLink = (label: string, onPress: () => void, disabled?: boolean) => (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, opacity: disabled ? 0.5 : 1 }}
        >
            {({ pressed }) => (
                <Text style={{ opacity: pressed ? 0.6 : 1, fontFamily: 'Figtree_600SemiBold', fontSize: 14, color: BRAND_MUTED }}>{label}</Text>
            )}
        </Pressable>
    );
    const dot = <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 14, color: BRAND_MUTED }}>·</Text>;

    return (
        <View style={{ flex: 1, backgroundColor: BRAND_CREAM }}>
            <StatusBar style="light" />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 16 }}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                {/* purple hero */}
                <View
                    style={{
                        backgroundColor: BRAND_PURPLE,
                        borderBottomWidth: OUTLINE,
                        borderBottomColor: BRAND_INK,
                        paddingHorizontal: 20,
                        paddingTop: insets.top + 8,
                        paddingBottom: 28,
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Pressable
                            onPress={onClose ?? logout}
                            accessibilityRole="button"
                            accessibilityLabel={onClose ? 'Close' : 'Sign out'}
                            hitSlop={4}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                borderWidth: OUTLINE,
                                borderColor: BRAND_INK,
                                backgroundColor: WHITE,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="close" size={20} />
                        </Pressable>
                        <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 15, color: BRAND_CREAM }}>{PASS_BADGE}</Text>
                    </View>

                    {/* Willie on a lighter purple circle, as on Profile */}
                    <View style={{ marginTop: 16, height: 184, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{ position: 'absolute', width: 168, height: 168, borderRadius: 84, backgroundColor: BRAND_PURPLE_MID }} />
                        <Image
                            source={require('../assets/images/willie/money-toss.png')}
                            contentFit="contain"
                            accessibilityLabel="Willie tossing dollar bills"
                            style={{ width: 160, height: 180 }}
                        />
                    </View>

                    <Display accessibilityRole="header" size={36} color={BRAND_CREAM} style={{ marginTop: 16, textAlign: 'center' }}>
                        Make Evanston a little more affordable.
                    </Display>
                    <Text style={{ marginTop: 12, paddingHorizontal: 8, textAlign: 'center', fontFamily: 'Figtree_400Regular', fontSize: 16, lineHeight: 23, color: BRAND_LILAC_TEXT }}>
                        Unlock the student deals you'll actually use all quarter long.
                    </Text>
                </View>

                <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24 }}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingHorizontal: 18,
                            paddingVertical: 18,
                            borderRadius: RADIUS.card,
                            borderWidth: OUTLINE,
                            borderColor: BRAND_INK,
                            backgroundColor: WHITE,
                        }}
                    >
                        <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 17, color: BRAND_INK }}>
                                {isOneTime ? 'One-time quarter pass' : 'Quarter pass'}
                            </Text>
                            <Text style={{ marginTop: 4, fontFamily: 'Figtree_400Regular', fontSize: 15, color: BRAND_MUTED }}>
                                Access through {ACCESS_THROUGH}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            {passProduct ? (
                                <Display size={40}>{passProduct.priceString}</Display>
                            ) : isPassUnavailable ? (
                                <Pressable
                                    onPress={() => reloadPassProduct()}
                                    style={{ minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Price unavailable. Try again"
                                >
                                    <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 14, color: BRAND_MUTED }}>Price unavailable</Text>
                                    <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 16, color: BRAND_INK, textDecorationLine: 'underline' }}>Try again</Text>
                                </Pressable>
                            ) : (
                                <ActivityIndicator color={BRAND_INK} />
                            )}
                            {renewalLabel ? (
                                <Text style={{ marginTop: 2, fontFamily: 'Figtree_500Medium', fontSize: 13, color: BRAND_MUTED }}>{renewalLabel}</Text>
                            ) : null}
                        </View>
                    </View>

                    <PrimaryButton
                        label="Get my quarter pass"
                        onPress={() => subscribe()}
                        disabled={isBusy || !passProduct}
                        style={{ marginTop: 24 }}
                    >
                        {isPurchasing ? <ActivityIndicator color={BRAND_INK} /> : undefined}
                    </PrimaryButton>
                    <Text style={{ marginTop: 10, textAlign: 'center', fontFamily: 'Figtree_500Medium', fontSize: 14, color: BRAND_MUTED }}>
                        That's less than one coffee for a full quarter of deals.
                    </Text>

                    {/* flat, so the yellow button stays the one raised action; the
                        right margin matches the primary button's shadow room */}
                    {onSkip && skipLabel ? (
                        <DarkButton label={skipLabel} onPress={onSkip} disabled={isBusy} style={{ marginTop: 16, marginRight: SHADOW }} />
                    ) : null}

                    {canRedeemOfferCodes && (
                        <View style={{ marginTop: 16, alignItems: 'center' }}>
                            {isRedeemingOfferCode ? (
                                <ActivityIndicator color={BRAND_INK} style={{ minHeight: 44 }} />
                            ) : (
                                <TextButton label="Have a promo code?" onPress={() => redeemOfferCode()} disabled={isBusy} underline />
                            )}
                        </View>
                    )}
                    {isRedeemingOfferCode && (
                        <Text style={{ marginTop: 4, paddingHorizontal: 24, textAlign: 'center', fontFamily: 'Figtree_400Regular', fontSize: 14, lineHeight: 20, color: BRAND_MUTED }}>
                            Finishing up your promo code… this can take a few seconds.
                        </Text>
                    )}

                    <View style={{ marginTop: 'auto', paddingTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                        {footerLink(isRestoring ? 'Restoring…' : 'Restore purchase', () => restorePurchases(), isBusy)}
                        {dot}
                        {footerLink('Terms', openTermsOfService)}
                        {dot}
                        {footerLink('Privacy', openPrivacyPolicy)}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
