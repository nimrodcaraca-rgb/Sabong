import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Image } from 'react-native';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Screens
import DashboardScreen from '../app/(tabs)/DashboardScreen';
import RoostersScreen from '../app/(tabs)/RoostersScreen';
import AddRoosterScreen from '../app/(tabs)/AddRoosterScreen';
import HealthScreen from '../app/(tabs)/HealthScreen';
import AnalyticsScreen from '../app/(tabs)/AnalyticsScreen';

const Tab = createBottomTabNavigator();

// 🔥 Reusable Tab Icon (Ionicons)
const TabIcon = ({ label, iconName, focused }) => {
  const color = focused ? COLORS.gold : COLORS.textmuted;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
      <Ionicons
        name={focused ? iconName : `${iconName}-outline`}
        size={24}
        color={color}
      />

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontSize: 10,
          marginTop: 4,
          color: color,
          fontWeight: focused ? '700' : '500',
          width: 65, // ✅ prevent wrapping
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </View>
  );
};

// 🔥 Custom Rooster Icon using your image
const RoosterIcon = ({ focused }) => {
  const color = focused ? COLORS.gold : COLORS.textmuted;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 8 }}>
      <Image
        source={require('../assets/sabong_favicon.png')}
        style={{
          width: 24,
          height: 24,
          tintColor: color, // 🔥 dynamic color like icons
        }}
        resizeMode="contain"
      />

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          fontSize: 10,
          marginTop: 4,
          color: color,
          fontWeight: focused ? '700' : '500',
          width: 65,
          textAlign: 'center',
        }}
      >
        Roosters
      </Text>
    </View>
  );
};

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
          height: 85,
          paddingBottom: 20,
        },
      }}
    >
      {/* Home */}
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon label="Home" iconName="home" focused={focused} />
          ),
        }}
      />

      {/* 🐓 Roosters (your custom icon) */}
      <Tab.Screen
        name="Roosters"
        component={RoostersScreen}
        options={{
          tabBarIcon: ({ focused }) => <RoosterIcon focused={focused} />,
        }}
      />

      {/* Add */}
      <Tab.Screen
        name="AddRooster"
        component={AddRoosterScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Add"
              iconName={focused ? 'add-circle' : 'add-circle'}
              focused={focused}
            />
          ),
        }}
      />

      {/* Health */}
      <Tab.Screen
        name="Health"
        component={HealthScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Health"
              iconName="medkit"
              focused={focused}
            />
          ),
        }}
      />

      {/* Analytics */}
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              label="Analytics"
              iconName="stats-chart"
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}