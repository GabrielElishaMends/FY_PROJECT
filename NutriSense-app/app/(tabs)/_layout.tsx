import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import colors from '../config/colors';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
// import TabBarBackground from '@/components/ui/TabBarBackground';
// import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      initialRouteName="dash_board"
      screenOptions={{
        // tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarActiveTintColor: '#4CAF50',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        // tabBarBackground: TabBarBackground,
        tabBarStyle: {
          ...Platform.select({
            ios: {
              backgroundColor: colors.secondary,
              position: 'absolute',
            },
            android: {
              backgroundColor: colors.secondary,
            },
          }),
          height: 60,
        },
        tabBarIconStyle: {
          marginTop: 5,
        },
      }}
    >
      {/* Dashboard Tab - First Tab */}
      <Tabs.Screen
        name="dash_board"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="dashboard" size={28} color={color} />
          ),
        }}
      />
      {/* Food Scanner Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan Food',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="camera-alt" size={28} color={color} />
          ),
        }}
      />
      {/* Chatbot Tab - Center Button */}
      <Tabs.Screen
        name="chatbot"
        options={{
          title: 'Chatbot',
          tabBarIcon: ({ color }) => (
            <FontAwesome name="wechat" size={27} color={color} />
          ),
        }}
      />
      {/* Insights Tab */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarIcon: ({ color }) => (
            // <IconSymbol size={28} name="book.outline" color={color} />
            <MaterialIcons name="food-bank" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
