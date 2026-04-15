import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Image, TouchableOpacity, Alert, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../constants/theme';

export default function RoosterDetailScreen({ route, navigation }) {
  const { roosterId } = route.params;
  const [rooster, setRooster] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRooster = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('roosters')
      .select(`
        *,
        pens (id, name, location),
        measurement_logs (*, logged_at),
        health_logs (*, logged_at),
        fight_records (*),
        vaccination_records (*),
        training_logs (*),
        vet_visits (*)
      `)
      .eq('id', roosterId)
      .single();
    if (!error) setRooster(data);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchRooster(); }, []));

  const handleDelete = () => {
    Alert.alert('Remove Rooster', `Remove ${rooster.name} from your stable?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await supabase.from('roosters').update({ is_active: false }).eq('id', roosterId);
          navigation.goBack();
        }
      }
    ]);
  };

  if (!rooster) return (
    <View style={styles.loading}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  const wins = rooster.fight_records?.filter(f => f.result === 'Win').length || 0;
  const losses = rooster.fight_records?.filter(f => f.result === 'Loss').length || 0;
  const draws = rooster.fight_records?.filter(f => f.result === 'Draw').length || 0;
  const totalFights = wins + losses + draws;
  const winRate = totalFights > 0 ? Math.round((wins / totalFights) * 100) : 0;

  const latestMeasurement = rooster.measurement_logs?.length
    ? [...rooster.measurement_logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0]
    : null;

  const getAge = () => {
    if (!rooster.birthdate) return 'Unknown';
    const months = (new Date().getFullYear() - new Date(rooster.birthdate).getFullYear()) * 12
      + (new Date().getMonth() - new Date(rooster.birthdate).getMonth());
    if (months < 12) return `${months} months`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y}y ${m}mo` : `${y} years`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRooster} tintColor={COLORS.gold} />}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroPhoto}>
          {rooster.photo_url
            ? <Image source={{ uri: rooster.photo_url }} style={styles.heroImg} />
            : <Text style={{ fontSize: 64 }}>🐓</Text>
          }
        </View>
        <Text style={styles.heroName}>{rooster.name}</Text>
        <Text style={styles.heroBloodline}>{rooster.bloodline || 'Unknown Bloodline'}</Text>
        {rooster.pens && (
          <View style={styles.penChip}>
            <Text style={styles.penChipText}>🏠 {rooster.pens.name}</Text>
          </View>
        )}
      </View>

      {/* Fight Stats */}
      <View style={styles.fightRow}>
        <StatBox value={wins} label="Wins" color={COLORS.gold} />
        <StatBox value={losses} label="Losses" color={COLORS.red} />
        <StatBox value={draws} label="Draws" color={COLORS.textmuted} />
        <StatBox value={`${winRate}%`} label="Win Rate" color={COLORS.gold} />
      </View>

      {/* Info Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PROFILE</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Age" value={getAge()} />
          <InfoRow label="Birthdate" value={rooster.birthdate
            ? new Date(rooster.birthdate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'Unknown'} />
          <InfoRow label="Breeder" value={rooster.breeder || 'Unknown'} />
          {rooster.pedigree_notes && (
            <InfoRow label="Pedigree" value={rooster.pedigree_notes} />
          )}
        </View>
      </View>

      {/* Latest Measurements */}
      {latestMeasurement && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LATEST MEASUREMENTS</Text>
          <View style={styles.infoCard}>
            {latestMeasurement.weight_kg && <InfoRow label="Weight" value={`${latestMeasurement.weight_kg} kg`} />}
            {latestMeasurement.wingspan_cm && <InfoRow label="Wingspan" value={`${latestMeasurement.wingspan_cm} cm`} />}
            {latestMeasurement.height_cm && <InfoRow label="Height" value={`${latestMeasurement.height_cm} cm`} />}
            {latestMeasurement.spur_length_cm && <InfoRow label="Spur Length" value={`${latestMeasurement.spur_length_cm} cm`} />}
            {latestMeasurement.body_condition_score && <InfoRow label="Body Condition" value={`${latestMeasurement.body_condition_score}/10`} />}
            {latestMeasurement.feather_condition && <InfoRow label="Feathers" value={latestMeasurement.feather_condition} />}
            <InfoRow label="Logged" value={new Date(latestMeasurement.logged_at).toLocaleDateString()} />
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <ActionBtn icon="📏" label="Log Measurements"
            onPress={() => navigation.navigate('MeasurementLog', { roosterId })} />
          <ActionBtn icon="⚔️" label="Add Fight Record"
            onPress={() => navigation.navigate('FightRecord', { roosterId })} />
          <ActionBtn icon="🏃" label="Training Log"
            onPress={() => navigation.navigate('TrainingLog', { roosterId })} />
          <ActionBtn icon="💊" label="Health Log"
            onPress={() => navigation.navigate('Health', { roosterId })} />
        </View>
      </View>

      {/* Fight History */}
      {rooster.fight_records?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FIGHT HISTORY</Text>
          {[...rooster.fight_records]
            .sort((a, b) => new Date(b.fight_date) - new Date(a.fight_date))
            .slice(0, 5)
            .map((fight) => (
              <View key={fight.id} style={styles.fightCard}>
                <View style={[styles.resultBadge, {
                  backgroundColor: fight.result === 'Win' ? COLORS.darkred
                    : fight.result === 'Loss' ? '#1A1A1A' : COLORS.muted
                }]}>
                  <Text style={[styles.resultText, {
                    color: fight.result === 'Win' ? COLORS.gold : COLORS.textlight
                  }]}>
                    {fight.result.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fightOpponent}>
                    vs {fight.opponent_name || 'Unknown'}
                  </Text>
                  <Text style={styles.fightMeta}>
                    {new Date(fight.fight_date).toLocaleDateString()} {fight.venue ? `· ${fight.venue}` : ''}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Danger Zone */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Remove from Stable</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const StatBox = ({ value, label, color }) => (
  <View style={styles.statBox}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ActionBtn = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  loading: { flex: 1, backgroundColor: COLORS.black, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: COLORS.gold, fontSize: 16 },
  hero: {
    alignItems: 'center', paddingVertical: 32,
    backgroundColor: COLORS.darkgray,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  heroPhoto: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.gray, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: COLORS.gold, marginBottom: 16,
  },
  heroImg: { width: 120, height: 120 },
  heroName: { fontSize: 26, fontWeight: '900', color: COLORS.white },
  heroBloodline: { fontSize: 14, color: COLORS.gold, marginTop: 4 },
  penChip: {
    backgroundColor: COLORS.darkred, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 10,
  },
  penChipText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  fightRow: {
    flexDirection: 'row', backgroundColor: COLORS.darkgray,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRightWidth: 1, borderRightColor: COLORS.border,
  },
  statValue: { fontSize: 22, fontWeight: '900' },
  statLabel: { fontSize: 10, color: COLORS.textmuted, marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800', color: COLORS.textmuted,
    letterSpacing: 2, marginBottom: 10,
  },
  infoCard: {
    backgroundColor: COLORS.darkgray, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.muted,
  },
  infoLabel: { fontSize: 13, color: COLORS.textmuted, flex: 1 },
  infoValue: { fontSize: 13, color: COLORS.white, fontWeight: '600', flex: 2, textAlign: 'right' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: {
    backgroundColor: COLORS.darkgray, borderRadius: 12,
    padding: 16, alignItems: 'center', width: '47%',
    borderWidth: 1, borderColor: COLORS.border,
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionLabel: { fontSize: 12, color: COLORS.textlight, fontWeight: '700', textAlign: 'center' },
  fightCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.darkgray, borderRadius: 10,
    padding: 12, marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  resultBadge: {
    borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 6, minWidth: 60, alignItems: 'center',
  },
  resultText: { fontSize: 12, fontWeight: '900' },
  fightOpponent: { fontSize: 14, fontWeight: '700', color: COLORS.white },
  fightMeta: { fontSize: 12, color: COLORS.textmuted, marginTop: 2 },
  deleteBtn: {
    borderWidth: 1, borderColor: COLORS.red,
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  deleteBtnText: { color: COLORS.red, fontWeight: '700', fontSize: 14 },
});