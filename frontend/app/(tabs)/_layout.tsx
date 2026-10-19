import React from 'react';
import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';

import {
  BRAND_CREAM_SOFT,
  BRAND_PURPLE,
  BRAND_PURPLE_SOFT,
  BRAND_TAN,
} from '@/constants/Colors';

import { Compass, Heart, TicketCheck, UserRound } from 'lucide-react-native';

// Each tab draws its own BrandHeader, so the navigator header stays hidden.
export default function TabLayout() {
  return (
    <Tabs
      // tick only when the tab actually changes, not on a re-tap of the current one
      screenListeners={({ navigation }) => ({
        tabPress: () => {
          if (!navigation.isFocused()) Haptics.selectionAsync().catch(() => {});
        },
      })}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BRAND_PURPLE,
        tabBarInactiveTintColor: BRAND_PURPLE_SOFT,
        tabBarStyle: {
          backgroundColor: BRAND_CREAM_SOFT,
          borderTopColor: BRAND_TAN,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Fredoka_500Medium',
          fontSize: 11,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <Compass size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="used"
        options={{
          title: 'Used',
          tabBarIcon: ({ color }) => <TicketCheck size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-account"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserRound size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
