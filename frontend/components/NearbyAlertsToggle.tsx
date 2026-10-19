import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Switch, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { BRAND_CREAM, BRAND_PURPLE } from '@/constants/Colors';
import {
    disableNearbyAlerts,
    enableNearbyAlerts,
    EnableResult,
    isNearbyAlertsEnabled,
} from '@/utils/nearbyAlerts';

const DENIED_COPY: Record<Exclude<EnableResult, 'enabled'>, { title: string; message: string; settings: boolean }> = {
    'notifications-denied': {
        title: 'Notifications are off',
        message: "Turn on notifications for Willie's Wallet in Settings to get nearby deal alerts.",
        settings: true,
    },
    'location-denied': {
        title: 'Location is off',
        message: "Allow location for Willie's Wallet in Settings so Willie knows when you're near a deal.",
        settings: true,
    },
    'background-denied': {
        title: 'Set location to "Always"',
        message: 'Alerts work while the app is closed, so location needs to be set to "Always" in Settings. It never leaves your phone.',
        settings: true,
    },
    unavailable: {
        title: "Alerts aren't available",
        message: "This device can't watch for nearby deals right now. Try again later.",
        settings: false,
    },
};

export default function NearbyAlertsToggle() {
    const [enabled, setEnabled] = useState(false);
    const [busy, setBusy] = useState(false);
    // permission prompts bounce the app through inactive -> active; don't let
    // that refresh overwrite the result of an in-flight toggle
    const busyRef = useRef(false);

    const refresh = useCallback(() => {
        isNearbyAlertsEnabled().then((value) => {
            if (!busyRef.current) setEnabled(value);
        });
    }, []);

    // permissions can change in Settings while we're backgrounded
    useEffect(() => {
        refresh();
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') refresh();
        });
        return () => sub.remove();
    }, [refresh]);

    const onToggle = async (next: boolean) => {
        busyRef.current = true;
        setBusy(true);
        try {
            if (!next) {
                await disableNearbyAlerts();
                setEnabled(false);
                return;
            }

            const result = await enableNearbyAlerts();
            setEnabled(result === 'enabled');
            if (result !== 'enabled') {
                const copy = DENIED_COPY[result];
                Alert.alert(
                    copy.title,
                    copy.message,
                    copy.settings
                        ? [
                              { text: 'Not now', style: 'cancel' },
                              { text: 'Open Settings', onPress: () => Linking.openSettings() },
                          ]
                        : undefined,
                );
            }
        } catch (e) {
            console.error('Error toggling nearby alerts:', e);
            if (next) {
                setEnabled(false);
            } else {
                Alert.alert("Couldn't turn off nearby alerts", 'Please try again.');
            }
        } finally {
            busyRef.current = false;
            setBusy(false);
        }
    };

    return (
        <View className="mt-4 min-h-14 flex-row items-center rounded-card border border-brand-tan bg-white px-4 py-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-cream">
                <MapPin size={18} color={BRAND_PURPLE} />
            </View>
            <View className="ml-3 flex-1 pr-3">
                <Text className="font-body-medium text-base text-brand-ink">Nearby deal alerts</Text>
                <Text className="font-body text-xs text-brand-purple-soft">
                    Get a heads-up when you walk past a spot with a deal
                </Text>
            </View>
            <Switch
                value={enabled}
                onValueChange={onToggle}
                disabled={busy}
                trackColor={{ false: BRAND_CREAM, true: BRAND_PURPLE }}
                ios_backgroundColor={BRAND_CREAM}
                thumbColor="#fff"
                accessibilityLabel="Nearby deal alerts"
                accessibilityHint="Notifies you when you walk past a spot with a deal"
            />
        </View>
    );
}
