import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

// "Nearby deal alerts": a geofence around each partner business that fires a
// local notification naming the spot when the user walks within range. The OS
// does the watching (iOS region monitoring), so this works with the app closed
// and costs little battery. Nothing is sent to the backend.
//
// This file must be imported before the app renders (see index.js): when iOS
// relaunches the app in the background for a geofence event, the task below
// has to be defined at module load or the event is dropped.

// The task name is what iOS has registered for existing installs; keep it.
const GEOFENCE_TASK = 'downtown-evanston-geofence';
const ENABLED_KEY = 'nearbyAlerts.enabled';
const LAST_NOTIFIED_KEY = 'nearbyAlerts.lastNotifiedAt';
const PLACE_NOTIFIED_KEY = 'nearbyAlerts.placeNotifiedAt';
const REGIONS_VERSION_KEY = 'nearbyAlerts.regionsVersion';

// Bump whenever PLACES changes so installs that already monitor the old list
// re-register (see startGeofence).
const REGIONS_VERSION = 'places-v2';

const RADIUS_M = 150;

// iOS monitors at most 20 regions per app. Businesses within ~30 m of each
// other share one region, since their 150 m circles would fire together.
const PLACES: { id: string; name: string; latitude: number; longitude: number }[] = [
    { id: 'animal-records', name: 'Animal Records', latitude: 42.0451751, longitude: -87.6812705 },
    { id: 'chengdu-bistro', name: 'Chengdu Bistro', latitude: 42.0477928, longitude: -87.6807395 },
    { id: 'club-pilates', name: 'Club Pilates Evanston', latitude: 42.03173, longitude: -87.6787585 },
    { id: 'crave-cookies', name: 'Crave Cookies', latitude: 42.0485723, longitude: -87.6824842 },
    { id: 'curts-cafe', name: 'Curt’s Café', latitude: 42.064254, longitude: -87.715658 },
    { id: 'devil-dawgs', name: 'Devil Dawgs', latitude: 42.0486352, longitude: -87.6843724 },
    { id: 'eva-nails-papa-johns', name: 'Eva Nails & Papa Johns', latitude: 42.049795, longitude: -87.6830191 },
    { id: 'corner-bistro', name: 'Evanston Corner Bistro', latitude: 42.048551, longitude: -87.6809373 },
    { id: 'fridas-mt-everest', name: 'Frida’s & Mt. Everest Restaurant', latitude: 42.0479373, longitude: -87.6802328 },
    { id: 'gather', name: 'Gather: Consciously Curated', latitude: 42.0453728, longitude: -87.679897 },
    { id: 'la-cocinita', name: 'La Cocinita', latitude: 42.0461444, longitude: -87.6789539 },
    { id: 'land-and-lake', name: 'Land & Lake Cafe', latitude: 42.0490312, longitude: -87.680842 },
    { id: 'lock-chicago', name: 'Lock Chicago', latitude: 42.0628283, longitude: -87.698247 },
    { id: 'moge-tea', name: 'Moge Tea', latitude: 42.0465777, longitude: -87.68202 },
    { id: 'ovo-frito', name: 'Ovo Frito Cafe', latitude: 42.0534039, longitude: -87.6849628 },
    { id: 'pilates-connection-title-boxing', name: 'Pilates Connection & TITLE Boxing', latitude: 42.0473498, longitude: -87.6865152 },
    { id: 'reprise-coffee', name: 'Reprise Coffee Roasters', latitude: 42.0338459, longitude: -87.6810365 },
    { id: 'yofresh', name: 'YoFresh', latitude: 42.0303282, longitude: -87.677978 },
    { id: 'zoras-place', name: 'Zora’s Place', latitude: 42.0322366, longitude: -87.7052983 },
];

const REGIONS: Location.LocationRegion[] = PLACES.map((place) => ({
    identifier: place.id,
    latitude: place.latitude,
    longitude: place.longitude,
    radius: RADIUS_M,
    notifyOnEnter: true,
    notifyOnExit: false,
}));

// Students pass the same spots daily, so each one alerts at most once per
// window. Downtown spots sit a block apart, so a walk down Church St would
// otherwise fire several in a row; the global gap keeps that to one.
const PLACE_INTERVAL_MS = 12 * 60 * 60 * 1000;
const GLOBAL_INTERVAL_MS = 30 * 60 * 1000;

// Android 13+ only shows the notification permission prompt once a channel exists
const ANDROID_CHANNEL_ID = 'nearby-deals';

async function ensureAndroidChannel() {
    if (Platform.OS !== 'android') return;
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
        name: 'Nearby deals',
        importance: Notifications.AndroidImportance.DEFAULT,
    });
}

export type EnableResult =
    | 'enabled'
    | 'notifications-denied'
    | 'location-denied'
    | 'background-denied'
    | 'unavailable';

// show the banner even if the app is open when the user walks by
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
    }),
});

TaskManager.defineTask<{ eventType: Location.GeofencingEventType; region: Location.LocationRegion }>(
    GEOFENCE_TASK,
    async ({ data, error }) => {
        if (error) {
            console.error('[nearbyAlerts] geofence error:', error.message);
            return;
        }
        if (data?.eventType !== Location.GeofencingEventType.Enter) return;
        const place = PLACES.find((p) => p.id === data.region.identifier);
        if (!place) return;

        try {
            // the region can outlive the opt-in if stopping geofencing failed
            if ((await AsyncStorage.getItem(ENABLED_KEY)) !== 'true') return;

            const now = Date.now();
            const last = Number(await AsyncStorage.getItem(LAST_NOTIFIED_KEY)) || 0;
            if (now - last < GLOBAL_INTERVAL_MS) return;

            const perPlace: Record<string, number> = JSON.parse(
                (await AsyncStorage.getItem(PLACE_NOTIFIED_KEY)) ?? '{}',
            );
            if (now - (perPlace[place.id] ?? 0) < PLACE_INTERVAL_MS) return;

            perPlace[place.id] = now;
            await AsyncStorage.multiSet([
                [LAST_NOTIFIED_KEY, String(now)],
                [PLACE_NOTIFIED_KEY, JSON.stringify(perPlace)],
            ]);

            // a background launch may run before anything else created the channel
            await ensureAndroidChannel();
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: `Deal nearby: ${place.name} 🐾`,
                    body: 'Willie has a deal waiting for you. Open the app to save!',
                    data: { placeId: place.id },
                },
                trigger: Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : null,
            });
        } catch (e) {
            console.error('[nearbyAlerts] failed to notify:', e);
        }
    },
);

// Restarting geofencing makes iOS report regions the user is already inside
// as fresh entries, so only (re)register when nothing is running or the place
// list changed since the last registration.
async function startGeofence() {
    const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (started && (await AsyncStorage.getItem(REGIONS_VERSION_KEY)) === REGIONS_VERSION) return;
    await Location.startGeofencingAsync(GEOFENCE_TASK, REGIONS);
    await AsyncStorage.setItem(REGIONS_VERSION_KEY, REGIONS_VERSION);
}

// Walks the user through every permission the alert needs, in order:
// notifications, then location while in use, then "Always" location.
export async function enableNearbyAlerts(): Promise<EnableResult> {
    await ensureAndroidChannel();
    const notifications = await Notifications.requestPermissionsAsync();
    if (!notifications.granted) return 'notifications-denied';

    const foreground = await Location.requestForegroundPermissionsAsync();
    if (!foreground.granted) return 'location-denied';

    const background = await Location.requestBackgroundPermissionsAsync();
    if (!background.granted) return 'background-denied';

    try {
        await startGeofence();
    } catch (e) {
        console.error('[nearbyAlerts] could not start geofencing:', e);
        return 'unavailable';
    }

    await AsyncStorage.setItem(ENABLED_KEY, 'true');
    return 'enabled';
}

// Throws if the opt-in flag could not be removed, so callers can tell the user.
// A failure to stop geofencing is only logged: with the flag gone, the task
// ignores any region that is still being monitored.
export async function disableNearbyAlerts() {
    try {
        await AsyncStorage.multiRemove([ENABLED_KEY, REGIONS_VERSION_KEY]);
    } catch (e) {
        console.error('[nearbyAlerts] could not clear the opt-in:', e);
        throw e;
    }

    try {
        if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK)) {
            await Location.stopGeofencingAsync(GEOFENCE_TASK);
        }
    } catch (e) {
        console.error('[nearbyAlerts] could not stop geofencing:', e);
    }
}

// True only when the user opted in AND the permissions are still granted —
// either can be revoked from iOS Settings while the app is closed.
export async function isNearbyAlertsEnabled(): Promise<boolean> {
    try {
        if ((await AsyncStorage.getItem(ENABLED_KEY)) !== 'true') return false;

        const [notifications, background] = await Promise.all([
            Notifications.getPermissionsAsync(),
            Location.getBackgroundPermissionsAsync(),
        ]);
        if (!notifications.granted || !background.granted) return false;

        // the OS can drop monitored regions (e.g. after a reinstall); re-arm
        await startGeofence();
        return true;
    } catch (e) {
        console.error('[nearbyAlerts] status check failed:', e);
        return false;
    }
}
