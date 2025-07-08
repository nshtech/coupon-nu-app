import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors, { NU_PURPLE } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

import { TicketCheck, UserRound } from 'lucide-react-native';

export default function TabLayout() {
  // const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: NU_PURPLE,
        // Disable the static render of the header on web
        // to prevent a hydration error in React Navigation v6.
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Coupons',
          headerTitle: 'Coupon NU',
          tabBarIcon: ({ color }) => <TicketCheck size={28} color={color} />,
          headerRight: () => (
            <Link href="/modal" asChild>
              <Pressable>
                <FontAwesome
                  name="info-circle"
                  size={25}
                  color={'black'}
                  className="mr-[15px]"
                />
              </Pressable>
            </Link>
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'My Account',
          headerTitle: 'Coupon NU',
          tabBarIcon: ({ color }) => <UserRound size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
