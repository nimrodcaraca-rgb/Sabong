import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { COLORS } from '../constants/theme';

import DashboardScreen from '../app/(tabs)/DashboardScreen';
import RoostersScreen from '../app/(tabs)/RoostersScreen';
import AddRoosterScreen from '../app/(tabs)/AddRoosterScreen';
import HealthScreen from '../app/(tabs)/HealthScreen';
import AnalyticsScreen from '../app/(tabs)/AnalyticsScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ label, emoji, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
    <Text style={{ fontSize: 20 }}>{emoji}</Text>
    <Text style={{
      fontSize: 10,
      marginTop: 2,
      color: focused ? COLORS.gold : COLORS.textmuted,
      fontWeight: focused ? '700' : '400',
    }}>
      {label}
    </Text>
  </View>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: COLORS.darkgray,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Dashboard" emoji="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Roosters"
        component={RoostersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Roosters" emoji="🐓" focused={focused} /> }}
      />
      <Tab.Screen
        name="AddRooster"
        component={AddRoosterScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Add" emoji="➕" focused={focused} /> }}
      />
      <Tab.Screen
        name="Health"
        component={HealthScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Health" emoji="💊" focused={focused} /> }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Analytics" emoji="📊" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}