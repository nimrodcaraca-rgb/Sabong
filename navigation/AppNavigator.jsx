import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants/theme';
import TabNavigator from './TabNavigator';
import RoosterDetailScreen from '../app/rooster/RoosterDetailScreen';
import MeasurementLogScreen from '../app/rooster/MeasurementLogScreen';
import FightRecordScreen from '../app/rooster/FightRecordScreen';
import TrainingLogScreen from '../app/rooster/TrainingLogScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.darkgray },
        headerTintColor: COLORS.gold,
        headerTitleStyle: { color: COLORS.white, fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RoosterDetail"
        component={RoosterDetailScreen}
        options={{ title: 'Rooster Profile' }}
      />
      <Stack.Screen
        name="MeasurementLog"
        component={MeasurementLogScreen}
        options={{ title: 'Log Measurements' }}
      />
      <Stack.Screen
        name="FightRecord"
        component={FightRecordScreen}
        options={{ title: 'Fight Record' }}
      />
      <Stack.Screen
        name="TrainingLog"
        component={TrainingLogScreen}
        options={{ title: 'Training Log' }}
      />
    </Stack.Navigator>
  );
}