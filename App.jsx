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
import OfflineBanner from './components/OfflineBanner';
import { useOfflineSync } from './hooks/useOfflineSync';
import Constants from 'expo-constants';

function RootNavigator() {
  const { user, loading } = useAuth();
  const { registerForPushNotifications } = useNotifications();
  const { isOnline, syncing, pendingCount } = useOfflineSync(user);
  const isExpoGo = Constants.appOwnership === 'expo';

  useEffect(() => {
    if (user && !isExpoGo) registerForPushNotifications();
  }, [user, isExpoGo]);

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

  return (
    <>
      <OfflineBanner
        isOnline={isOnline}
        syncing={syncing}
        pendingCount={pendingCount}
      />
      {user ? <AppNavigator /> : <AuthNavigator />}
    </>
  );
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