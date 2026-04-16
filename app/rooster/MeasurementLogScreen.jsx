import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/theme';

export default function MeasurementLogScreen({ route, navigation }) {
  const { roosterId } = route.params;
  const [loading, setLoading] = useState(false);
  const [loggedAt, setLoggedAt] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [weight, setWeight] = useState('');
  const [wingspan, setWingspan] = useState('');
  const [height, setHeight] = useState('');
  const [legLength, setLegLength] = useState('');
  const [spurLength, setSpurLength] = useState('');
  const [bodyScore, setBodyScore] = useState('');
  const [featherCondition, setFeatherCondition] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('measurement_logs').insert({
        rooster_id: roosterId,
        logged_at: loggedAt.toISOString().split('T')[0],
        weight_kg: weight ? parseFloat(weight) : null,
        wingspan_cm: wingspan ? parseFloat(wingspan) : null,
        height_cm: height ? parseFloat(height) : null,
        leg_length_cm: legLength ? parseFloat(legLength) : null,
        spur_length_cm: spurLength ? parseFloat(spurLength) : null,
        body_condition_score: bodyScore ? parseInt(bodyScore) : null,
        feather_condition: featherCondition || null,
        notes: notes.trim() || null,
      });
      if (error) throw error;
      Alert.alert('Saved! 📏', 'Measurements logged successfully.', [
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

      <Text style={styles.sectionTitle}>DATE</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDate(true)}>
        <Text style={styles.inputText}>{loggedAt.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker value={loggedAt} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={new Date()}
          onChange={(e, d) => { setShowDate(false); if (d) setLoggedAt(d); }} />
      )}

      <Text style={styles.sectionTitle}>MEASUREMENTS</Text>
      {[
        { label: 'Weight (kg)', value: weight, set: setWeight, placeholder: 'e.g. 2.4' },
        { label: 'Wingspan (cm)', value: wingspan, set: setWingspan, placeholder: 'e.g. 65' },
        { label: 'Height (cm)', value: height, set: setHeight, placeholder: 'e.g. 45' },
        { label: 'Leg Length (cm)', value: legLength, set: setLegLength, placeholder: 'e.g. 12' },
        { label: 'Spur Length (cm)', value: spurLength, set: setSpurLength, placeholder: 'e.g. 3.2' },
      ].map(({ label, value, set, placeholder }) => (
        <View key={label}>
          <Text style={styles.label}>{label}</Text>
          <TextInput style={styles.input} placeholder={placeholder}
            placeholderTextColor={COLORS.textmuted} value={value}
            onChangeText={set} keyboardType="decimal-pad" />
        </View>
      ))}

      <Text style={styles.sectionTitle}>CONDITION</Text>
      <Text style={styles.label}>Body Condition Score (1–10)</Text>
      <View style={styles.scoreRow}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <TouchableOpacity key={n}
            style={[styles.scoreBtn, bodyScore === String(n) && styles.scoreBtnActive]}
            onPress={() => setBodyScore(String(n))}>
            <Text style={[styles.scoreBtnText, bodyScore === String(n) && styles.scoreBtnTextActive]}>
              {n}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Feather Condition</Text>
      <View style={styles.featherRow}>
        {['Good', 'Fair', 'Poor'].map(f => (
          <TouchableOpacity key={f}
            style={[styles.featherBtn, featherCondition === f && styles.featherBtnActive]}
            onPress={() => setFeatherCondition(f)}>
            <Text style={[styles.featherText, featherCondition === f && styles.featherTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput style={[styles.input, styles.textarea]}
        placeholder="Additional observations..."
        placeholderTextColor={COLORS.textmuted}
        value={notes} onChangeText={setNotes}
        multiline numberOfLines={3} textAlignVertical="top" />

      <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.6 }]}
        onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.black} />
          : <Text style={styles.saveBtnText}>SAVE MEASUREMENTS</Text>}
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
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  scoreBtn: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: COLORS.darkgray, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  scoreBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  scoreBtnText: { color: COLORS.textlight, fontWeight: '700' },
  scoreBtnTextActive: { color: COLORS.black },
  featherRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  featherBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    backgroundColor: COLORS.darkgray, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  featherBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  featherText: { color: COLORS.textlight, fontWeight: '700' },
  featherTextActive: { color: COLORS.black },
  saveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 12,
    padding: 18, alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: COLORS.black, fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});