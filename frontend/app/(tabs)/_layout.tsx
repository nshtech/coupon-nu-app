import React from 'react';
import { Tabs } from 'expo-router';

import {
  BRAND_CREAM_SOFT,
  BRAND_PURPLE,
  BRAND_PURPLE_SOFT,
  BRAND_TAN,
} from '@/constants/Colors';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

import { TicketCheck, UserRound } from 'lucide-react-native';

const headerOptions = {
  headerTitle: "Willie's Wallet",
  headerTitleAlign: 'center' as const,
  headerShadowVisible: false,
  headerStyle: { backgroundColor: BRAND_PURPLE },
  headerTitleStyle: {
    fontFamily: 'Fredoka_700Bold',
    fontSize: 26,
    color: '#ffffff',
  },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND_PURPLE,
        tabBarInactiveTintColor: BRAND_PURPLE_SOFT,
        tabBarStyle: {
          backgroundColor: BRAND_CREAM_SOFT,
          borderTopColor: BRAND_TAN,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Ubuntu_500Medium',
          fontSize: 12,
        },
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          ...headerOptions,
          title: 'My Coupons',
          tabBarIcon: ({ color }) => <TicketCheck size={26} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-account"
        options={{
          ...headerOptions,
          title: 'My Account',
          tabBarIcon: ({ color }) => <UserRound size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}
