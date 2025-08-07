import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import colors from '../config/colors';

import { HapticTab } from '@/components/HapticTab';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
// import TabBarBackground from '@/components/ui/TabBarBackground';
// import { Colors } from '@/constants/Colors';
// import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
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
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: -4,
              },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              borderTopWidth: 0,
            },
            android: {
              backgroundColor: colors.secondary,
              elevation: 16,
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: -4,
              },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              borderTopWidth: 0,
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
        name="scan"
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
      {/* Explore Tab */}
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="ramen-dining" size={28} color={color} />
          ),
        }}
      />
      {/* Hide the old index and explore tabs */}
      <Tabs.Screen
        name="index"
        options={{
          href: null, // This hides the tab
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // This hides the tab
        }}
      />
    </Tabs>
  );
}
