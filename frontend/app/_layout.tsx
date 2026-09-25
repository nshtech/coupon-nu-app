import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import LogInScreen from '@/components/LogInScreen';
import RestrictedDomainScreen from '@/components/RestrictedDomainScreen';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import * as WebBrowser from 'expo-web-browser';
import {
  Ubuntu_400Regular,
  Ubuntu_500Medium,
  Ubuntu_700Bold,
} from '@expo-google-fonts/ubuntu';
import {
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';

import { useColorScheme } from '@/components/useColorScheme';
import { BRAND_CREAM_SOFT, BRAND_INK, BRAND_PURPLE, BRAND_TAN } from '@/constants/Colors';

import "./../global.css"
import { UsageProvider } from '@/contexts/UsageContext';

import ConfigureRevenueCat from '@/utils/RevenueCat.js';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();


export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // body — Aileron stand-in from the style sheet's Ubuntu fallback
    Ubuntu_400Regular,
    Ubuntu_500Medium,
    Ubuntu_700Bold,
    // display — TT Masters stand-in
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    ...FontAwesome.font,
  });



  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <UsageProvider>
          <ConfigureRevenueCat />
          <RootLayoutContent />
        </UsageProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

function RootLayoutContent() {

  const { isLoggedIn, isNorthwesternUser } = useAuth();

   // return the login screen before rending the paywall
   if (!isLoggedIn) {
    return <LogInScreen />;
  }

  if (!isNorthwesternUser) {
    return <RestrictedDomainScreen />;
  }

  // subscription (paywall) is now gated per-coupon in coupon-detail.tsx,
  // not globally here — logged-in Northwestern users can browse the list freely.
  return <RootLayoutNav />;
}


const BRAND_THEME = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: BRAND_PURPLE,
    background: BRAND_CREAM_SOFT,
    card: BRAND_CREAM_SOFT,
    text: BRAND_INK,
    border: BRAND_TAN,
  },
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
      <ThemeProvider value={BRAND_THEME}>
        <StatusBar style="dark" />
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{ contentStyle: { backgroundColor: BRAND_CREAM_SOFT } }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="coupon-detail" options={{ headerShown: false }} />
          {/* <Stack.Screen name="modal" options={{ presentation: 'modal' }} /> */}
        </Stack>
      </ThemeProvider>
  );
}
