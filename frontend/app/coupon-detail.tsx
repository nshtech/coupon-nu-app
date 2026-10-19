import { View, Text, Pressable, TouchableOpacity, Alert, Animated, StyleSheet, Easing, PanResponder, ScrollView, ActivityIndicator, AccessibilityInfo, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Check, Heart, X } from 'lucide-react-native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUsage } from '@/contexts/UsageContext';
import { useSavedCoupons } from '@/contexts/SavedCouponsContext';
import * as ScreenCapture from 'expo-screen-capture';
import * as Haptics from 'expo-haptics';
import PaywallScreen from '@/components/PaywallScreen';
import { BRAND_INK, BRAND_PURPLE, BRAND_PURPLE_SOFT } from '@/constants/Colors';
import { logoZoomStyle } from '@/utils/couponImages';
import { getPlaceTypeLabel } from '@/utils/couponFilters';

const BLURHASH = '|rF?hV%2WCj[ayj[a|j[az_3fQjZa|j[azf6fQfQfQIpWBj[ayj[a|fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[ayfQfQpwj[fQjEIpayfQj[a|fQjuey';

// how long a used coupon stays valid on screen for the cashier
const REDEMPTION_WINDOW_MS = 2 * 60 * 1000;
const OPEN_DURATION_MS = 280;
const CLOSE_DURATION_MS = 220;
const DRAG_CLOSE_DISTANCE = 120;

// Presented as a transparent modal over the tabs (see app/_layout.tsx) and
// drawn as a bottom sheet. The route and its params are unchanged: `coupon` is
// the JSON-serialized coupon row, `usedAt` opens a read-only usage receipt.
export default function CouponDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const usedAt = typeof params.usedAt === 'string' ? params.usedAt : undefined;
  const { user } = useAuth();
  const { isSubscribed, isSubscriptionLoading } = useSubscription();
  const { userCouponToUsages, setUserCouponToUsages, userCouponToLastUsedAt, setUserCouponToLastUsedAt } = useUsage();
  const { isSaved, toggleSaved, isSavingAvailable } = useSavedCoupons();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [newExpirationDate, setNewExpirationDate] = useState<string>();
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  // 0 = sheet off screen, 1 = sheet open; dragY follows the user's finger
  const progress = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const isClosing = useRef(false);

  // a used coupon is the cashier's proof, so only Done can dismiss it
  const canDismiss = !isRedeeming && !isActivated;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: reduceMotion ? 0 : OPEN_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const close = useCallback(() => {
    if (isClosing.current) return;
    isClosing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: reduceMotion ? 0 : CLOSE_DURATION_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => router.back());
  }, [progress, reduceMotion, router]);

  // the responder is created once, so it reads the latest close/canDismiss through a ref
  const closeRef = useRef(() => {});
  closeRef.current = () => {
    if (canDismiss) {
      close();
    } else {
      Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => dragY.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DRAG_CLOSE_DISTANCE || gesture.vy > 1.2) {
          closeRef.current();
        } else {
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  // navigate back after 2 min are up
  useEffect(() => {
    if (isActivated && newExpirationDate) {
      const expirationTime = new Date(newExpirationDate).getTime();
      const tick = () => setSecondsLeft(Math.max(0, Math.ceil((expirationTime - Date.now()) / 1000)));
      tick();
      const interval = setInterval(tick, 1000);

      const timeUntilExpiration = expirationTime - Date.now();
      if (timeUntilExpiration > 0) {
        const timer = setTimeout(close, timeUntilExpiration);
        return () => {
          clearTimeout(timer);
          clearInterval(interval);
        };
      } else {
        clearInterval(interval);
        close();
      }
    }
  }, [isActivated, newExpirationDate, close]);

  // // anti-screenshots
  // useEffect(() => {
  //   ScreenCapture.preventScreenCaptureAsync();
  //
  //   // this acts as a cleanup function that triggers when we unmount
  //   return () => {
  //     ScreenCapture.allowScreenCaptureAsync();
  //   };
  // }, []);

  // Parse the coupon data from the params with simple error handling
  let coupon = null;
  let parseError = null;

  try {
    if (params.coupon) {
      coupon = JSON.parse(params.coupon as string);
    } else {
      parseError = 'No coupon data provided';
    }
  } catch (error) {
    console.error('Error parsing coupon data:', error);
    console.error('Raw params:', params);

    if (error instanceof SyntaxError) {
      parseError = 'Invalid JSON format in coupon data';
    } else {
      parseError = 'Failed to load coupon data';
    }
  }

  // gate coupon usage behind the paywall — browsing the list stays free
  if (!parseError && coupon && !isSubscriptionLoading && !isSubscribed && !usedAt) {
    return (
      <View className="flex-1 bg-brand-cream-soft">
        <PaywallScreen onClose={() => router.back()} />
      </View>
    );
  }

  const formatExpirationDate = (dateString: string, displayType: "date" | "timestamp" | "time") => {
    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      if (displayType === "date") {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else if (displayType === "time") {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        });
      } else {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleUseCoupon = async () => {

    Alert.alert('Use Coupon', 'Are you sure you want to use this coupon? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Use', onPress: () => useCoupon() }
    ]);
  };

  const useCoupon = async () => {
    if (!user) {
      console.error('User not found');
      return;
    }

    setIsRedeeming(true);
    const usedAtNow = new Date().toISOString();

    const { error } = await supabase
    .from('coupon_usages')
    .insert({
      user_id: user?.id,
      coupon_id: coupon.coupon_id,
      used_at: usedAtNow,
    });

    setIsRedeeming(false);

    if (error) {
      console.error('Error using coupon:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Alert.alert(
        "Couldn't use this coupon",
        'Nothing was redeemed. Check your connection and that your pass is active, then try again.'
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setIsActivated(true);
      setNewExpirationDate(new Date(Date.now() + REDEMPTION_WINDOW_MS).toISOString());

      const newUserCouponToUsages = new Map(userCouponToUsages);
      newUserCouponToUsages.set(coupon.coupon_id, (newUserCouponToUsages.get(coupon.coupon_id) || 0) + 1);
      setUserCouponToUsages(newUserCouponToUsages);

      const newUserCouponToLastUsedAt = new Map(userCouponToLastUsedAt);
      newUserCouponToLastUsedAt.set(coupon.coupon_id, usedAtNow);
      setUserCouponToLastUsedAt(newUserCouponToLastUsedAt);

      AccessibilityInfo.announceForAccessibility(`You're all set. ${coupon.vendor} coupon redeemed. Show this screen to the cashier.`);
    }
  }

  const sheetTranslateY = Animated.add(
    progress.interpolate({ inputRange: [0, 1], outputRange: [windowHeight, 0] }),
    dragY
  );

  const renderContent = () => {
    if (parseError || !coupon) {
      return (
        <View className="items-center py-6">
          <Text className="mb-6 text-center font-display text-2xl text-brand-purple">
            {parseError || 'Coupon not found'}
          </Text>
          <PrimaryButton label="Go Back" onPress={close} />
        </View>
      );
    }

    if (isSubscriptionLoading) {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={BRAND_PURPLE_SOFT} />
          <Text className="mt-3 font-display text-lg text-brand-purple-soft">Loading...</Text>
        </View>
      );
    }

    if (isActivated) {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = String(secondsLeft % 60).padStart(2, '0');
      return (
        <View className="items-center pt-2" accessibilityLiveRegion="polite">
          <View className="h-28 w-28 items-center justify-center rounded-full border border-brand-tan bg-brand-cream">
            <Check size={52} color={BRAND_PURPLE} strokeWidth={2.5} />
          </View>
          <Text accessibilityRole="header" className="mt-5 font-display text-3xl text-brand-purple">You're all set!</Text>
          <Text className="mt-1 text-center font-body text-base text-brand-ink">
            Show this screen to the cashier at {coupon.vendor}.
          </Text>

          <View className="mt-5 w-full rounded-2xl border border-brand-tan bg-white px-4 py-4">
            <Text className="text-center font-display text-lg text-brand-purple">{coupon.offer}</Text>
            <View className="mt-3 flex-row justify-between border-t border-brand-cream pt-3">
              <Text className="font-body-medium text-sm text-brand-purple-soft">Redeemed at</Text>
              <Text className="font-body-medium text-sm text-brand-ink">
                {formatExpirationDate(userCouponToLastUsedAt.get(coupon.coupon_id) || '', "time")}
              </Text>
            </View>
            <View className="mt-2 flex-row justify-between">
              <Text className="font-body-medium text-sm text-brand-purple-soft">Valid for</Text>
              <Text className="font-display text-base text-brand-purple" accessibilityLabel={`${minutes} minutes ${secondsLeft % 60} seconds`}>
                {minutes}:{seconds}
              </Text>
            </View>
          </View>

          <PrimaryButton label="Done" onPress={close} className="mt-6" />
        </View>
      );
    }

    const couponUses = userCouponToUsages.get(coupon.coupon_id) || 0;
    const usesLabel = coupon.usage_limit === 0
      ? 'Unlimited uses'
      : `${Math.max(0, coupon.usage_limit - couponUses)} of ${coupon.usage_limit} use${coupon.usage_limit === 1 ? '' : 's'} left`;

    return (
      <>
        <View className="flex-row items-center pr-24">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-brand-tan bg-brand-cream">
            {coupon.image_url && !imageFailed ? (
              <Image
                source={{ uri: coupon.image_url }}
                placeholder={{ blurhash: BLURHASH }}
                transition={200}
                contentFit="cover"
                onError={() => setImageFailed(true)}
                style={{ width: '100%', height: '100%', ...logoZoomStyle(coupon.vendor) }}
              />
            ) : (
              <Ionicons name="pricetag-outline" size={30} color={BRAND_PURPLE_SOFT} />
            )}
          </View>
          <View className="ml-4 flex-1">
            {getPlaceTypeLabel(coupon) ? (
              <Text className="font-display-medium text-xs uppercase tracking-widest text-brand-purple-soft">{getPlaceTypeLabel(coupon)}</Text>
            ) : null}
            <Text accessibilityRole="header" className="font-display text-2xl leading-8 text-brand-purple">{coupon.vendor}</Text>
            {coupon.location ? (
              <Text className="font-body text-sm text-brand-purple-soft">{coupon.location}</Text>
            ) : null}
          </View>
        </View>

        <Text className="mt-5 font-body text-lg leading-7 text-brand-ink">{coupon.offer}</Text>

        <View className="mt-5 rounded-2xl border border-brand-tan bg-white px-4 py-1">
          {usedAt ? (
            <>
              <DetailRow label="Used on" value={formatExpirationDate(usedAt, "timestamp")} />
              <DetailRow
                label="Expired on"
                value={formatExpirationDate(new Date(new Date(usedAt).getTime() + REDEMPTION_WINDOW_MS).toISOString(), "timestamp")}
                divider
              />
            </>
          ) : (
            <>
              <DetailRow label="Expires" value={formatExpirationDate(coupon.expiration_date, "date")} />
              <DetailRow label="Uses" value={usesLabel} divider />
            </>
          )}
        </View>

        {usedAt ? (
          <View className="mt-6 min-h-14 w-full justify-center rounded-full bg-brand-cream">
            <Text className="text-center font-display text-xl text-brand-purple">Redeemed!</Text>
          </View>
        ) : (
          <>
            <PrimaryButton
              label={isRedeeming ? 'Using coupon...' : 'Use this coupon'}
              onPress={handleUseCoupon}
              disabled={isRedeeming}
              loading={isRedeeming}
              className="mt-6"
            />
            <Text className="mt-3 text-center font-body-bold text-sm leading-5 text-brand-purple-soft">
              {/* non-breaking space keeps "2 minutes" together on one line */}
              Only tap this at the register. Once used, the coupon stays valid for 2{'\u00A0'}minutes — show it to the cashier.
            </Text>
          </>
        )}
      </>
    );
  };

  return (
    <View className="flex-1 justify-end">
      {/* dimmed page behind the sheet */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: `${BRAND_INK}80`, opacity: progress }]}>
        <Pressable
          className="flex-1"
          onPress={canDismiss ? close : undefined}
          accessibilityRole="button"
          accessibilityLabel="Close coupon"
          importantForAccessibility="no"
          accessibilityElementsHidden
        />
      </Animated.View>

      <Animated.View
        accessibilityViewIsModal
        onAccessibilityEscape={canDismiss ? close : undefined}
        style={{ transform: [{ translateY: sheetTranslateY }] }}
      >
        <View
          className="rounded-t-sheet border-t border-brand-tan bg-brand-cream-soft"
          style={{ maxHeight: windowHeight * 0.92 }}
        >
          {/* drag handle — swipe down to dismiss */}
          <View {...panResponder.panHandlers} className="items-center pb-2 pt-3">
            <View className="h-1.5 w-11 rounded-full bg-brand-tan" />
          </View>

          {canDismiss ? (
            <TouchableOpacity
              onPress={close}
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="absolute right-4 top-4 z-10 h-11 w-11 items-center justify-center rounded-full bg-brand-cream"
            >
              <X size={20} color={BRAND_PURPLE} />
            </TouchableOpacity>
          ) : null}

          {canDismiss && coupon && isSavingAvailable ? (
            <TouchableOpacity
              onPress={() => toggleSaved(coupon)}
              accessibilityRole="button"
              accessibilityLabel={isSaved(coupon.coupon_id) ? `Remove ${coupon.vendor} from saved` : `Save ${coupon.vendor}`}
              accessibilityState={{ selected: isSaved(coupon.coupon_id) }}
              className="absolute right-[68px] top-4 z-10 h-11 w-11 items-center justify-center rounded-full bg-brand-cream"
            >
              <Heart
                size={20}
                color={BRAND_PURPLE}
                fill={isSaved(coupon.coupon_id) ? BRAND_PURPLE : 'transparent'}
              />
            </TouchableOpacity>
          ) : null}

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: insets.bottom + 20 }}
          >
            {renderContent()}
          </ScrollView>
        </View>
      </Animated.View>
    </View>
  );
}

function DetailRow({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <View className={`flex-row items-center justify-between py-3 ${divider ? 'border-t border-brand-cream' : ''}`}>
      <Text className="font-body-medium text-sm text-brand-purple-soft">{label}</Text>
      <Text className="ml-4 flex-1 text-right font-body-medium text-sm text-brand-ink">{value}</Text>
    </View>
  );
}

function PrimaryButton({ label, onPress, disabled, loading, className = '' }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled), busy: Boolean(loading) }}
      className={`min-h-14 w-full flex-row items-center justify-center rounded-full bg-brand-purple ${disabled ? 'opacity-70' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} /> : null}
      <Text className="font-display text-xl text-brand-cream">{label}</Text>
    </TouchableOpacity>
  );
}
