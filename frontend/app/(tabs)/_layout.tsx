import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRAND_CREAM, BRAND_INK, BRAND_MUTED, OUTLINE } from '@/constants/Colors';
import TabIcon, { TabIconName } from '@/components/ui/TabIcon';

const tabLabel = (label: string) =>
  function TabLabel({ focused }: { focused: boolean }) {
    return (
      <Text
        style={{
          marginTop: 2,
          fontFamily: focused ? 'Figtree_700Bold' : 'Figtree_600SemiBold',
          fontSize: 12,
          color: focused ? BRAND_INK : BRAND_MUTED,
        }}
      >
        {label}
      </Text>
    );
  };

const tabIcon = (name: TabIconName) =>
  function Icon({ focused }: { focused: boolean }) {
    return <TabIcon name={name} focused={focused} />;
  };

// Each tab draws its own BrandHeader, so the navigator header stays hidden.
export default function TabLayout() {
  const insets = useSafeAreaInsets();

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
        tabBarActiveTintColor: BRAND_INK,
        tabBarInactiveTintColor: BRAND_MUTED,
        tabBarStyle: {
          backgroundColor: BRAND_CREAM,
          borderTopColor: BRAND_INK,
          borderTopWidth: OUTLINE,
          height: 58 + insets.bottom,
          paddingTop: 8,
          // no blurred shadow above the bar, just the ink line
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarIconStyle: { width: 32, height: 28 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarLabel: tabLabel('Discover'),
          tabBarIcon: tabIcon('discover'),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarLabel: tabLabel('Saved'),
          tabBarIcon: tabIcon('saved'),
        }}
      />
      <Tabs.Screen
        name="used"
        options={{
          title: 'Used',
          tabBarLabel: tabLabel('Used'),
          tabBarIcon: tabIcon('used'),
        }}
      />
      <Tabs.Screen
        name="my-account"
        options={{
          title: 'Profile',
          tabBarLabel: tabLabel('Profile'),
          tabBarIcon: tabIcon('profile'),
        }}
      />
    </Tabs>
  );
}
