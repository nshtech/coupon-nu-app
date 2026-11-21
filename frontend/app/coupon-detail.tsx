import { View, Text, Pressable, Alert, Animated, StyleSheet, Easing, PanResponder, ScrollView, ActivityIndicator, AccessibilityInfo, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePreventRemove } from '@react-navigation/native';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useUsage } from '@/contexts/UsageContext';
import { useSavedCoupons } from '@/contexts/SavedCouponsContext';
import { useCoupons } from '@/contexts/CouponsContext';
import * as ScreenCapture from 'expo-screen-capture';
import * as Haptics from 'expo-haptics';
import PaywallScreen from '@/components/PaywallScreen';
import Display from '@/components/ui/Display';
import HeartButton from '@/components/ui/HeartButton';
import Icon from '@/components/ui/Icon';
import LogoBadge from '@/components/ui/LogoBadge';
import { Raised } from '@/components/ui/Raised';
import { Ticket, TicketRow, TicketTear } from '@/components/ui/Ticket';
import { DarkButton, PrimaryButton } from '@/components/ui/Button';
import {
  BRAND_CREAM,
  BRAND_GREEN,
  BRAND_INK,
  BRAND_LILAC,
  BRAND_MUTED,
  OUTLINE,
  RADIUS,
  SHADOW_SM,
  WHITE,
} from '@/constants/Colors';
import { couponPhoto } from '@/utils/couponImages';
import { dealCopy } from '@/utils/dealCopy';
import { getPlaceTypeLabel } from '@/utils/couponFilters';


// how long a used coupon stays valid on screen for the cashier
const REDEMPTION_WINDOW_MS = 2 * 60 * 1000;
// unlimited coupons can be redeemed once per this long; must match COOLDOWN in
// guard_coupon_usage() (backend/sql/005_lock_down_access.sql)
const UNLIMITED_COOLDOWN_LABEL = '1 hour';
const OPEN_DURATION_MS = 280;
const CLOSE_DURATION_MS = 220;
const DRAG_CLOSE_DISTANCE = 120;
const PHOTO_HEIGHT = 172;
// ink at 60%
const SCRIM = 'rgba(34, 16, 61, 0.6)';

// Presented as a transparent modal over the tabs (see app/_layout.tsx) and
// drawn as a bottom sheet. Params: `couponId`, and `usedAt` to open a read-only
// usage receipt.
export default function CouponDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { allCoupons, isLoading: isCouponsLoading } = useCoupons();
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
  // 1 = full redemption window left, 0 = expired; drives the bar under the countdown
  const drain = useRef(new Animated.Value(1)).current;

  // a used coupon is the cashier's proof, so only Done can dismiss it
  const canDismiss = !isRedeeming && !isActivated;

  // also blocks Android's hardware back and iOS's native dismiss (native-stack reads
  // usePreventRemove, not beforeRemove listeners). close() lifts it once its animation
  // ends, and navigates only after that render so the guard is already off.
  const [hasClosed, setHasClosed] = useState<boolean>(false);
  usePreventRemove(!canDismiss && !hasClosed, () => {});

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
    }).start(() => setHasClosed(true));
  }, [progress, reduceMotion]);

  useEffect(() => {
    if (hasClosed) router.back();
  }, [hasClosed]);

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

  // the bar drains in step with the countdown
  useEffect(() => {
    if (!isActivated || !newExpirationDate) return;
    const remaining = Math.max(0, new Date(newExpirationDate).getTime() - Date.now());
    drain.setValue(remaining / REDEMPTION_WINDOW_MS);
    const animation = Animated.timing(drain, { toValue: 0, duration: remaining, easing: Easing.linear, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [isActivated, newExpirationDate, drain]);

  // // anti-screenshots
  // useEffect(() => {
  //   ScreenCapture.preventScreenCaptureAsync();
  //
  //   // this acts as a cleanup function that triggers when we unmount
  //   return () => {
  //     ScreenCapture.allowScreenCaptureAsync();
  //   };
  // }, []);

  // The route carries only the coupon's id; the coupon itself comes from the list
  // loaded from Supabase. Never render a coupon taken from route params: any
  // willieswallet:// link can set them, and could put a made-up vendor and offer
  // on a genuine "You're all set!" screen.
  const couponIdParam = typeof params.couponId === 'string' ? params.couponId : undefined;
  const coupon: any = couponIdParam
    ? allCoupons.find(item => String(item.coupon_id) === couponIdParam) ?? null
    : null;
  const isCouponLoading = !coupon && !!couponIdParam && isCouponsLoading;
  const parseError = coupon || isCouponLoading ? null : couponIdParam ? 'Coupon not found' : 'No coupon data provided';
  // a receipt only for a redemption this account actually made
  const usedAt =
    coupon && typeof params.usedAt === 'string' && params.usedAt === userCouponToLastUsedAt.get(coupon.coupon_id)
      ? params.usedAt
      : undefined;

  // gate coupon usage behind the paywall — browsing the list stays free
  if (!parseError && coupon && !isSubscriptionLoading && !isSubscribed && !usedAt) {
    return (
      <View style={{ flex: 1, backgroundColor: BRAND_CREAM }}>
        <PaywallScreen onClose={() => router.back()} />
      </View>
    );
  }

  const formatExpirationDate = (dateString: string, displayType: "date" | "timestamp" | "redeemed") => {
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
      } else if (displayType === "redeemed") {
        // day and time to the minute, e.g. "Nov 10, 12:09 PM" (formatted in two
        // parts because Hermes joins a combined date and time with "at")
        const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return `${day}, ${time}`;
      } else {
        return date.toLocaleString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  // maps the codes raised by guard_coupon_usage() (005_lock_down_access.sql) to copy
  const redemptionErrorCopy = (code: string, details: string | null, sqlState: string): [string, string] => {
    switch (code) {
      case 'usage_limit_reached':
        return ['No uses left', "You've already used this coupon as many times as it allows."];
      case 'coupon_cooldown': {
        const minutes = Number(details) || 0;
        const hours = Math.floor(minutes / 60);
        const wait = hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
        return ['Used recently', `You can use this coupon again in ${wait}.`];
      }
      case 'daily_limit_reached':
        return ['Daily limit reached', "You've redeemed the most deals allowed in a day. Try again tomorrow."];
      case 'coupon_expired':
        return ['Coupon expired', 'This deal is no longer available.'];
      case 'coupon_not_found':
        return ['Coupon unavailable', 'This deal was removed.'];
    }
    // RLS refusal: no active pass (006_require_pass_for_usage.sql)
    if (sqlState === '42501') {
      // reopening the app re-checks RevenueCat, which re-syncs a pass bought on an older app version
      return ['Pass not active', "Your quarter pass isn't active. If you bought one, close and reopen the app, then try again."];
    }
    return ["Couldn't use this coupon", 'Nothing was redeemed. Check your connection and that your pass is active, then try again.'];
  };

  const handleUseCoupon = async () => {

    const message = coupon.usage_limit === 0
      ? `Only use this at the register. After you use it, you'll have to wait ${UNLIMITED_COOLDOWN_LABEL} before you can use it again.`
      : 'Are you sure you want to use this coupon? This action cannot be undone.';

    Alert.alert('Use Coupon', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Use', onPress: () => useCoupon() }
    ]);
  };

  const useCoupon = async () => {
    if (!user) {
      console.error('User not found');
      return;
    }

    if (coupon.usage_limit > 0 && (userCouponToUsages.get(coupon.coupon_id) || 0) >= coupon.usage_limit) {
      Alert.alert('No uses left', "You've already used this coupon as many times as it allows.");
      return;
    }

    setIsRedeeming(true);

    // the database sets used_at and enforces the redemption rules (005_lock_down_access.sql)
    const { data, error } = await supabase
    .from('coupon_usages')
    .insert({
      user_id: user?.id,
      coupon_id: coupon.coupon_id,
    })
    .select('used_at')
    .single();

    setIsRedeeming(false);

    if (error) {
      console.error('Error using coupon:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      const [title, message] = redemptionErrorCopy(error.message, error.details, error.code);
      Alert.alert(title, message);
    } else {
      const usedAtNow = data?.used_at ?? new Date().toISOString();
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

  const copy = coupon ? dealCopy(coupon) : null;
  const photo = coupon ? couponPhoto(coupon) : null;
  const placeType = coupon ? getPlaceTypeLabel(coupon) : null;
  // the deal sheet and the usage receipt open on the photo; the redeemed state does not
  const showPhoto = !parseError && !!coupon && !isSubscriptionLoading && !isActivated;

  const renderPhoto = () => (
    // tall enough for the logo badge hanging 26pt below the photo
    <View style={{ height: PHOTO_HEIGHT + 26 }}>
      <View
        style={{
          height: PHOTO_HEIGHT,
          borderRadius: 20,
          borderWidth: OUTLINE,
          borderColor: BRAND_INK,
          backgroundColor: BRAND_LILAC,
          overflow: 'hidden',
        }}
      >
        {photo && !imageFailed ? (
          <Image
            source={photo}
            contentFit="cover"
            transition={150}
            onError={() => setImageFailed(true)}
            style={{ flex: 1 }}
            accessible={false}
          />
        ) : null}
      </View>
      <LogoBadge coupon={coupon} size={64} radius={16} padding={6} style={{ position: 'absolute', left: 14, top: PHOTO_HEIGHT - 38 }} />
      {canDismiss && isSavingAvailable ? (
        <HeartButton
          saved={isSaved(coupon.coupon_id)}
          vendor={coupon.vendor}
          onPress={() => toggleSaved(coupon)}
          style={{ position: 'absolute', top: 10, right: 10 }}
        />
      ) : null}
    </View>
  );

  const renderContent = () => {
    if (isCouponLoading) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={BRAND_INK} />
          <Text style={{ marginTop: 12, fontFamily: 'Figtree_700Bold', fontSize: 17, color: BRAND_MUTED }}>Loading...</Text>
        </View>
      );
    }

    if (parseError || !coupon) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Display size={26} style={{ marginBottom: 24, textAlign: 'center' }}>
            {parseError || 'Coupon not found'}
          </Display>
          <PrimaryButton label="Go Back" onPress={close} style={{ alignSelf: 'stretch' }} />
        </View>
      );
    }

    if (isSubscriptionLoading) {
      return (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={BRAND_INK} />
          <Text style={{ marginTop: 12, fontFamily: 'Figtree_700Bold', fontSize: 17, color: BRAND_MUTED }}>Loading...</Text>
        </View>
      );
    }

    if (isActivated) {
      const minutes = Math.floor(secondsLeft / 60);
      const seconds = String(secondsLeft % 60).padStart(2, '0');
      return (
        <View accessibilityLiveRegion="polite">
          <Raised radius={34} offset={SHADOW_SM} style={{ alignSelf: 'center', marginTop: 6 }}>
            <View
              style={{
                width: 68,
                height: 68,
                borderRadius: 34,
                borderWidth: OUTLINE,
                borderColor: BRAND_INK,
                backgroundColor: BRAND_GREEN,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={36} color={WHITE} strokeWidth={3.5} />
            </View>
          </Raised>
          <Display accessibilityRole="header" size={38} style={{ marginTop: 16, textAlign: 'center' }}>
            You're all set!
          </Display>
          {/* the business name always starts a line of its own (CLAUDE.md, Styling) */}
          <Text style={{ marginTop: 8, textAlign: 'center', fontFamily: 'Figtree_400Regular', fontSize: 16, lineHeight: 22, color: BRAND_MUTED }}>
            Show this screen to the cashier at{'\n'}
            <Text style={{ fontFamily: 'Figtree_700Bold', color: BRAND_INK }}>{coupon.vendor}</Text>.
          </Text>

          <Ticket style={{ marginTop: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18 }}>
              <LogoBadge coupon={coupon} size={60} radius={14} padding={5} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Display size={32} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>
                  {copy?.headline}
                </Display>
                {copy?.description ? (
                  <Text numberOfLines={3} style={{ marginTop: 4, fontFamily: 'Figtree_400Regular', fontSize: 15, lineHeight: 20, color: BRAND_MUTED }}>
                    {copy.description}
                  </Text>
                ) : null}
              </View>
            </View>
            <TicketTear />
            <View style={{ paddingTop: 14, paddingHorizontal: 18, paddingBottom: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View>
                  <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 14, color: BRAND_MUTED }}>Valid for</Text>
                  <Display
                    size={56}
                    color={BRAND_GREEN}
                    style={{ marginTop: 4, fontVariant: ['tabular-nums'] }}
                    accessibilityLabel={`${minutes} minutes ${secondsLeft % 60} seconds`}
                  >
                    {minutes}:{seconds}
                  </Display>
                </View>
                <View style={{ alignItems: 'flex-end', paddingBottom: 6 }}>
                  <Text style={{ fontFamily: 'Figtree_600SemiBold', fontSize: 14, color: BRAND_MUTED }}>Redeemed</Text>
                  <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 16, color: BRAND_INK }}>
                    {formatExpirationDate(userCouponToLastUsedAt.get(coupon.coupon_id) || '', "redeemed")}
                  </Text>
                </View>
              </View>
              {/* drains with the countdown */}
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{ marginTop: 10, height: 12, borderRadius: 6, borderWidth: OUTLINE, borderColor: BRAND_INK, backgroundColor: WHITE, overflow: 'hidden' }}
              >
                <Animated.View
                  style={{
                    height: '100%',
                    width: drain.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: BRAND_GREEN,
                    borderRightWidth: OUTLINE,
                    borderRightColor: BRAND_INK,
                  }}
                />
              </View>
            </View>
          </Ticket>

          <DarkButton label="Done" onPress={close} style={{ marginTop: 20 }} />
        </View>
      );
    }

    const couponUses = userCouponToUsages.get(coupon.coupon_id) || 0;
    const isUsedUp = coupon.usage_limit > 0 && couponUses >= coupon.usage_limit;
    const usesLabel = coupon.usage_limit === 0
      ? 'Unlimited, once an hour'
      : `${Math.max(0, coupon.usage_limit - couponUses)} of ${coupon.usage_limit} use${coupon.usage_limit === 1 ? '' : 's'} left`;
    const businessLine = [copy?.business, placeType].filter(Boolean).join(' · ');

    return (
      <>
        <View style={{ marginTop: 12, marginHorizontal: 4 }}>
          {businessLine ? (
            <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 17, color: BRAND_MUTED }}>{businessLine}</Text>
          ) : null}
          <Display
            accessibilityRole="header"
            size={46}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={{ marginTop: businessLine ? 6 : 0 }}
          >
            {copy?.headline}
          </Display>
          {copy?.description ? (
            <Text style={{ marginTop: 8, fontFamily: 'Figtree_400Regular', fontSize: 17, lineHeight: 24, color: BRAND_MUTED }}>
              {copy.description}
            </Text>
          ) : null}
          {coupon.location ? (
            <Text style={{ marginTop: 4, fontFamily: 'Figtree_500Medium', fontSize: 15, color: BRAND_MUTED }}>{coupon.location}</Text>
          ) : null}
        </View>

        <Ticket style={{ marginTop: 18 }}>
          {usedAt ? (
            <>
              <TicketRow label="Used on" value={formatExpirationDate(usedAt, "timestamp")} />
              <TicketTear />
              <TicketRow
                label="Expired on"
                value={formatExpirationDate(new Date(new Date(usedAt).getTime() + REDEMPTION_WINDOW_MS).toISOString(), "timestamp")}
              />
            </>
          ) : (
            <>
              <TicketRow label="Expires" value={formatExpirationDate(coupon.expiration_date, "date")} />
              <TicketTear />
              <TicketRow label="Uses" value={usesLabel} />
            </>
          )}
        </Ticket>

        {usedAt ? (
          // spent, so flat: dashed outline, no shadow
          <View
            style={{
              marginTop: 20,
              minHeight: 58,
              borderRadius: 29,
              borderWidth: OUTLINE,
              borderStyle: 'dashed',
              borderColor: BRAND_INK,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 18, color: BRAND_MUTED }}>Redeemed!</Text>
          </View>
        ) : (
          <>
            <PrimaryButton
              label={isRedeeming ? 'Using coupon...' : isUsedUp ? 'No uses left' : 'Use this coupon'}
              onPress={handleUseCoupon}
              disabled={isRedeeming || isUsedUp}
              loading={isRedeeming}
              style={{ marginTop: 20 }}
              accessibilityHint="Only tap this at the register"
            />
            <Text style={{ marginTop: 10, marginHorizontal: 8, textAlign: 'center', fontFamily: 'Figtree_500Medium', fontSize: 14, lineHeight: 20, color: BRAND_MUTED }}>
              {/* non-breaking space keeps "2 minutes" together on one line */}
              Once used, the coupon stays valid for 2{' '}minutes.
            </Text>
          </>
        )}
      </>
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end' }}>
      {/* dimmed page behind the sheet; tapping it closes the sheet */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM, opacity: progress }]}>
        <Pressable
          style={{ flex: 1 }}
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
          style={{
            maxHeight: windowHeight * 0.92,
            // the side outlines sit just off screen so only the top edge and corners show
            marginHorizontal: -OUTLINE,
            backgroundColor: BRAND_CREAM,
            borderTopLeftRadius: RADIUS.sheet,
            borderTopRightRadius: RADIUS.sheet,
            borderTopWidth: OUTLINE,
            borderLeftWidth: OUTLINE,
            borderRightWidth: OUTLINE,
            borderColor: BRAND_INK,
          }}
        >
          {/* swipe down here to dismiss: the grabber, and the photo on the deal sheet */}
          <View {...panResponder.panHandlers} style={{ paddingHorizontal: 16 }}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 12 }}>
              <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: BRAND_INK }} />
            </View>
            {showPhoto ? renderPhoto() : null}
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 20 }}
          >
            {renderContent()}
          </ScrollView>

          {isActivated ? (
            // Willie naps on the sheet's top edge while the cashier looks
            <Image
              source={require('@/assets/images/willie/laying-down.png')}
              contentFit="contain"
              pointerEvents="none"
              accessible={false}
              style={{ position: 'absolute', right: 26, top: -67, width: 150, height: 104 }}
            />
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
