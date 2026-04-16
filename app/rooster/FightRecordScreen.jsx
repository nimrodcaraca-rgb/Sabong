import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/theme';

export default function FightRecordScreen({ route, navigation }) {
  const { roosterId } = route.params;
  const [loading, setLoading] = useState(false);
  const [fightDate, setFightDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [venue, setVenue] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const [opponentBloodline, setOpponentBloodline] = useState('');
  const [result, setResult] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    if (!result) { Alert.alert('Required', 'Please select a result.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('fight_records').insert({
        rooster_id: roosterId,
        fight_date: fightDate.toISOString().split('T')[0],
        venue: venue.trim() || null,
        opponent_name: opponentName.trim() || null,
        opponent_bloodline: opponentBloodline.trim() || null,
        result,
        duration_minutes: duration ? parseInt(duration) : null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      Alert.alert('Saved! ⚔️', 'Fight record added.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      <Text style={styles.sectionTitle}>FIGHT DATE</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
        <Text style={styles.inputText}>{fightDate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker value={fightDate} mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(e, d) => { setShowDate(false); if (d) setFightDate(d); }} />
      )}

      <Text style={styles.sectionTitle}>RESULT</Text>
      <View style={styles.resultRow}>
        {[
          { label: '🏆 WIN', value: 'Win', color: COLORS.gold },
          { label: '💀 LOSS', value: 'Loss', color: COLORS.red },
          { label: '🤝 DRAW', value: 'Draw', color: COLORS.textmuted },
        ].map(({ label, value, color }) => (
          <TouchableOpacity key={value}
            style={[styles.resultBtn, result === value && { borderColor: color, backgroundColor: `${color}22` }]}
            onPress={() => setResult(value)}>
            <Text style={[styles.resultBtnText, result === value && { color }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>OPPONENT</Text>
      <Text style={styles.label}>Opponent Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Battle King"
        placeholderTextColor={COLORS.textmuted} value={opponentName} onChangeText={setOpponentName} />

      <Text style={styles.label}>Opponent Bloodline</Text>
      <TextInput style={styles.input} placeholder="e.g. Kelso"
        placeholderTextColor={COLORS.textmuted} value={opponentBloodline} onChangeText={setOpponentBloodline} />

      <Text style={styles.sectionTitle}>DETAILS</Text>
      <Text style={styles.label}>Venue</Text>
      <TextInput style={styles.input} placeholder="e.g. Araneta Coliseum"
        placeholderTextColor={COLORS.textmuted} value={venue} onChangeText={setVenue} />

      <Text style={styles.label}>Duration (minutes)</Text>
      <TextInput style={styles.input} placeholder="e.g. 15"
        placeholderTextColor={COLORS.textmuted} value={duration}
        onChangeText={setDuration} keyboardType="number-pad" />

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.textarea]}
        placeholder="Additional notes..."
        placeholderTextColor={COLORS.textmuted}
        value={notes} onChangeText={setNotes}
        multiline numberOfLines={3} textAlignVertical="top" />

      <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]}
        onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.black} />
          : <Text style={styles.saveBtnText}>SAVE FIGHT RECORD ⚔️</Text>}
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
  resultRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  resultBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: COLORS.darkgray, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  resultBtnText: { color: COLORS.textlight, fontWeight: '800', fontSize: 13 },
  saveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 12,
    padding: 18, alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: COLORS.black, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});