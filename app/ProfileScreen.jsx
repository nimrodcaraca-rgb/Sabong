import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  Switch, Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { COLORS } from '../constants/theme';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { cacheKeys, getCache, setCache } from '../lib/offlineStore';
import { createQueueItem, enqueueItem } from '../lib/offlineQueue';
import { Ionicons } from '@expo/vector-icons';

const T = {
  bg:      '#0E0E0F',
  surface: '#161618',
  surface2:'#1E1E21',
  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.13)',
  gold:    '#D4AF37',
  goldDim: 'rgba(212,175,55,0.11)',
  goldBorder: 'rgba(212,175,55,0.28)',
  white:   '#F5F4F0',
  sub:     '#9998A3',
  muted:   '#5C5B63',
  red:     '#E07070',
  redDim:  'rgba(220,60,60,0.10)',
  redBorder:'rgba(220,60,60,0.28)',
};

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { isOnline } = useNetworkStatus();
  const {
    scheduleDailyFeedingReminder,
    cancelAllNotifications,
    registerForPushNotifications,
    expoPushToken,
  } = useNotifications();

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [stableName, setStableName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Notification preferences
  const [feedingReminder, setFeedingReminder] = useState(false);
  const [feedingHour, setFeedingHour] = useState('7');
  const [notifSaving, setNotifSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    if (!isOnline) {
      const cached = await getCache(cacheKeys.profile(user.id));
      if (cached.data) {
        setProfile(cached.data);
        setFullName(cached.data.full_name || '');
        setStableName(cached.data.stable_name || '');
      }
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(data);
      setFullName(data.full_name || '');
      setStableName(data.stable_name || '');
      await setCache(cacheKeys.profile(user.id), data);
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Full name is required.');
      return;
    }
    setSaving(true);
    const updates = {
      full_name: fullName.trim(),
      stable_name: stableName.trim() || null,
    };

    if (!isOnline) {
      await enqueueItem(createQueueItem('profile:update', { updates }));
      await setCache(cacheKeys.profile(user.id), { ...profile, ...updates });
      setProfile((prev) => ({ ...prev, ...updates }));
      setSaving(false);
      Alert.alert('Saved Offline', 'Profile will sync when online.');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    setSaving(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      await setCache(cacheKeys.profile(user.id), { ...profile, ...updates });
      Alert.alert('Saved', 'Profile updated successfully.');
    }
  };

  const handleFeedingReminderToggle = async (val) => {
    setFeedingReminder(val);
    if (val) {
      await registerForPushNotifications();
      const hour = parseInt(feedingHour) || 7;
      await scheduleDailyFeedingReminder(hour, 0);
      Alert.alert('Reminder Set', `Daily feeding reminder set for ${hour}:00.`);
    } else {
      await cancelAllNotifications();
      Alert.alert('Reminder Cancelled', 'All scheduled notifications have been cancelled.');
    }
  };

  const handleUpdateFeedingTime = async () => {
    const hour = parseInt(feedingHour);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert('Invalid', 'Please enter a valid hour between 0 and 23.');
      return;
    }
    setNotifSaving(true);
    await scheduleDailyFeedingReminder(hour, 0);
    setNotifSaving(false);
    Alert.alert('Updated', `Feeding reminder updated to ${hour}:00 daily.`);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          await cancelAllNotifications();
          await signOut();
        }
      }
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently remove all your roosters and data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => Alert.alert('Contact Support', 'Please contact support to delete your account.')
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={T.gold} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      {/* Profile Header */}
      <View style={styles.profileHero}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>
            {(fullName || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.heroName}>{fullName || 'Your Name'}</Text>
        {stableName ? (
          <Text style={styles.heroStable}>{stableName}</Text>
        ) : null}
        <Text style={styles.heroEmail}>{user?.email}</Text>
      </View>

      {/* Profile Details */}
      <SectionHeader title="PROFILE DETAILS" />
      <View style={styles.card}>
        <FieldLabel>Full Name</FieldLabel>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor={T.muted}
          value={fullName}
          onChangeText={setFullName}
        />
        <FieldLabel>Stable Name</FieldLabel>
        <TextInput
          style={styles.input}
          placeholder="e.g. Cruz Fighting Farm"
          placeholderTextColor={T.muted}
          value={stableName}
          onChangeText={setStableName}
        />
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#0E0E0F" />
            : <Text style={styles.saveBtnText}>SAVE PROFILE</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Notification Settings */}
      <SectionHeader title="NOTIFICATIONS" />
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Daily Feeding Reminder</Text>
            <Text style={styles.settingSubLabel}>
              Get reminded to log your roosters feeding
            </Text>
          </View>
          <Switch
            value={feedingReminder}
            onValueChange={handleFeedingReminderToggle}
            trackColor={{ false: T.surface2, true: T.goldBorder }}
            thumbColor={feedingReminder ? T.gold : T.sub}
          />
        </View>

        {feedingReminder && (
          <>
            <View style={styles.divider} />
            <FieldLabel>Reminder Time (24h format, 0–23)</FieldLabel>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput]}
                placeholder="7"
                placeholderTextColor={T.muted}
                value={feedingHour}
                onChangeText={setFeedingHour}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.timeLabel}>:00 daily</Text>
              <TouchableOpacity
                style={[styles.updateBtn, notifSaving && { opacity: 0.6 }]}
                onPress={handleUpdateFeedingTime}
                disabled={notifSaving}
              >
                {notifSaving
                  ? <ActivityIndicator color="#0E0E0F" size="small" />
                  : <Text style={styles.updateBtnText}>Update</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}

        {expoPushToken ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.tokenLabel}>Push Token (debug)</Text>
            <Text style={styles.tokenText} numberOfLines={1} ellipsizeMode="middle">
              {expoPushToken}
            </Text>
          </>
        ) : null}
      </View>

      {/* App Info */}
      <SectionHeader title="APP INFO" />
      <View style={styles.card}>
        <InfoRow label="App Version" value="1.0.0" />
        <InfoRow label="Platform" value={Platform.OS === 'ios' ? 'iOS' : 'Android'} />
        <InfoRow label="Account" value={user?.email || '—'} />
        <InfoRow label="Member Since" value={
          user?.created_at
            ? new Date(user.created_at).toLocaleDateString('en-PH', {
                year: 'numeric', month: 'long', day: 'numeric'
              })
            : '—'
        } />
      </View>

      {/* Account Actions */}
      <SectionHeader title="ACCOUNT" />
      <View style={styles.card}>
        <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
          <Text style={styles.actionLabel}>Sign Out</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleDeleteAccount}>
          <Text style={[styles.actionLabel, { color: T.red }]}>Delete Account</Text>
          <Text style={[styles.actionArrow, { color: T.red }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Built with */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Ionicons name="egg-outline" size={14} color={T.gold} />
          <Text style={styles.footerText}>Built for sabongeros</Text>
        </View>
        <Text style={styles.footerSub}>Sabong Management System v1.0</Text>
      </View>

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const FieldLabel = ({ children }) => (
  <Text style={styles.fieldLabel}>{children}</Text>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  content: { padding: 16 },
  loading: {
    flex: 1, backgroundColor: T.bg,
    alignItems: 'center', justifyContent: 'center',
  },

  profileHero: {
    alignItems: 'center',
    paddingVertical: 28,
    marginBottom: 8,
  },
  avatarWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.goldDim,
    borderWidth: 2, borderColor: T.goldBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 32, fontWeight: '900', color: T.gold,
  },
  heroName: {
    fontSize: 22, fontWeight: '900', color: T.white,
    letterSpacing: -0.4,
  },
  heroStable: {
    fontSize: 14, color: T.gold,
    fontWeight: '600', marginTop: 4,
  },
  heroEmail: {
    fontSize: 13, color: T.muted, marginTop: 4,
  },

  sectionTitle: {
    fontSize: 10, fontWeight: '800', color: T.muted,
    letterSpacing: 2, marginBottom: 10, marginTop: 20,
    textTransform: 'uppercase',
  },

  card: {
    backgroundColor: T.surface, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    padding: 16, marginBottom: 4,
  },

  fieldLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.4,
    textTransform: 'uppercase', color: T.sub, marginBottom: 7,
  },
  input: {
    backgroundColor: T.surface2, borderRadius: 10,
    paddingHorizontal: 13, paddingVertical: 12,
    color: T.white, fontSize: 14,
    marginBottom: 16, borderWidth: 1, borderColor: T.border2,
  },
  saveBtn: {
    backgroundColor: T.gold, borderRadius: 10,
    padding: 14, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: {
    color: '#0E0E0F', fontWeight: '900',
    fontSize: 13, letterSpacing: 1.5,
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  settingLabel: {
    fontSize: 14, fontWeight: '700', color: T.white,
  },
  settingSubLabel: {
    fontSize: 12, color: T.muted, marginTop: 2,
  },
  divider: {
    height: 1, backgroundColor: T.border,
    marginVertical: 14,
  },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  timeInput: {
    width: 60, marginBottom: 0, textAlign: 'center',
  },
  timeLabel: {
    fontSize: 14, color: T.sub, fontWeight: '600',
  },
  updateBtn: {
    backgroundColor: T.gold, borderRadius: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    marginLeft: 'auto',
  },
  updateBtnText: {
    color: '#0E0E0F', fontWeight: '800', fontSize: 13,
  },
  tokenLabel: {
    fontSize: 10, color: T.muted,
    letterSpacing: 1, marginBottom: 4,
  },
  tokenText: {
    fontSize: 11, color: T.sub,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  infoLabel: { fontSize: 13, color: T.muted },
  infoValue: { fontSize: 13, color: T.white, fontWeight: '600' },

  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 12,
  },
  actionLabel: { fontSize: 14, color: T.white, fontWeight: '600' },
  actionArrow: { fontSize: 20, color: T.sub },

  footer: { alignItems: 'center', marginTop: 24, gap: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 13, color: T.muted, fontWeight: '600' },
  footerSub: { fontSize: 11, color: T.muted },
});