import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/theme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { createQueueItem, enqueueItem } from '../../lib/offlineQueue';
import { Ionicons } from '@expo/vector-icons';

export default function TrainingLogScreen({ route, navigation }) {
  const { roosterId } = route.params;
  const { isOnline } = useNetworkStatus();
  const [loading, setLoading] = useState(false);
  const [loggedAt, setLoggedAt] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [sessionType, setSessionType] = useState('');
  const [intensity, setIntensity] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!sessionType) { Alert.alert('Required', 'Please select a session type.'); return; }
    setLoading(true);
    try {
      const payload = {
        rooster_id: roosterId,
        logged_at: loggedAt.toISOString().split('T')[0],
        session_type: sessionType,
        intensity: intensity || null,
        duration_minutes: duration ? parseInt(duration) : null,
        notes: notes.trim() || null,
      };

      if (!isOnline) {
        await enqueueItem(createQueueItem('training:create', payload));
        Alert.alert('Saved Offline', 'Training log will sync when online.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      const { error } = await supabase.from('training_logs').insert(payload);
      if (error) throw error;
      Alert.alert('Saved', 'Training session logged.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      <Text style={styles.sectionTitle}>DATE</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
        <Text style={styles.inputText}>{loggedAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker value={loggedAt} mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(e, d) => { setShowDate(false); if (d) setLoggedAt(d); }} />
      )}

      <Text style={styles.sectionTitle}>SESSION TYPE</Text>
      <View style={styles.optionGrid}>
        {[
          { label: 'Conditioning', value: 'Conditioning', icon: 'barbell-outline' },
          { label: 'Sparring', value: 'Sparring', icon: 'fitness-outline' },
          { label: 'Rest', value: 'Rest', icon: 'bed-outline' },
          { label: 'Other', value: 'Other', icon: 'list-outline' },
        ].map(({ label, value, icon }) => (
          <TouchableOpacity key={value}
            style={[styles.optionBtn, sessionType === value && styles.optionBtnActive]}
            onPress={() => setSessionType(value)}>
            <View style={styles.optionRow}>
              <Ionicons
                name={icon}
                size={14}
                color={sessionType === value ? COLORS.gold : COLORS.textlight}
              />
              <Text style={[styles.optionText, sessionType === value && styles.optionTextActive]}>
                {label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>INTENSITY</Text>
      <View style={styles.intensityRow}>
        {[
          { label: 'Low', color: '#22C55E' },
          { label: 'Medium', color: '#F59E0B' },
          { label: 'High', color: COLORS.red },
        ].map(({ label, color }) => (
          <TouchableOpacity key={label}
            style={[styles.intensityBtn, intensity === label && { borderColor: color, backgroundColor: `${color}22` }]}
            onPress={() => setIntensity(label)}>
            <Text style={[styles.intensityText, intensity === label && { color }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>DETAILS</Text>
      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput style={styles.input} placeholder="e.g. 30"
        placeholderTextColor={COLORS.textmuted} value={duration}
        onChangeText={setDuration} keyboardType="number-pad" />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.textarea]}
        placeholder="Training observations, performance notes..."
        placeholderTextColor={COLORS.textmuted}
        value={notes} onChangeText={setNotes}
        multiline numberOfLines={3} textAlignVertical="top" />

      <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]}
        onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.black} />
          : <Text style={styles.saveBtnText}>SAVE TRAINING LOG</Text>}
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  content: { padding: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: COLORS.textmuted,
    letterSpacing: 2, marginBottom: 10, marginTop: 20,
  },
  label: { fontSize: 12, color: COLORS.textlight, fontWeight: '600', marginBottom: 6, letterSpacing: 1 },
  input: {
    backgroundColor: COLORS.darkgray, borderRadius: 10, padding: 14,
    color: COLORS.white, fontSize: 15, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  inputText: { color: COLORS.white, fontSize: 15 },
  textarea: { minHeight: 80 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  optionBtn: {
    width: '47%', padding: 14, borderRadius: 10,
    backgroundColor: COLORS.darkgray, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  optionBtnActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: COLORS.gold },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionText: { color: COLORS.textlight, fontWeight: '700', fontSize: 13 },
  optionTextActive: { color: COLORS.gold },
  intensityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  intensityBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: COLORS.darkgray, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  intensityText: { color: COLORS.textlight, fontWeight: '800' },
  saveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 12,
    padding: 18, alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: COLORS.black, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});