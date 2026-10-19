import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Heart, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useUsage } from '@/contexts/UsageContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSavedCoupons } from '@/contexts/SavedCouponsContext';
import { BRAND_CREAM, BRAND_PURPLE, BRAND_PURPLE_SOFT, CARD_SHADOW } from '@/constants/Colors';
import { logoZoomStyle } from '@/utils/couponImages';

const BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_3fQjZa|j[azf6fQfQfQIpWBj[ayj[a|fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[ayfQfQpwj[fQjEIpayfQj[a|fQjuey';

export default function CouponThumbnail({ coupon, couponTab }: { coupon: any; couponTab: "active" | "expired" }) {
    const router = useRouter();
    const { userCouponToUsages, userCouponToLastUsedAt } = useUsage();
    const { isSubscribed } = useSubscription();
    const { isSaved, toggleSaved, isSavingAvailable } = useSavedCoupons();
    const [imageFailed, setImageFailed] = useState(false);

    const handlePress = () => {
        // Simple validation
        if (!coupon || !coupon.coupon_id || !coupon.vendor || !coupon.offer) {
            console.error('Invalid coupon object:', coupon);
            return;
        }

        // expired coupons open a read-only usage receipt (when it was used /
        // when the redemption window expired) instead of the active flow
        const usedAt = couponTab === "expired" ? userCouponToLastUsedAt.get(coupon.coupon_id) : undefined;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

        // Navigate with the coupon object directly as a param
        // This avoids all the URL encoding issues
        router.push({
            pathname: '/coupon-detail',
            params: {
                coupon: JSON.stringify(coupon),
                ...(usedAt ? { usedAt } : {}),
            }
        });
    };

    const couponUses = userCouponToUsages.get(coupon.coupon_id) || 0;
    const usageLimit = coupon.usage_limit === 0 ? Infinity : coupon.usage_limit;

    const remainingUses = usageLimit - couponUses;

    // locked coupons look grayed out and still route to the detail screen
    // (usage receipt for expired, paywall for unsubscribed). Pass-locked cards
    // still show the deal so people can see what a pass gets them.
    const isExpired = couponTab === "expired";
    const isPassLocked = !isExpired && !isSubscribed;
    const isLocked = isExpired || isPassLocked;
    const saved = isSaved(coupon.coupon_id);
    const hasImage = Boolean(coupon.image_url) && !imageFailed;

    const usesLabel = isExpired
        ? 'Redeemed'
        : Number.isFinite(remainingUses)
            ? `${remainingUses} use${remainingUses === 1 ? '' : 's'} left`
            : 'Unlimited';

    const titleColor = isPassLocked ? 'text-purple-like-gray' : isLocked ? 'text-brand-purple-soft' : 'text-brand-purple';

    return (
        <View
            className={`rounded-card border ${isPassLocked ? 'border-purple-20 bg-brand-cream-soft' : 'border-brand-tan bg-white'}`}
            style={isPassLocked ? undefined : CARD_SHADOW}
        >
            <Pressable
                onPress={handlePress}
                accessibilityRole="button"
                accessibilityLabel={`${coupon.vendor}. ${coupon.offer}. ${isPassLocked ? 'Locked' : usesLabel}`}
                accessibilityHint={isExpired ? 'Shows when you used it' : isPassLocked ? 'Get a quarter pass to unlock' : 'Opens coupon details'}
                className="flex-row items-center gap-4 rounded-card p-4 active:opacity-80"
            >
                {/* logo tile; the logo fills it edge to edge, and vendors without an image get their initial on cream */}
                <View
                    className={`h-24 w-24 items-center justify-center overflow-hidden rounded-2xl ${hasImage ? 'bg-white' : 'bg-brand-cream-soft'}`}
                    style={{ opacity: isPassLocked ? 0.4 : isLocked ? 0.6 : 1 }}
                >
                    {hasImage ? (
                        <Image
                            source={{ uri: coupon.image_url }}
                            placeholder={{ blurhash: BLURHASH }}
                            transition={200}
                            contentFit="cover"
                            onError={() => setImageFailed(true)}
                            style={{ width: '100%', height: '100%', ...logoZoomStyle(coupon.vendor) }}
                        />
                    ) : (
                        <Text className="font-display-bold text-4xl text-brand-purple">{coupon.vendor?.trim()?.[0]?.toUpperCase()}</Text>
                    )}
                </View>

                <View className={`flex-1 ${isSavingAvailable ? 'pr-8' : ''}`}>
                    <Text className={`font-display text-xl leading-7 ${titleColor}`} numberOfLines={1}>
                        {coupon.vendor}
                    </Text>
                    <Text
                        className={`mt-0.5 font-body text-sm leading-5 ${isPassLocked ? 'text-purple-40' : isLocked ? 'text-brand-purple-soft' : 'text-brand-ink'}`}
                        numberOfLines={2}
                    >
                        {coupon.offer}
                    </Text>

                    <View className="mt-2 flex-row flex-wrap items-center">
                        {coupon.location ? (
                            <>
                                <Text className="font-body text-xs text-brand-purple-soft" numberOfLines={1}>{coupon.location}</Text>
                                <View className="mx-2 h-1.5 w-1.5 rounded-full bg-brand-tan" />
                            </>
                        ) : null}
                        {isPassLocked ? (
                            // the one bright element on a locked card: the way in to the paywall
                            <View className="flex-row items-center rounded-full bg-brand-purple px-2.5 py-1">
                                <Lock size={12} color={BRAND_CREAM} strokeWidth={2.5} />
                                <Text className="ml-1 font-display-medium text-xs text-brand-cream">Unlock with a pass</Text>
                            </View>
                        ) : (
                            <Text className="font-display text-xs text-brand-purple">{usesLabel}</Text>
                        )}
                    </View>
                </View>
            </Pressable>

            {isSavingAvailable ? (
                <Pressable
                    onPress={() => toggleSaved(coupon)}
                    accessibilityRole="button"
                    accessibilityLabel={saved ? `Remove ${coupon.vendor} from saved` : `Save ${coupon.vendor}`}
                    accessibilityState={{ selected: saved }}
                    hitSlop={4}
                    className="absolute right-3 top-3 h-10 w-10 items-center justify-center rounded-full border"
                    style={{ backgroundColor: 'white', borderColor: BRAND_CREAM, ...CARD_SHADOW }}
                >
                    <Heart
                        size={18}
                        color={saved ? BRAND_PURPLE : BRAND_PURPLE_SOFT}
                        fill={saved ? BRAND_PURPLE : 'transparent'}
                        strokeWidth={2.25}
                    />
                </Pressable>
            ) : null}
        </View>
    );
}
