import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import Animated from 'react-native-reanimated';
import { BRAND_INK, BRAND_MUTED, OUTLINE } from '@/constants/Colors';
import { surface } from '@/components/ui/Raised';
import { useEntrance } from '@/components/onboarding/useEntrance';

// A preview of a nearby deal alert, shown before the real permission prompt so
// people see what they are agreeing to. It eases down like a banner with one
// light buzz. Copy mirrors the real alert in utils/nearbyAlerts.ts, minus the
// emoji. Not tappable, so it has no shadow.

export default function MockNotification({ delay = 0 }: { delay?: number }) {
  const entrance = useEntrance({ delay, y: -16 });

  useEffect(() => {
    const buzz = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), delay + 150);
    return () => clearTimeout(buzz);
  }, []);

  return (
    <Animated.View
      accessible
      accessibilityLabel="Example alert: Deal nearby, Moge Tea. Willie has a deal waiting for you."
      style={[surface(20), { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 }, entrance]}
    >
      <Image
        source={require('../../assets/images/icon.png')}
        style={{ width: 42, height: 42, borderRadius: 11, borderWidth: OUTLINE, borderColor: BRAND_INK }}
      />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 12, letterSpacing: 0.4, color: BRAND_MUTED }}>WILLIE’S WALLET</Text>
          <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 12, color: BRAND_MUTED }}>now</Text>
        </View>
        <Text numberOfLines={1} style={{ marginTop: 2, fontFamily: 'Figtree_700Bold', fontSize: 15, color: BRAND_INK }}>
          Deal nearby: Moge Tea
        </Text>
        <Text numberOfLines={2} style={{ fontFamily: 'Figtree_400Regular', fontSize: 14, lineHeight: 19, color: BRAND_MUTED }}>
          Willie has a deal waiting for you. Open the app to save!
        </Text>
      </View>
    </Animated.View>
  );
}
