import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

export default function OfflineBanner({ isOnline, syncing, pendingCount }) {
  if (isOnline && pendingCount === 0) return null;

  const statusText = !isOnline
    ? 'Offline mode: changes will sync when online.'
    : syncing
      ? 'Syncing offline changes...'
      : `${pendingCount} item${pendingCount === 1 ? '' : 's'} pending sync.`;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.darkgray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  text: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
