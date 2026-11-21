import { Platform } from 'react-native';
import { useEffect } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export default function ConfigureRevenueCat() {
  useEffect(() => {
    // verbose SDK logs (receipts, customer info) only in development builds
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);

    // Platform-specific API keys
    const iosApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
    const androidApiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;

    if (Platform.OS === 'ios') {
       Purchases.configure({apiKey: iosApiKey});
    } else if (Platform.OS === 'android') {
       Purchases.configure({apiKey: androidApiKey});
    }
  }, []);
  return null;
}
