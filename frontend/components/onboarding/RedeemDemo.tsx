import { Component, ReactNode, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Path } from 'react-native-svg';
import {
  BRAND_CREAM,
  BRAND_GREEN,
  BRAND_INK,
  BRAND_LILAC,
  BRAND_MUTED,
  BRAND_PURPLE,
  BRAND_YELLOW,
  BRAND_YELLOW_SOFT,
  OUTLINE,
  RADIUS,
  SHADOW,
  SHADOW_SM,
  WHITE,
} from '@/constants/Colors';
import Display from '@/components/ui/Display';
import Icon from '@/components/ui/Icon';
import { surface } from '@/components/ui/Raised';
import { Ticket, TicketTear } from '@/components/ui/Ticket';
import { useEntrance } from '@/components/onboarding/useEntrance';

// The redeem step's demo: a little phone that taps a deal, taps "Use this
// coupon", confirms, and lands on the "You're all set!" screen the cashier
// sees. It is drawn in code from the app's own pieces instead of shipped as a
// GIF or video: the screens are laid out at real size (SCREEN_W points wide)
// and scaled down, so it stays sharp on every phone, adds nothing to the
// bundle, and can tell the step which of its three rows it is showing
// (`onPhaseChange`). Mirrors coupon-detail.tsx and CouponThumbnail.tsx; when
// those change, change this too.
//
// One clock drives everything: it runs 0 → CYCLE ms on the UI thread and every
// movement is a function of it (the T timeline), so all timings live in one
// place. This loop is the one thing in the intro that repeats; it eases and
// never bounces, and under reduced motion it holds one frame instead (the
// finger on "Use this coupon"). The deals are made up, so a screenshot of the
// demo can never pass for a real redemption at a partner's register.

type Point = { x: number; y: number };

// ---- the screen, in real points before scaling ----
const SCREEN_W = 390;
// the shortest slice of screen that fits the tallest sheet with a peek of the
// list above it; a shorter card draws a smaller phone
const MIN_SCREEN_H = 580;
const SCREEN_RADIUS = 47;
const STATUS_H = 54;
const GUTTER = 16;
const WORDMARK_H = 24;
// wordmark-basic-dark.png is 700 x 86
const WORDMARK_W = Math.round((WORDMARK_H * 700) / 86);
const HEADER_H = STATUS_H + WORDMARK_H + 14 + OUTLINE;
const SEARCH_H = 52;
const CARD_TOP = HEADER_H + 16 + SEARCH_H + 14;
const CARD_W = SCREEN_W - GUTTER * 2 - SHADOW;
const CARD_H = 154;
const CARD_PHOTO_W = 112;
const SHEET_H = 530;
const GRABBER_H = 27;
const SHEET_PHOTO_H = 100;
const BUTTON_H = 58;
// where "Use this coupon" starts in the sheet: the grabber, the photo and the
// logo badge hanging 26 below it, the words (116), the ticket (120), the gap
const BUTTON_TOP = GRABBER_H + SHEET_PHOTO_H + 26 + 116 + 120 + 20;
const ALERT_W = 270;
const ALERT_H = 148;
const ALERT_BUTTON_H = 44;
// ink at 60%, as on the real sheet
const SCRIM = 'rgba(34, 16, 61, 0.6)';
// the system alert's colors (light mode)
const ALERT_FILL = 'rgba(242, 242, 247, 0.97)';
const ALERT_LINE = 'rgba(60, 60, 67, 0.29)';
const ALERT_BLUE = '#007AFF';

// ---- the phone, in points on the card ----
const PHONE_TOP = 16;
const BEZEL = 5;
const PHONE_MAX_W = 250;
const HAND_W = 30;
const HAND_H = 36;
// the fingertip, where a tap lands
const TIP: Point = { x: 11, y: 4 };
const RING = 34;
// where the finger comes in from and leaves to, relative to its first and last tap
const ENTER: Point = { x: 56, y: 84 };
const LEAVE: Point = { x: 40, y: 70 };

// ---- timeline, ms into each loop ----
const CYCLE = 9600;
// lets the step's rows ease in before the demo starts
const START_DELAY = 500;
// one tap: down and back up
const PRESS = 300;
const T = {
  pointerIn: 500,
  tapDeal: 1500,
  sheetUp: 1800,
  tapButton: 2900,
  alertIn: 3250,
  tapUse: 4100,
  allSet: 4400,
  timerStart: 4700,
  fadeOut: CYCLE - 400,
};
const STILL = T.tapButton;
const REDEMPTION_SECONDS = 120;

type Deal = { business: string; headline: string; description: string; uses: string; letter?: string };

// made-up places: no partner's name ever appears on the demo's "all set" screen
const DEALS: Deal[] = [
  { business: 'Willie’s Boba Bar', headline: 'Free topping', description: 'With any drink.', uses: '2 uses left' },
  { business: 'Sheridan Slice', headline: '$5 off', description: 'Any order over $20.', uses: 'Unlimited', letter: 'S' },
  { business: 'Lakeside Nails', headline: '20% off', description: 'Any manicure.', uses: '1 use left', letter: 'L' },
];
const DEAL = DEALS[0];

const BOBA = require('@/assets/images/willie/boba-silly.png');
const WILLIE_FACE = require('@/assets/images/willie/willie-face-tab.png');
const NAPPING = require('@/assets/images/willie/laying-down.png');
const WORDMARK = require('@/assets/images/brand/wordmark-basic-dark.png');

// ---- clock helpers (worklets) ----

function progress(t: number, start: number, duration: number) {
  'worklet';
  return Math.min(1, Math.max(0, (t - start) / duration));
}

// 0 → 1 over [start, start + duration], eased in and out
function ramp(t: number, start: number, duration: number) {
  'worklet';
  const p = progress(t, start, duration);
  return p * p * (3 - 2 * p);
}

// 0 → 1, decelerating: things arriving, like the sheet
function arrive(t: number, start: number, duration: number) {
  'worklet';
  const p = 1 - progress(t, start, duration);
  return 1 - p * p * p;
}

// 0 → 1 → 0 across one tap
function press(t: number, start: number) {
  'worklet';
  const p = progress(t, start, PRESS);
  return p > 0 && p < 1 ? Math.sin(Math.PI * p) : 0;
}

// which of the step's three rows the demo is showing
function phaseAt(t: number) {
  'worklet';
  return t < T.sheetUp ? 0 : t < T.allSet + 200 ? 1 : 2;
}

function secondsAt(t: number) {
  'worklet';
  return t < T.timerStart ? REDEMPTION_SECONDS : REDEMPTION_SECONDS - Math.floor((t - T.timerStart) / 1000);
}

// ---- layout ----

// The phone stands centered on the card and runs off its bottom edge, which
// crops it. Its screen shows SCREEN_W points scaled to fit; the slice of
// screen that shows (canvasH, in real points) is as tall as the card allows.
function phoneGeometry(width: number, height: number) {
  const innerW = width - OUTLINE * 2;
  const innerH = height - OUTLINE * 2;
  const visibleH = innerH - PHONE_TOP - BEZEL;
  const scale = Math.min((Math.min(innerW * 0.6, PHONE_MAX_W) - BEZEL * 2) / SCREEN_W, visibleH / MIN_SCREEN_H);
  const screenW = SCREEN_W * scale;
  const phoneW = screenW + BEZEL * 2;
  const phoneX = (innerW - phoneW) / 2;
  return {
    innerH,
    visibleH,
    scale,
    screenW,
    phoneW,
    phoneX,
    screenRadius: SCREEN_RADIUS * scale,
    canvasH: visibleH / scale,
    screenX: phoneX + BEZEL,
    screenY: PHONE_TOP + BEZEL,
  };
}

type RedeemDemoProps = {
  // 0, 1 or 2: the row of the step the demo is acting out
  onPhaseChange?: (phase: number) => void;
  style?: StyleProp<ViewStyle>;
};

export default function RedeemDemo(props: RedeemDemoProps) {
  return (
    <DemoBoundary>
      <Stage {...props} />
    </DemoBoundary>
  );
}

// a decoration must never take the intro down with it
class DemoBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Redeem demo failed to render:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

// the lilac card the phone stands in; fills the space left on the step
function Stage({ onPhaseChange, style }: RedeemDemoProps) {
  const entrance = useEntrance({ delay: 440 });
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize(current => (current && current.width === width && current.height === height ? current : { width, height }));
  };

  return (
    <Animated.View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Example: tap a deal, tap Use this coupon and confirm, then show the You're all set screen to the cashier."
      style={[surface(RADIUS.panel, BRAND_LILAC), { flex: 1, minHeight: 250, maxHeight: 440, overflow: 'hidden' }, entrance, style]}
    >
      {size ? <Phone width={size.width} height={size.height} onPhaseChange={onPhaseChange} /> : null}
    </Animated.View>
  );
}

function Phone({ width, height, onPhaseChange }: { width: number; height: number; onPhaseChange?: (phase: number) => void }) {
  const reduceMotion = useReducedMotion();
  const clock = useSharedValue(reduceMotion ? STILL : 0);
  const [secondsLeft, setSecondsLeft] = useState(REDEMPTION_SECONDS);
  const g = useMemo(() => phoneGeometry(width, height), [width, height]);

  useEffect(() => {
    if (reduceMotion) return;
    clock.value = withDelay(START_DELAY, withRepeat(withTiming(CYCLE, { duration: CYCLE, easing: Easing.linear }), -1));
    return () => cancelAnimation(clock);
  }, [reduceMotion]);

  useAnimatedReaction(
    () => phaseAt(clock.value),
    (phase, previous) => {
      if (phase !== previous && onPhaseChange) scheduleOnRN(onPhaseChange, phase);
    },
    [onPhaseChange]
  );

  useAnimatedReaction(
    () => secondsAt(clock.value),
    (seconds, previous) => {
      if (seconds !== previous) scheduleOnRN(setSecondsLeft, seconds);
    }
  );

  // the three taps, on the card in points
  const targets = useMemo(() => {
    const onCard = (x: number, y: number): Point => ({ x: g.screenX + x * g.scale, y: g.screenY + y * g.scale });
    const sheetTop = g.canvasH - SHEET_H;
    const alertTop = (g.canvasH - ALERT_H) / 2;
    return {
      deal: onCard(GUTTER + CARD_W / 2, CARD_TOP + CARD_H / 2),
      button: onCard(GUTTER + (SCREEN_W - GUTTER * 2 - SHADOW) / 2, sheetTop + BUTTON_TOP + BUTTON_H / 2),
      use: onCard((SCREEN_W - ALERT_W) / 2 + ALERT_W * 0.75, alertTop + ALERT_H - ALERT_BUTTON_H / 2),
    };
  }, [g]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: ramp(clock.value, 0, 400) * (1 - ramp(clock.value, T.fadeOut, 400)),
  }));

  return (
    <>
      <View
        style={{
          position: 'absolute',
          left: g.phoneX,
          top: PHONE_TOP,
          width: g.phoneW,
          // runs over the card's bottom outline, where it is ink on ink
          height: g.innerH - PHONE_TOP + OUTLINE,
          borderTopLeftRadius: g.screenRadius + BEZEL,
          borderTopRightRadius: g.screenRadius + BEZEL,
          backgroundColor: BRAND_INK,
        }}
      >
        <View
          style={{
            position: 'absolute',
            left: BEZEL,
            top: BEZEL,
            width: g.screenW,
            height: g.visibleH,
            borderTopLeftRadius: g.screenRadius,
            borderTopRightRadius: g.screenRadius,
            backgroundColor: BRAND_CREAM,
            overflow: 'hidden',
          }}
        >
          <View style={{ width: SCREEN_W, height: g.canvasH, transformOrigin: 'left top', transform: [{ scale: g.scale }] }}>
            <Animated.View style={[StyleSheet.absoluteFill, screenStyle]}>
              <ListScreen clock={clock} />
              <Scrim clock={clock} />
              {/* under the sheet, so napping Willie lies over it on short screens */}
              <StatusBar />
              <Sheet clock={clock} secondsLeft={secondsLeft} />
              <ConfirmAlert clock={clock} top={(g.canvasH - ALERT_H) / 2} />
            </Animated.View>
            {/* no camera cutout: napping Willie lies across the top of the screen */}
          </View>
        </View>
      </View>

      <TapRing clock={clock} at={targets.deal} start={T.tapDeal} />
      <TapRing clock={clock} at={targets.button} start={T.tapButton} />
      <TapRing clock={clock} at={targets.use} start={T.tapUse} />
      <Pointer clock={clock} targets={targets} />
    </>
  );
}

// ---- the finger ----

function Pointer({ clock, targets }: { clock: SharedValue<number>; targets: { deal: Point; button: Point; use: Point } }) {
  const { deal, button, use } = targets;
  const style = useAnimatedStyle(() => {
    const t = clock.value;
    const enter = ramp(t, T.pointerIn, T.tapDeal - T.pointerIn);
    const toButton = ramp(t, T.tapDeal + PRESS, T.tapButton - T.tapDeal - PRESS);
    const toUse = ramp(t, T.tapButton + PRESS, T.tapUse - T.tapButton - PRESS);
    const leave = ramp(t, T.tapUse + PRESS, 500);
    const x = deal.x + ENTER.x * (1 - enter) + (button.x - deal.x) * toButton + (use.x - button.x) * toUse + LEAVE.x * leave;
    const y = deal.y + ENTER.y * (1 - enter) + (button.y - deal.y) * toButton + (use.y - button.y) * toUse + LEAVE.y * leave;
    const pushing = press(t, T.tapDeal) + press(t, T.tapButton) + press(t, T.tapUse);
    return {
      opacity: ramp(t, T.pointerIn, 300) * (1 - ramp(t, T.tapUse + PRESS + 100, 350)),
      transform: [{ translateX: x - TIP.x }, { translateY: y - TIP.y }, { scale: 1 - 0.1 * pushing }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0, width: HAND_W, height: HAND_H, transformOrigin: [TIP.x, TIP.y, 0] }, style]}
    >
      <Svg width={HAND_W} height={HAND_H} viewBox="0 0 40 48">
        <Path
          d="M11 25 L11 7 A4 4 0 0 1 19 7 L19 20 A3 3 0 0 1 25 20.5 L25 22 A2.8 2.8 0 0 1 30.5 22.5 L30.5 24 A2.4 2.4 0 0 1 35 25 L35 33 C35 40 30.5 45 24 45 L21 45 C16.5 45 13.5 43 11 39.5 L5.2 31.5 A2.6 2.6 0 0 1 9.4 28.4 L11 30 Z"
          fill={WHITE}
          stroke={BRAND_INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        <Path d="M19 20 L19 26 M25 22 L25 27 M30.5 24 L30.5 28" stroke={BRAND_INK} strokeWidth={2.5} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// a ring that spreads from where the finger lands
function TapRing({ clock, at, start }: { clock: SharedValue<number>; at: Point; start: number }) {
  const style = useAnimatedStyle(() => {
    const p = progress(clock.value, start, 500);
    return {
      opacity: p > 0 && p < 1 ? 0.7 * (1 - p) : 0,
      transform: [{ scale: 0.5 + 1.1 * p }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: at.x - RING / 2,
          top: at.y - RING / 2,
          width: RING,
          height: RING,
          borderRadius: RING / 2,
          borderWidth: OUTLINE,
          borderColor: BRAND_INK,
        },
        style,
      ]}
    />
  );
}

// ---- the screens, in real points ----

// Text on the little screen never follows the system text size: it is a
// picture of a screen, and the taps are aimed at fixed spots on it.
function Label({
  children,
  size,
  font = 'Figtree_400Regular',
  color = BRAND_INK,
  lineHeight,
  align,
  lines = 1,
  style,
}: {
  children: ReactNode;
  size: number;
  font?: string;
  color?: string;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  lines?: number;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      allowFontScaling={false}
      numberOfLines={lines}
      style={[{ fontFamily: font, fontSize: size, lineHeight: lineHeight ?? Math.round(size * 1.3), color, textAlign: align }, style]}
    >
      {children}
    </Text>
  );
}

// a business logo badge: Willie for the demo deal, a letter for the others
function Logo({ size, radius, letter, style }: { size: number; radius: number; letter?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        surface(radius),
        { width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
        style,
      ]}
    >
      {letter ? (
        <Text allowFontScaling={false} style={{ fontFamily: 'BricolageGrotesque_800ExtraBold', fontSize: size * 0.45, color: BRAND_PURPLE }}>
          {letter}
        </Text>
      ) : (
        <Image source={WILLIE_FACE} contentFit="contain" style={{ width: size * 0.78, height: size * 0.78 }} />
      )}
    </View>
  );
}

function StatusBar() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: STATUS_H }}>
      <Label size={17} lineHeight={22} font="Figtree_700Bold" color={BRAND_CREAM} style={{ position: 'absolute', left: 50, top: 17 }}>
        9:41
      </Label>
      <View
        style={{
          position: 'absolute',
          right: 34,
          top: 22,
          width: 25,
          height: 12,
          padding: 1.5,
          borderRadius: 3.5,
          borderWidth: 1.5,
          borderColor: BRAND_CREAM,
        }}
      >
        <View style={{ flex: 1, borderRadius: 1.5, backgroundColor: BRAND_CREAM }} />
      </View>
    </View>
  );
}

// Discover, scrolled so the header has folded to the wordmark
function ListScreen({ clock }: { clock: SharedValue<number> }) {
  // the first card sinks onto its shadow when tapped, like RaisedPressable
  const sink = useAnimatedStyle(() => {
    const p = press(clock.value, T.tapDeal);
    return { transform: [{ translateX: SHADOW * p }, { translateY: SHADOW * p }] };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <View
        style={{
          height: HEADER_H,
          paddingTop: STATUS_H,
          paddingHorizontal: 20,
          backgroundColor: BRAND_PURPLE,
          borderBottomWidth: OUTLINE,
          borderBottomColor: BRAND_INK,
        }}
      >
        <Image source={WORDMARK} contentFit="contain" style={{ width: WORDMARK_W, height: WORDMARK_H }} />
      </View>
      <View
        style={[
          surface(SEARCH_H / 2),
          { marginTop: 16, marginHorizontal: GUTTER, height: SEARCH_H, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
        ]}
      >
        <Icon name="search" size={22} color={BRAND_MUTED} strokeWidth={2.5} />
        <Label size={17} font="Figtree_500Medium" color={BRAND_MUTED} style={{ marginLeft: 10 }}>
          Search deals
        </Label>
      </View>
      <View style={{ position: 'absolute', left: GUTTER, top: CARD_TOP, gap: 10 }}>
        {DEALS.map((deal, i) => (
          <DealCard key={deal.business} deal={deal} faceStyle={i === 0 ? sink : undefined} />
        ))}
      </View>
    </View>
  );
}

// CouponThumbnail at its real size
function DealCard({ deal, faceStyle }: { deal: Deal; faceStyle?: StyleProp<ViewStyle> }) {
  const unlimited = deal.uses === 'Unlimited';
  return (
    <View style={{ width: CARD_W, height: CARD_H }}>
      <View
        style={{ position: 'absolute', top: SHADOW, left: SHADOW, right: -SHADOW, bottom: -SHADOW, borderRadius: RADIUS.card, backgroundColor: BRAND_INK }}
      />
      <Animated.View style={[surface(RADIUS.card), { flex: 1, flexDirection: 'row', overflow: 'hidden' }, faceStyle]}>
        <View style={{ width: CARD_PHOTO_W, backgroundColor: BRAND_LILAC, borderRightWidth: OUTLINE, borderRightColor: BRAND_INK }}>
          {deal.letter ? null : <Image source={BOBA} contentFit="cover" style={StyleSheet.absoluteFill} />}
          <Logo size={44} radius={12} letter={deal.letter} style={{ position: 'absolute', left: 8, bottom: 8 }} />
        </View>
        <View style={{ flex: 1, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 12 }}>
          <Label size={15} lineHeight={20} font="Figtree_700Bold" color={BRAND_MUTED}>
            {deal.business}
          </Label>
          <Display allowFontScaling={false} size={26} numberOfLines={2} style={{ marginTop: 4 }}>
            {deal.headline}
          </Display>
          <Label size={15} lineHeight={20} color={BRAND_MUTED} lines={2} style={{ flex: 1, marginTop: 5 }}>
            {deal.description}
          </Label>
          {/* UsesLeft: a limited count sits on a highlighter mark, Unlimited is green */}
          <View
            style={{
              marginTop: 8,
              alignSelf: 'flex-start',
              marginLeft: unlimited ? 0 : -6,
              paddingHorizontal: unlimited ? 0 : 6,
              borderRadius: 4,
              backgroundColor: unlimited ? 'transparent' : BRAND_YELLOW_SOFT,
            }}
          >
            <Label size={14} lineHeight={20} font="Figtree_700Bold" color={unlimited ? BRAND_GREEN : BRAND_INK}>
              {deal.uses}
            </Label>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function Scrim({ clock }: { clock: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: ramp(clock.value, T.sheetUp, 450) }));
  return <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: SCRIM }, style]} />;
}

// coupon-detail.tsx: the deal, then the redeemed state after "Use"
function Sheet({ clock, secondsLeft }: { clock: SharedValue<number>; secondsLeft: number }) {
  const slide = useAnimatedStyle(() => ({
    transform: [{ translateY: (SHEET_H + SHADOW) * (1 - arrive(clock.value, T.sheetUp, 450)) }],
  }));
  const dealStyle = useAnimatedStyle(() => ({ opacity: 1 - ramp(clock.value, T.allSet, 220) }));
  const allSetStyle = useAnimatedStyle(() => ({ opacity: ramp(clock.value, T.allSet + 220, 300) }));
  // Willie naps on the sheet's top edge while the cashier looks
  const napStyle = useAnimatedStyle(() => {
    const p = ramp(clock.value, T.allSet + 400, 350);
    return { opacity: p, transform: [{ translateY: 8 * (1 - p) }] };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: -OUTLINE,
          right: -OUTLINE,
          bottom: 0,
          height: SHEET_H,
          backgroundColor: BRAND_CREAM,
          borderTopLeftRadius: RADIUS.sheet,
          borderTopRightRadius: RADIUS.sheet,
          borderTopWidth: OUTLINE,
          borderLeftWidth: OUTLINE,
          borderRightWidth: OUTLINE,
          borderColor: BRAND_INK,
        },
        slide,
      ]}
    >
      <View style={{ alignItems: 'center', paddingTop: 10 - OUTLINE }}>
        <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: BRAND_INK }} />
      </View>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: GRABBER_H - OUTLINE }, dealStyle]}>
        <DealDetails clock={clock} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: GRABBER_H - OUTLINE }, allSetStyle]}>
        <AllSet clock={clock} secondsLeft={secondsLeft} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', right: 26, top: -67, width: 150, height: 104 }, napStyle]}>
        <Image source={NAPPING} contentFit="contain" style={{ width: 150, height: 104 }} />
      </Animated.View>
    </Animated.View>
  );
}

function DealDetails({ clock }: { clock: SharedValue<number> }) {
  const sink = useAnimatedStyle(() => {
    const p = press(clock.value, T.tapButton);
    return { transform: [{ translateX: SHADOW * p }, { translateY: SHADOW * p }] };
  });
  const expires = useMemo(
    () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    []
  );

  return (
    <View style={{ paddingHorizontal: GUTTER }}>
      {/* the photo, with the logo badge hanging 26 below it */}
      <View style={{ height: SHEET_PHOTO_H + 26 }}>
        <View style={[surface(20, BRAND_LILAC), { height: SHEET_PHOTO_H, overflow: 'hidden' }]}>
          <Image source={BOBA} contentFit="contain" style={{ position: 'absolute', right: 34, top: 8, bottom: -6, width: 84 }} />
        </View>
        <Logo size={64} radius={16} style={{ position: 'absolute', left: 14, top: SHEET_PHOTO_H - 38 }} />
      </View>
      <View style={{ marginTop: 12, marginHorizontal: 4 }}>
        <Label size={17} lineHeight={22} font="Figtree_700Bold" color={BRAND_MUTED}>
          {DEAL.business}
        </Label>
        <Display allowFontScaling={false} size={46} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ marginTop: 6, height: 44 }}>
          {DEAL.headline}
        </Display>
        <Label size={17} lineHeight={24} color={BRAND_MUTED} style={{ marginTop: 8 }}>
          {DEAL.description}
        </Label>
      </View>
      <Ticket style={{ marginTop: 18 }}>
        <TicketLine label="Expires" value={expires} />
        <TicketTear />
        <TicketLine label="Uses" value="2 of 2 uses left" />
      </Ticket>
      {/* PrimaryButton: sinks onto its shadow when tapped */}
      <View style={{ marginTop: 20, marginRight: SHADOW, marginBottom: SHADOW, height: BUTTON_H }}>
        <View
          style={{
            position: 'absolute',
            top: SHADOW,
            left: SHADOW,
            right: -SHADOW,
            bottom: -SHADOW,
            borderRadius: BUTTON_H / 2,
            backgroundColor: BRAND_INK,
          }}
        />
        <Animated.View style={[surface(BUTTON_H / 2, BRAND_YELLOW), { flex: 1, alignItems: 'center', justifyContent: 'center' }, sink]}>
          <Label size={18} font="Figtree_700Bold">
            Use this coupon
          </Label>
        </Animated.View>
      </View>
      <Label size={14} lineHeight={20} font="Figtree_500Medium" color={BRAND_MUTED} align="center" lines={2} style={{ marginTop: 10, marginHorizontal: 8 }}>
        Once used, the coupon stays valid for 2 minutes.
      </Label>
    </View>
  );
}

function TicketLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 }}>
      <Label size={15} font="Figtree_600SemiBold" color={BRAND_MUTED}>
        {label}
      </Label>
      <Label size={15} font="Figtree_700Bold">
        {value}
      </Label>
    </View>
  );
}

function AllSet({ clock, secondsLeft }: { clock: SharedValue<number>; secondsLeft: number }) {
  // drains in step with the countdown, like the real bar
  const drain = useAnimatedStyle(() => {
    const elapsed = Math.max(0, clock.value - T.timerStart);
    return { width: `${100 * (1 - elapsed / (REDEMPTION_SECONDS * 1000))}%` };
  });
  const redeemedAt = useMemo(() => {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return `${day}, ${time}`;
  }, []);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <View style={{ paddingHorizontal: GUTTER }}>
      <View style={{ alignSelf: 'center', marginTop: 6 }}>
        <View
          style={{ position: 'absolute', top: SHADOW_SM, left: SHADOW_SM, width: 68, height: 68, borderRadius: 34, backgroundColor: BRAND_INK }}
        />
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
      </View>
      <Display allowFontScaling={false} size={38} numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 16, textAlign: 'center' }}>
        You're all set!
      </Display>
      <Label size={16} lineHeight={22} color={BRAND_MUTED} align="center" lines={2} style={{ marginTop: 8, height: 44 }}>
        Show this screen to the cashier at{'\n'}
        <Text style={{ fontFamily: 'Figtree_700Bold', color: BRAND_INK }}>{DEAL.business}</Text>.
      </Label>
      <Ticket style={{ marginTop: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 18 }}>
          <Logo size={60} radius={14} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Display allowFontScaling={false} size={32} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {DEAL.headline}
            </Display>
            <Label size={15} lineHeight={20} color={BRAND_MUTED} style={{ marginTop: 4 }}>
              {DEAL.description}
            </Label>
          </View>
        </View>
        <TicketTear />
        <View style={{ paddingTop: 14, paddingHorizontal: 18, paddingBottom: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Label size={14} font="Figtree_600SemiBold" color={BRAND_MUTED}>
                Valid for
              </Label>
              <Display allowFontScaling={false} size={56} color={BRAND_GREEN} style={{ marginTop: 4, fontVariant: ['tabular-nums'] }}>
                {minutes}:{seconds}
              </Display>
            </View>
            <View style={{ alignItems: 'flex-end', paddingBottom: 6 }}>
              <Label size={14} font="Figtree_600SemiBold" color={BRAND_MUTED}>
                Redeemed
              </Label>
              <Label size={16} font="Figtree_700Bold">
                {redeemedAt}
              </Label>
            </View>
          </View>
          <View style={[surface(6), { marginTop: 10, height: 12, overflow: 'hidden' }]}>
            <Animated.View style={[{ height: '100%', backgroundColor: BRAND_GREEN, borderRightWidth: OUTLINE, borderRightColor: BRAND_INK }, drain]} />
          </View>
        </View>
      </Ticket>
      {/* DarkButton */}
      <View style={[surface(BUTTON_H / 2, BRAND_INK), { marginTop: 20, height: BUTTON_H, alignItems: 'center', justifyContent: 'center' }]}>
        <Label size={18} font="Figtree_700Bold" color={BRAND_CREAM}>
          Done
        </Label>
      </View>
    </View>
  );
}

// the system confirm from handleUseCoupon(), drawn the way iOS shows it
function ConfirmAlert({ clock, top }: { clock: SharedValue<number>; top: number }) {
  const dim = useAnimatedStyle(() => ({
    opacity: ramp(clock.value, T.alertIn, 220) * (1 - ramp(clock.value, T.allSet, 200)),
  }));
  const box = useAnimatedStyle(() => {
    const shown = ramp(clock.value, T.alertIn, 220);
    return {
      opacity: shown * (1 - ramp(clock.value, T.allSet, 200)),
      transform: [{ scale: 1.08 - 0.08 * shown }],
    };
  });
  const pressed = useAnimatedStyle(() => ({ opacity: press(clock.value, T.tapUse) }));

  return (
    <>
      {/* tinted ink rather than the system's grey, which turns the cream khaki */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(34, 16, 61, 0.22)' }, dim]} />
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: (SCREEN_W - ALERT_W) / 2,
            top,
            width: ALERT_W,
            height: ALERT_H,
            borderRadius: 14,
            backgroundColor: ALERT_FILL,
            overflow: 'hidden',
          },
          box,
        ]}
      >
        <View style={{ flex: 1, alignItems: 'center', paddingTop: 19, paddingHorizontal: 16 }}>
          <Text allowFontScaling={false} style={{ fontSize: 17, lineHeight: 22, fontWeight: '600', color: '#000' }}>
            Use Coupon
          </Text>
          <View style={{ height: 48, marginTop: 2, justifyContent: 'center' }}>
            <Text allowFontScaling={false} numberOfLines={3} style={{ fontSize: 13, lineHeight: 16, textAlign: 'center', color: '#000' }}>
              Are you sure you want to use this coupon? This action cannot be undone.
            </Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: ALERT_LINE }} />
        <View style={{ height: ALERT_BUTTON_H, flexDirection: 'row' }}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text allowFontScaling={false} style={{ fontSize: 17, fontWeight: '600', color: ALERT_BLUE }}>
              Cancel
            </Text>
          </View>
          <View style={{ width: 1, backgroundColor: ALERT_LINE }} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.1)' }, pressed]} />
            <Text allowFontScaling={false} style={{ fontSize: 17, color: ALERT_BLUE }}>
              Use
            </Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
}
