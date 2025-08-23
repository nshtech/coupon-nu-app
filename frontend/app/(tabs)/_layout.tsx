import React from 'react';
import { Tabs } from 'expo-router';

import { NU_PURPLE, PURPLE_80 } from '@/constants/Colors';
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
          headerTitleStyle: {
            fontFamily: 'Inter-Bold',
            fontSize: 32,
            color: PURPLE_80,
          },
          headerTitle: 'Purple Picks',
          tabBarIcon: ({ color }) => <TicketCheck size={28} color={color} />,


          // info icon in top header
          
          // headerRight: () => (
          //   <Link href="/modal" asChild>
          //     <Pressable>
          //       <FontAwesome
          //         name="info-circle"
          //         size={25}
          //         color={'black'}
          //         className="mr-[15px]"
          //       />
          //     </Pressable>
          //   </Link>
          // ),
        }}
      />
      <Tabs.Screen
        name="my-account"
        options={{
          title: 'My Account',
          headerTitleStyle: {
            fontFamily: 'Inter-Bold',
            fontSize: 32,
            color: PURPLE_80,
          },
          headerTitle: 'Purple Picks',
          tabBarIcon: ({ color }) => <UserRound size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
