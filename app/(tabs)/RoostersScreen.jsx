import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Image, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRoosters } from '../../hooks/useRoosters';
import { COLORS } from '../../constants/theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RoostersScreen({ navigation }) {
  const { roosters, loading, fetchRoosters } = useRoosters();
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => { fetchRoosters(); }, []));

  const filtered = roosters.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.bloodline || '').toLowerCase().includes(search.toLowerCase())
  );

  const getWinLoss = (r) => {
    const fights = r.fight_records || [];
    const w = fights.filter(f => f.result === 'Win').length;
    const l = fights.filter(f => f.result === 'Loss').length;
    return { w, l };
  };

  const getAge = (birthdate) => {
    if (!birthdate) return null;
    const months = (new Date().getFullYear() - new Date(birthdate).getFullYear()) * 12
      + (new Date().getMonth() - new Date(birthdate).getMonth());
    if (months < 12) return `${months}mo`;
    return `${Math.floor(months / 12)}y ${months % 12}mo`;
  };

  const getLastWeight = (r) => {
    const logs = r.measurement_logs;
    if (!logs?.length) return null;
    const sorted = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
    return `${sorted[0].weight_kg} kg`;
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Roosters</Text>
          <Text style={styles.headerSub}>
            {roosters.length} bird{roosters.length !== 1 ? 's' : ''} in your stable
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddRooster')}
        >
          <Feather name="plus" size={18} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={styles.searchBar}>
        <Feather name="search" size={15} color={COLORS.textmuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or bloodline..."
          placeholderTextColor={COLORS.textmuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Feather name="x" size={15} color={COLORS.textmuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── List ── */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchRoosters} tintColor={COLORS.gold} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Image
                source={require('../../assets/sabong_favicon.png')}
                style={{
                  width: 40,
                  height: 40,
                  tintColor: COLORS.border,
                }}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.emptyTitle}>No Roosters Found</Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search term' : 'Add your first rooster to get started'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('AddRooster')}
              >
                <Feather name="plus" size={14} color={COLORS.black} style={{ marginRight: 6 }} />
                <Text style={styles.emptyBtnText}>Add Rooster</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const { w, l } = getWinLoss(item);
          const age = getAge(item.birthdate);
          const weight = getLastWeight(item);
          const winRate = w + l > 0 ? Math.round((w / (w + l)) * 100) : null;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('RoosterDetail', { roosterId: item.id })}
              activeOpacity={0.75}
            >
              {/* Photo */}
              <View style={styles.cardPhoto}>
                {item.photo_url
                  ? <Image source={{ uri: item.photo_url }} style={styles.photo} />
                  : (
                    <Image
                      source={require('../../assets/sabong_favicon.png')}
                      style={{
                        width: 28,
                        height: 28,
                        tintColor: COLORS.border,
                      }}
                      resizeMode="contain"
                    />
                  )
                }
              </View>

              {/* Info */}
              <View style={styles.cardInfo}>
                <View style={styles.cardNameRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.is_pending && (
                    <View style={styles.pendingBadge}>
                      <Ionicons name="cloud-offline-outline" size={10} color={COLORS.gold} />
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                  {item.pens?.name && (
                    <View style={styles.penBadge}>
                      <Text style={styles.penText}>{item.pens.name}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.cardBloodline}>
                  {item.bloodline || 'Unknown Bloodline'}
                </Text>

                {/* Stat chips */}
                <View style={styles.cardMeta}>
                  {age && (
                    <View style={styles.chip}>
                      <Ionicons name="calendar-outline" size={10} color={COLORS.textmuted} />
                      <Text style={styles.chipText}>{age}</Text>
                    </View>
                  )}
                  {weight && (
                    <View style={styles.chip}>
                      <Ionicons name="scale-outline" size={10} color={COLORS.textmuted} />
                      <Text style={styles.chipText}>{weight}</Text>
                    </View>
                  )}
                  <View style={styles.chip}>
                    <MaterialCommunityIcons name="sword-cross" size={10} color={COLORS.textmuted} />
                    <Text style={styles.chipText}>{w}W · {l}L</Text>
                  </View>
                  {winRate !== null && (
                    <View style={[styles.chip, { backgroundColor: winRate >= 50 ? 'rgba(212,175,55,0.12)' : 'rgba(180,30,30,0.12)' }]}>
                      <Ionicons name="stats-chart" size={10} color={winRate >= 50 ? COLORS.gold : COLORS.red} />
                      <Text style={[styles.chipText, { color: winRate >= 50 ? COLORS.gold : COLORS.red }]}>
                        {winRate}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Chevron */}
              <Feather name="chevron-right" size={16} color={COLORS.border} />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: COLORS.darkgray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  headerSub: { fontSize: 12, color: COLORS.textmuted, marginTop: 3, letterSpacing: 0.3 },
  addBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    padding: 10,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkgray,
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    paddingVertical: 13,
    fontSize: 14,
  },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 4 },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkgray,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 14,
  },
  cardPhoto: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  photo: { width: 62, height: 62 },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -0.2,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.4)',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  pendingText: { fontSize: 9, color: COLORS.gold, fontWeight: '800', letterSpacing: 0.3 },
  penBadge: {
    backgroundColor: COLORS.darkred,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  penText: { fontSize: 9, color: COLORS.white, fontWeight: '700', letterSpacing: 0.4 },
  cardBloodline: {
    fontSize: 11,
    color: COLORS.gold,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipText: { fontSize: 10, color: COLORS.textmuted, fontWeight: '600' },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyIconWrap: {
    backgroundColor: COLORS.darkgray,
    borderRadius: 50,
    padding: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
  emptySub: { fontSize: 13, color: COLORS.textmuted, textAlign: 'center', marginBottom: 10 },
  emptyBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyBtnText: { color: COLORS.black, fontWeight: '900', fontSize: 13 },
});