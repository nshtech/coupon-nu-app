// Background tasks must be defined before the app mounts, so iOS can deliver
// a geofence event after relaunching the app in the background.
import './utils/nearbyAlerts';
import 'expo-router/entry';
