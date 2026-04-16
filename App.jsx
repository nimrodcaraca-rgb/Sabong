import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // ✅ added
import { AuthProvider, useAuth } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import AuthNavigator from './navigation/AuthNavigator';
import { useNotifications } from './hooks/useNotifications';
import { COLORS } from './constants/theme';

function RootNavigator() {
  const { user, loading } = useAuth();
  const { registerForPushNotifications } = useNotifications();

  useEffect(() => {
    if (user) registerForPushNotifications();
  }, [user]);

  if (loading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: COLORS.black,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}