import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking } from 'react-native';
import SettingsRow from '@/components/ui/SettingsRow';
import Toggle from '@/components/ui/Toggle';
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

export default function NearbyAlertsToggle({ divider }: { divider?: boolean }) {
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
        <SettingsRow
            icon="location"
            label="Nearby deal alerts"
            note="Get a heads-up when you walk past a spot with a deal"
            divider={divider}
            right={
                <Toggle
                    value={enabled}
                    onValueChange={onToggle}
                    disabled={busy}
                    accessibilityLabel="Nearby deal alerts"
                    accessibilityHint="Notifies you when you walk past a spot with a deal"
                />
            }
        />
    );
}
