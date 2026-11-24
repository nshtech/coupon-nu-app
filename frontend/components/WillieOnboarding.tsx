import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  BRAND_CREAM,
  BRAND_INK,
  BRAND_MUTED,
  BRAND_PURPLE,
  BRAND_YELLOW,
  BRAND_YELLOW_SOFT,
  SHADOW_SM,
  WHITE,
} from '@/constants/Colors';
import Display from '@/components/ui/Display';
import Icon, { IconName } from '@/components/ui/Icon';
import { RaisedPressable, surface } from '@/components/ui/Raised';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import PaywallScreen from '@/components/PaywallScreen';
import MockNotification from '@/components/onboarding/MockNotification';
import ProgressBar from '@/components/onboarding/ProgressBar';
import RedeemDemo from '@/components/onboarding/RedeemDemo';
import SpeechBubble, { TAIL } from '@/components/onboarding/SpeechBubble';
import WilliePose from '@/components/onboarding/WilliePose';
import { useEntrance } from '@/components/onboarding/useEntrance';
import { useCoupons } from '@/contexts/CouponsContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getPlaceType, PLACE_TYPES, PlaceType } from '@/utils/couponFilters';
import { enableNearbyAlerts, isNearbyAlertsEnabled } from '@/utils/nearbyAlerts';

// First-run guide starring Willie, shown by OnboardingContext. Built like a
// language-app lesson: a progress bar, Willie talking through a typed speech
// bubble, one quick question, the quarter pass (skippable with "View coupons
// first"), and a nearby-alerts ask at the end. Motion is kept calm: each step's
// content eases in with a soft spring and then holds still. The one loop is the
// redeem step's phone demo (onboarding/RedeemDemo.tsx), which holds a single
// frame under reduced motion. Reduced motion turns the rest off. Copy is a draft
// awaiting the copywriter's sign-off.

type Art = {
  source: ImageSourcePropType;
  // height / width of the PNG
  aspect: number;
  // where Willie's head sits across the image, 0-1; the bubble's tail aims there
  head: number;
  label: string;
};

const WILLIE = {
  moneyToss: { source: require('../assets/images/willie/money-toss.png'), aspect: 700 / 620, head: 0.68, label: 'Willie tossing dollar bills' },
  boba: { source: require('../assets/images/willie/boba-silly.png'), aspect: 700 / 538, head: 0.42, label: 'Willie sipping boba' },
  heartEyes: { source: require('../assets/images/willie/heart-eyes.png'), aspect: 490 / 700, head: 0.5, label: 'Willie with heart eyes' },
  laptop: { source: require('../assets/images/willie/laptop.png'), aspect: 525 / 700, head: 0.5, label: 'Willie at a laptop' },
  napping: { source: require('../assets/images/willie/laying-down.png'), aspect: 487 / 700, head: 0.2, label: 'Willie napping' },
  armsUp: { source: require('../assets/images/willie/arms-up.png'), aspect: 700 / 533, head: 0.52, label: 'Willie cheering' },
} satisfies Record<string, Art>;

type StepKey = 'welcome' | 'interests' | 'match' | 'redeem' | 'paywall' | 'alerts' | 'done';
// The pass comes last so "View coupons first" can drop people straight onto
// the deals; the send-off only follows a purchase (or opens for subscribers,
// who skip the pass).
const ALL_STEPS: StepKey[] = ['welcome', 'interests', 'match', 'redeem', 'alerts', 'paywall', 'done'];

const HOW_IT_WORKS = ['Find a deal you like', 'At the register, tap “Use this coupon”', 'Show the screen to the cashier'];

const CONTENT_PADDING = 20;

function bubbleText(step: StepKey, matchCount: number, isSubscribed: boolean) {
  switch (step) {
    case 'welcome':
      return 'Hi, I’m Willie!\nI get Northwestern students deals you won’t find anywhere else.';
    case 'interests':
      return 'What are you hunting for?';
    case 'match':
      return matchCount > 0
        ? `Great taste! I’ve got ${matchCount} ${matchCount === 1 ? 'deal' : 'deals'} like that waiting for you.`
        : 'Great taste! I’ll keep an eye out for those.';
    case 'redeem':
      return 'Saving takes three taps.';
    case 'alerts':
      return 'Want a heads-up\nwhen you walk past a deal?';
    case 'done':
      return isSubscribed
        ? 'You’re all set! Let’s go save some money.'
        : 'You’re all set! Look around, and unlock a deal when you’re ready.';
    case 'paywall':
      // PaywallScreen has its own copy
      return '';
  }
}

function primaryLabel(step: StepKey, isSubscribed: boolean) {
  if (step === 'alerts') return 'Turn on alerts';
  if (step === 'done') return isSubscribed ? 'Start saving' : 'See the deals';
  return 'Continue';
}

type WillieOnboardingProps = {
  visible: boolean;
  // the place types picked on the question step, when it was answered
  onFinish: (interests?: PlaceType[]) => void;
};

export default function WillieOnboarding({ visible, onFinish }: WillieOnboardingProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { activeCoupons } = useCoupons();
  const { isSubscribed } = useSubscription();
  const [steps, setSteps] = useState<StepKey[]>(ALL_STEPS);
  const [index, setIndex] = useState(0);
  // which side the next step slides in from
  const [direction, setDirection] = useState<1 | -1>(1);
  const [interests, setInterests] = useState<PlaceType[]>([]);
  const [isAskingAlerts, setIsAskingAlerts] = useState(false);

  // The step list is fixed when the intro opens, so a late answer (the pass
  // loading, the alerts check) never shifts the step someone is on. The pass
  // step is dropped for subscribers; alerts when they are already on (a
  // replay) or on web.
  useEffect(() => {
    if (!visible) return;
    setIndex(0);
    setDirection(1);
    setInterests([]);
    setIsAskingAlerts(false);

    const opening = ALL_STEPS.filter(key => key !== 'paywall' || !isSubscribed);
    const withoutAlerts = opening.filter(key => key !== 'alerts');
    if (Platform.OS === 'web') {
      setSteps(withoutAlerts);
      return;
    }
    setSteps(opening);
    let cancelled = false;
    isNearbyAlertsEnabled().then(isOn => {
      if (isOn && !cancelled) setSteps(withoutAlerts);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const stepIndex = Math.min(index, steps.length - 1);
  const stepKey = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  // only place types that have a live deal, like the Discover chips; all of
  // them while the coupons are still loading
  const placeTypes = useMemo(() => {
    const present = new Set(activeCoupons.map(getPlaceType));
    const offered = PLACE_TYPES.filter(type => present.has(type.key));
    return offered.length >= 2 ? offered : PLACE_TYPES.filter(type => type.key !== 'treats');
  }, [activeCoupons]);

  const matchCount = useMemo(
    () =>
      activeCoupons.filter(coupon => {
        const type = getPlaceType(coupon);
        return type !== null && interests.includes(type);
      }).length,
    [activeCoupons, interests]
  );

  const text = bubbleText(stepKey, matchCount, isSubscribed);

  useEffect(() => {
    if (!visible || stepKey === 'paywall') return;
    AccessibilityInfo.announceForAccessibility(`Step ${stepIndex + 1} of ${steps.length}. ${text}`);
    if (stepKey === 'done') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [stepKey, visible]);

  const finish = () => onFinish(interests.length ? interests : undefined);

  const goNext = () => {
    if (isLast) {
      finish();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setDirection(1);
    setIndex(stepIndex + 1);
  };

  // a purchase (or restore, or promo code) on the pass step moves on by itself;
  // this also skips the step if the pass turned up after the intro opened
  useEffect(() => {
    if (visible && stepKey === 'paywall' && isSubscribed) goNext();
  }, [visible, stepKey, isSubscribed]);

  const goBack = () => {
    if (isAskingAlerts) return;
    // the first step's back slot closes the intro; the finale has no way back
    if (stepIndex === 0 || stepKey === 'done') {
      finish();
      return;
    }
    // going back steps over screens that no longer apply: the pass once it is
    // bought, and the deal count when the question was skipped
    let previous = stepIndex - 1;
    while (
      previous > 0 &&
      ((steps[previous] === 'paywall' && isSubscribed) || (steps[previous] === 'match' && interests.length === 0))
    ) {
      previous -= 1;
    }
    setDirection(-1);
    setIndex(Math.max(0, previous));
  };

  // skipping the question also skips the deal count, which needs picks
  const skipInterests = () => {
    setInterests([]);
    setDirection(1);
    setIndex(steps.indexOf('redeem'));
  };

  const toggleInterest = (key: PlaceType) => {
    Haptics.selectionAsync().catch(() => {});
    setInterests(current => (current.includes(key) ? current.filter(item => item !== key) : [...current, key]));
  };

  // asks for notifications, then location while in use, then "Always"
  // (enableNearbyAlerts); whatever the answer, the intro moves on
  const turnOnAlerts = async () => {
    if (isAskingAlerts) return;
    setIsAskingAlerts(true);
    try {
      await enableNearbyAlerts();
    } catch (e) {
      console.error('Error turning on nearby alerts from the intro:', e);
    }
    setIsAskingAlerts(false);
    goNext();
  };

  // the pass step replaces the whole intro screen with the regular paywall;
  // skipping or closing it ends the intro on the deals
  if (stepKey === 'paywall') {
    return (
      <Modal visible={visible} animationType="none" presentationStyle="fullScreen" onRequestClose={goBack}>
        <StepSlide key="paywall" direction={direction}>
          <PaywallScreen onClose={finish} skipLabel="View coupons first" onSkip={finish} />
        </StepSlide>
      </Modal>
    );
  }

  let body: ReactNode;
  switch (stepKey) {
    case 'welcome':
      body = <Hero art={WILLIE.moneyToss} text={text} />;
      break;
    case 'interests':
      body = (
        <Chat art={WILLIE.boba} text={text}>
          <Text style={{ marginTop: 16, fontFamily: 'Figtree_400Regular', fontSize: 15, color: BRAND_MUTED }}>
            Pick as many as you like.
          </Text>
          <View style={{ marginTop: 8, marginHorizontal: -6, flexDirection: 'row', flexWrap: 'wrap' }}>
            {placeTypes.map((type, i) => (
              <View key={type.key} style={{ width: '50%', padding: 6 }}>
                <InterestCard
                  label={type.label}
                  icon={type.key}
                  index={i}
                  selected={interests.includes(type.key)}
                  onPress={() => toggleInterest(type.key)}
                />
              </View>
            ))}
          </View>
        </Chat>
      );
      break;
    case 'match':
      body = <Hero art={WILLIE.heartEyes} text={text} />;
      break;
    case 'redeem':
      body = (
        <Chat art={WILLIE.laptop} text={text}>
          <HowToRedeem />
        </Chat>
      );
      break;
    case 'alerts':
      body = (
        <View style={{ flex: 1 }}>
          <View style={{ paddingTop: 12 }}>
            <MockNotification delay={300} />
          </View>
          <Hero art={WILLIE.napping} text={text} scale={0.72} sleeping />
        </View>
      );
      break;
    case 'done':
      body = <Hero art={WILLIE.armsUp} text={text} />;
      break;
  }

  return (
    <Modal visible={visible} animationType={reduceMotion ? 'none' : 'slide'} presentationStyle="fullScreen" onRequestClose={goBack}>
      <StatusBar style="dark" />
      <View style={{ flex: 1, backgroundColor: BRAND_CREAM, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 12 }}>
        {/* top bar: back (close on the first step) and the progress bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: CONTENT_PADDING }}>
          {stepKey !== 'done' ? (
            <Pressable
              onPress={goBack}
              disabled={isAskingAlerts}
              accessibilityRole="button"
              accessibilityLabel={stepIndex === 0 ? 'Close intro' : 'Back'}
              style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: isAskingAlerts ? 0.4 : 1 }}
            >
              <Icon name={stepIndex === 0 ? 'close' : 'back'} size={24} color={BRAND_PURPLE} strokeWidth={2.5} />
            </Pressable>
          ) : (
            <View style={{ width: 44, height: 44 }} />
          )}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <ProgressBar step={stepIndex + 1} count={steps.length} />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: CONTENT_PADDING, paddingBottom: 12 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <StepSlide key={stepKey} direction={direction}>
            {body}
          </StepSlide>
        </ScrollView>

        <View style={{ paddingHorizontal: CONTENT_PADDING, paddingTop: 8 }}>
          {stepKey === 'alerts' ? (
            <Text
              style={{
                marginBottom: 12,
                textAlign: 'center',
                fontFamily: 'Figtree_400Regular',
                fontSize: 14,
                lineHeight: 20,
                color: BRAND_MUTED,
              }}
            >
              Uses notifications and your location. Your location never leaves your phone.
            </Text>
          ) : null}
          <PrimaryButton
            label={primaryLabel(stepKey, isSubscribed)}
            onPress={stepKey === 'alerts' ? turnOnAlerts : goNext}
            disabled={stepKey === 'interests' && interests.length === 0}
            loading={isAskingAlerts}
          />
          {stepKey === 'interests' ? (
            <TextButton label="Skip" onPress={skipInterests} color={BRAND_PURPLE} style={{ alignSelf: 'center' }} />
          ) : null}
          {stepKey === 'alerts' ? (
            <TextButton label="Not now" onPress={goNext} disabled={isAskingAlerts} color={BRAND_PURPLE} style={{ alignSelf: 'center' }} />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// eases a step's content in from the side it is coming from
function StepSlide({ direction, children }: { direction: 1 | -1; children: ReactNode }) {
  const entrance = useEntrance({ x: 16 * direction, y: 0 });
  return <Animated.View style={[{ flex: 1 }, entrance]}>{children}</Animated.View>;
}

function fitArt(art: Art, maxWidth: number, maxHeight: number) {
  let height = maxHeight;
  let width = height / art.aspect;
  if (width > maxWidth) {
    width = maxWidth;
    height = width * art.aspect;
  }
  return { width, height };
}

// Big Willie in the middle with his bubble above him. `scale` shrinks him on
// steps that share the screen with something else.
function Hero({ art, text, scale = 1, sleeping }: { art: Art; text: string; scale?: number; sleeping?: boolean }) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const maxHeight = Math.max(140, Math.min(290, windowHeight * 0.33)) * scale;
  const size = fitArt(art, Math.min(windowWidth - 80, 300) * scale, maxHeight);
  // the bubble spans the content width and Willie is centered under it
  const bubbleWidth = windowWidth - CONTENT_PADDING * 2;
  const tailAt = Math.min(0.88, Math.max(0.12, 0.5 + ((art.head - 0.5) * size.width) / bubbleWidth));

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 }}>
      <SpeechBubble text={text} tail="down" tailAt={tailAt} style={{ alignSelf: 'stretch', marginBottom: TAIL + 10 }} />
      <WilliePose source={art.source} label={art.label} width={size.width} height={size.height} sleeping={sleeping} delay={60} />
    </View>
  );
}

// Small Willie on the left talking to the right, with the step's content below.
function Chat({ art, text, children }: { art: Art; text: string; children?: ReactNode }) {
  const size = fitArt(art, 96, 112);

  // fills the step so content below the bubble (the redeem demo) can grow
  return (
    <View style={{ flex: 1, paddingTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <WilliePose source={art.source} label={art.label} width={size.width} height={size.height} delay={60} />
        <SpeechBubble text={text} tail="left" style={{ flex: 1, marginLeft: TAIL + 8 }} />
      </View>
      {children}
    </View>
  );
}

// A place type to pick on the question step; picked cards turn ink, like a
// selected chip. They ease in one after another.
function InterestCard({
  label,
  icon,
  index,
  selected,
  onPress,
}: {
  label: string;
  icon: IconName;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const entrance = useEntrance({ delay: 200 + index * 40 });
  const color = selected ? BRAND_CREAM : BRAND_INK;

  return (
    <Animated.View style={entrance}>
      <RaisedPressable
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: selected }}
        radius={18}
        offset={SHADOW_SM}
        style={{ marginRight: SHADOW_SM, marginBottom: SHADOW_SM }}
        faceStyle={[surface(18, selected ? BRAND_INK : WHITE), { minHeight: 80, paddingHorizontal: 14, paddingVertical: 12 }]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Icon name={icon} size={26} color={color} />
          {selected ? <Icon name="check" size={20} color={BRAND_YELLOW} strokeWidth={3} /> : null}
        </View>
        <Text style={{ marginTop: 10, fontFamily: 'Figtree_700Bold', fontSize: 16, color }}>{label}</Text>
      </RaisedPressable>
    </Animated.View>
  );
}

// The three steps with the phone demo under them. The row the demo is acting
// out gets a highlighter mark, so the words and the picture line up.
function HowToRedeem() {
  const [phase, setPhase] = useState<number | null>(null);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ marginTop: 12 }}>
        {HOW_IT_WORKS.map((line, i) => (
          <HowItWorksRow key={line} index={i} text={line} active={phase === i} />
        ))}
      </View>
      <RedeemDemo onPhaseChange={setPhase} style={{ marginTop: 16 }} />
    </View>
  );
}

function HowItWorksRow({ index, text, active = false }: { index: number; text: string; active?: boolean }) {
  const reduceMotion = useReducedMotion();
  const entrance = useEntrance({ delay: 200 + index * 80 });
  const mark = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    mark.value = reduceMotion ? (active ? 1 : 0) : withTiming(active ? 1 : 0, { duration: 240 });
  }, [active, reduceMotion]);

  const markStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(mark.value, [0, 1], [WHITE, BRAND_YELLOW_SOFT]),
  }));

  return (
    <Animated.View
      style={[
        surface(18),
        { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
        entrance,
        markStyle,
      ]}
    >
      <Display size={30} color={BRAND_PURPLE} style={{ minWidth: 22, textAlign: 'center' }}>
        {index + 1}
      </Display>
      <Text style={{ flex: 1, fontFamily: 'Figtree_600SemiBold', fontSize: 16, lineHeight: 22, color: BRAND_INK }}>{text}</Text>
    </Animated.View>
  );
}
