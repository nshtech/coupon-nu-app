import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Modal, Animated, Easing, AccessibilityInfo, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useReducedMotion } from 'react-native-reanimated';
import { ArrowLeft, X } from 'lucide-react-native';
import { BRAND_PURPLE_SOFT } from '@/constants/Colors';
import TactileButton from '@/components/TactileButton';

// Three-step first-run guide starring Willie. Shown by OnboardingContext.

const STEPS = [
  {
    image: require('../assets/images/willie/make-it-rain.png'),
    panel: 'bg-brand-cream',
    aside: 'Let’s make that student budget go further!',
    eyebrow: 'Meet Willie',
    title: 'Your new savings sidekick.',
    body: 'I sniff out the best student deals around Evanston, so your budget can breathe a little easier.',
    imageLabel: 'Willie tossing dollar bills',
  },
  {
    image: require('../assets/images/willie/boba-silly.png'),
    panel: 'bg-brand-mint',
    aside: 'Boba today? Pilates tomorrow? I’ve got you.',
    eyebrow: 'Discover nearby',
    title: 'The good stuff is closer than you think.',
    body: 'Find deals on food, fitness, shops, and all the places you already love around campus.',
    imageLabel: 'Willie sipping boba',
  },
  {
    image: require('../assets/images/willie/hacker.png'),
    panel: 'bg-brand-lavender',
    aside: 'Your wallet is officially in good paws.',
    eyebrow: 'Save & redeem',
    title: 'One tap. Real savings.',
    body: 'Save your favorites, check remaining uses, and pull up a coupon when you’re ready to redeem.',
    imageLabel: 'Willie at a laptop',
  },
];

// the send-off burst after "Start saving"
const BURST_EMOJI = ['💸', '🎉', '⭐', '💜', '🧋', '💸', '✨', '🎉', '💜', '⭐', '✨', '💸', '🎉', '⭐'];
const CELEBRATION_MS = 1100;

type WillieOnboardingProps = {
  visible: boolean;
  onFinish: () => void;
};

export default function WillieOnboarding({ visible, onFinish }: WillieOnboardingProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [stepIndex, setStepIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const williePop = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const [isCelebrating, setIsCelebrating] = useState(false);
  const isCelebratingRef = useRef(false);

  // each piece flies out from the button on its own arc
  const particles = useMemo(
    () =>
      BURST_EMOJI.map((emoji, index) => {
        const angle = Math.PI * (0.12 + (0.76 * index) / (BURST_EMOJI.length - 1)) + (Math.random() - 0.5) * 0.25;
        const distance = 160 + Math.random() * 160;
        return {
          emoji,
          dx: -Math.cos(angle) * distance,
          dy: -Math.sin(angle) * distance,
          spin: `${(Math.random() - 0.5) * 140}deg`,
          size: 22 + Math.random() * 14,
        };
      }),
    []
  );

  const step = STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === STEPS.length - 1;
  // tall enough for the bubble plus Willie, still leaving room for the copy on short phones
  const panelHeight = Math.min(width - 24, height * 0.5);

  useEffect(() => {
    if (!visible) return;
    setStepIndex(0);
    isCelebratingRef.current = false;
    setIsCelebrating(false);
    burst.setValue(0);
    williePop.setValue(1);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    AccessibilityInfo.announceForAccessibility(`Step ${stepIndex + 1} of ${STEPS.length}. ${step.title}`);
    if (reduceMotion) return;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [stepIndex, visible]);

  const celebrate = () => {
    if (isCelebratingRef.current) return;
    isCelebratingRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (reduceMotion) {
      onFinish();
      return;
    }

    setIsCelebrating(true);
    // a second, lighter thump as Willie lands
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), 260);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(williePop, { toValue: 1.18, speed: 40, bounciness: 14, useNativeDriver: true }),
        Animated.spring(williePop, { toValue: 1, speed: 14, bounciness: 12, useNativeDriver: true }),
      ]),
      Animated.timing(burst, { toValue: 1, duration: CELEBRATION_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start(() => onFinish());
  };

  const goNext = () => {
    if (isLast) {
      celebrate();
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStepIndex(index => index + 1);
  };
  // the first step's back slot closes the intro instead
  const goBack = () => (isFirst ? onFinish() : setStepIndex(index => index - 1));

  return (
    <Modal visible={visible} animationType={reduceMotion ? 'none' : 'slide'} presentationStyle="fullScreen" onRequestClose={onFinish}>
      <StatusBar style="dark" />
      <View className="flex-1 bg-brand-cream-soft px-3" style={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 12 }}>
        {/* top bar: close/back, progress, skip */}
        <View className="flex-row items-center px-1">
          <Pressable
            onPress={goBack}
            accessibilityRole="button"
            accessibilityLabel={isFirst ? 'Close intro' : 'Back'}
            className="h-11 w-11 items-center justify-center"
          >
            {isFirst ? <X size={18} color={BRAND_PURPLE_SOFT} /> : <ArrowLeft size={20} color={BRAND_PURPLE_SOFT} />}
          </Pressable>

          <View
            className="mx-2 flex-1 flex-row gap-2"
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Step ${stepIndex + 1} of ${STEPS.length}`}
          >
            {STEPS.map((_, index) => (
              <View key={index} className={`h-2 flex-1 rounded-full ${index <= stepIndex ? 'bg-brand-purple' : 'bg-brand-lavender'}`} />
            ))}
          </View>

          <Pressable onPress={onFinish} accessibilityRole="button" accessibilityLabel="Skip intro" className="h-11 justify-center px-2">
            <Text className="font-display-medium text-lg text-brand-purple-soft">Skip</Text>
          </Pressable>
        </View>

        <Animated.View style={{ flex: 1, opacity: fade }}>
          {/* mascot panel: Willie talks from a speech bubble right above his head */}
          <View
            className={`mt-5 items-center overflow-hidden rounded-[36px] px-5 pt-5 ${step.panel}`}
            style={{ height: panelHeight }}
          >
            <View pointerEvents="none" className="absolute -left-12 -top-12 h-40 w-40 rounded-full border-[22px] border-white/40" />
            <View pointerEvents="none" className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full border-[22px] border-white/40 bg-white/20" />

            <View className="w-full items-center">
              <View className="w-full rounded-3xl border-2 border-purple-20 bg-white px-5 py-4">
                <Text className="text-center font-display text-lg leading-6 text-brand-purple">{step.aside}</Text>
              </View>
              {/* tail: a rotated square whose top half hides under the bubble, pointing down at Willie */}
              <View className="-mt-[11px] h-5 w-5 rotate-45 border-b-2 border-r-2 border-purple-20 bg-white" />
            </View>

            <Animated.View style={{ flex: 1, width: '100%', marginTop: -4, transform: [{ scale: williePop }] }}>
              <Image
                source={step.image}
                contentFit="contain"
                accessibilityLabel={step.imageLabel}
                style={{ flex: 1, width: '100%' }}
              />
            </Animated.View>
          </View>

          <View className="items-center px-5">
            <Text className="mt-7 font-display text-sm uppercase tracking-[3px] text-brand-purple-soft">{step.eyebrow}</Text>
            <Text accessibilityRole="header" className="mt-3 text-center font-display-bold text-[30px] leading-9 text-brand-purple">
              {step.title}
            </Text>
            <Text className="mt-3 text-center font-body text-base leading-7 text-dark-gray">{step.body}</Text>
          </View>
        </Animated.View>

        <View className="mt-4">
          {/* celebration burst, launched from the middle of the button */}
          {isCelebrating ? (
            <View pointerEvents="none" className="absolute left-1/2 top-6 z-10">
              {particles.map((particle, index) => (
                <Animated.Text
                  key={index}
                  style={{
                    position: 'absolute',
                    fontSize: particle.size,
                    opacity: burst.interpolate({ inputRange: [0, 0.1, 0.7, 1], outputRange: [0, 1, 1, 0] }),
                    transform: [
                      { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, particle.dx] }) },
                      // shoot up, then drift down a little as if falling
                      { translateY: burst.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0, particle.dy, particle.dy + 50] }) },
                      { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', particle.spin] }) },
                      { scale: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1.15, 0.9] }) },
                    ],
                  }}
                >
                  {particle.emoji}
                </Animated.Text>
              ))}
            </View>
          ) : null}
          <TactileButton
            label={isCelebrating ? 'Let’s go! 🎉' : isLast ? 'Start saving' : 'Continue'}
            onPress={goNext}
            textClassName="text-white"
          />
        </View>
      </View>
    </Modal>
  );
}
