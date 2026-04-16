import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sabong', {
        name: 'Sabong Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
      });
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    setExpoPushToken(token);
    return token;
  };

  const scheduleVaccinationReminder = async (roosterName, vaccineName, dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    if (due <= now) return;

    // Remind 3 days before
    const reminderDate = new Date(due);
    reminderDate.setDate(reminderDate.getDate() - 3);
    if (reminderDate <= now) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Vaccination Due Soon',
        body: `${roosterName} is due for ${vaccineName} in 3 days.`,
        data: { type: 'vaccination' },
        channelId: 'sabong',
      },
      trigger: { date: reminderDate },
    });
  };

  const scheduleVetReminder = async (roosterName, nextVisitDate) => {
    const due = new Date(nextVisitDate);
    const now = new Date();
    if (due <= now) return;

    const reminderDate = new Date(due);
    reminderDate.setDate(reminderDate.getDate() - 1);
    if (reminderDate <= now) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Vet Visit Tomorrow',
        body: `${roosterName} has a scheduled vet visit tomorrow.`,
        data: { type: 'vet' },
        channelId: 'sabong',
      },
      trigger: { date: reminderDate },
    });
  };

  const scheduleInactivityAlert = async (roosterName, roosterId) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rooster Needs Attention',
        body: `${roosterName} has not been logged in over 7 days.`,
        data: { type: 'inactivity', roosterId },
        channelId: 'sabong',
      },
      trigger: { seconds: 60 * 60 * 24 * 7 },
    });
  };

  const scheduleDailyFeedingReminder = async (hour = 7, minute = 0) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Daily Feeding Reminder',
        body: 'Time to log your roosters feeding and supplements.',
        data: { type: 'feeding' },
        channelId: 'sabong',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  };

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  };

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification tapped:', response);
      });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return {
    expoPushToken,
    registerForPushNotifications,
    scheduleVaccinationReminder,
    scheduleVetReminder,
    scheduleInactivityAlert,
    scheduleDailyFeedingReminder,
    cancelAllNotifications,
  };
};