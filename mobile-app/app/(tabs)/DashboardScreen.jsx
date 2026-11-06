import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Image
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useRoosters } from '../../hooks/useRoosters';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { COLORS } from '../../constants/theme';
import { AntDesign, Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { roosters, loading, fetchRoosters, getStats } = useRoosters();
  const { runSync, syncing, pendingCount } = useOfflineSync(user);
  const stats = getStats();

  useFocusEffect(
    useCallback(() => {
      fetchRoosters();
    }, [])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRecentRoosters = () => roosters.slice(0, 3);

  const getLastWeight = (rooster) => {
    const logs = rooster.measurement_logs;
    if (!logs || logs.length === 0) return '—';
    const sorted = [...logs].sort((a, b) =>
      new Date(b.logged_at) - new Date(a.logged_at));
    return `${sorted[0].weight_kg} kg`;
  };

  const getWinLoss = (rooster) => {
    const fights = rooster.fight_records || [];
    const wins = fights.filter(f => f.result === 'Win').length;
    const losses = fights.filter(f => f.result === 'Loss').length;
    return { wins, losses };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={fetchRoosters}
          tintColor={COLORS.gold}
        />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {user?.user_metadata?.full_name?.split(' ')[0] || 'Manok Master'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={runSync}
            style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
            disabled={syncing}
          >
            <Ionicons name="sync" size={18} color={COLORS.textmuted} />
            {pendingCount > 0 && (
              <View style={styles.syncBadge}>
                <Text style={styles.syncBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={styles.signOutBtn}
          >
            <AntDesign name="user" size={20} color={COLORS.textmuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Stable Banner ── */}
      <View style={styles.banner}>
        <View style={styles.bannerGlow} />
        <Image
          source={require('../../assets/sabong_favicon.png')}
          style={styles.bannerIcon}
          resizeMode="contain"
        />
        <View style={styles.bannerText}>
          <Text style={styles.bannerLabel}>YOUR STABLE</Text>
          <Text style={styles.bannerTitle}>
            {stats.total} Rooster{stats.total !== 1 ? 's' : ''} Registered
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddRooster')}
        >
          <Feather name="plus" size={18} color={COLORS.black} />
        </TouchableOpacity>
      </View>

      {/* ── Stats Row ── */}
      <Text style={styles.sectionTitle}>STABLE OVERVIEW</Text>
      <View style={styles.statsGrid}>
        <StatCard
          label="Roosters"
          value={stats.total}
          icon={(
            <Image
              source={require('../../assets/sabong_favicon.png')}
              style={{
                width: 20,
                height: 20,
                tintColor: COLORS.textmuted,
              }}
              resizeMode="contain"
            />
          )}
        />
        <StatCard
          label="Total Wins"
          value={stats.wins}
          icon={<Ionicons name="trophy-outline" size={20} color={COLORS.gold} />}
        />
        <StatCard
          label="Total Losses"
          value={stats.losses}
          icon={<Ionicons name="skull-outline" size={20} color={COLORS.red} />}
          valueColor={COLORS.red}
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          icon={<Ionicons name="stats-chart" size={20} color={stats.winRate >= 50 ? COLORS.gold : COLORS.red} />}
          valueColor={stats.winRate >= 50 ? COLORS.gold : COLORS.red}
        />
      </View>

      {/* ── Needs Attention ── */}
      {stats.needsAttention > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => navigation.navigate('Health')}
          activeOpacity={0.8}
        >
          <View style={styles.alertIconWrap}>
            <Ionicons name="warning-outline" size={20} color="#FFA500" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Needs Attention</Text>
            <Text style={styles.alertSub}>
              {stats.needsAttention} rooster{stats.needsAttention !== 1 ? 's' : ''} not logged in 7+ days
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color={COLORS.gold} />
        </TouchableOpacity>
      )}

      {/* ── Recent Roosters ── */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>RECENT ROOSTERS</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Roosters')}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      {roosters.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Image
              source={require('../../assets/sabong_favicon.png')}
              style={{
                width: 36,
                height: 36,
                tintColor: COLORS.border,
              }}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.emptyTitle}>No Roosters Yet</Text>
          <Text style={styles.emptySub}>Add your first rooster to get started</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => navigation.navigate('AddRooster')}
          >
            <Feather name="plus" size={14} color={COLORS.black} style={{ marginRight: 6 }} />
            <Text style={styles.emptyBtnText}>Add Rooster</Text>
          </TouchableOpacity>
        </View>
      ) : (
        getRecentRoosters().map((rooster) => {
          const { wins, losses } = getWinLoss(rooster);
          const weight = getLastWeight(rooster);
          return (
            <TouchableOpacity
              key={rooster.id}
              style={styles.roosterCard}
              onPress={() => navigation.navigate('RoosterDetail', { roosterId: rooster.id })}
              activeOpacity={0.75}
            >
              {/* Photo */}
              <View style={styles.roosterPhoto}>
                {rooster.photo_url ? (
                  <Image source={{ uri: rooster.photo_url }} style={styles.roosterImg} />
                ) : (
                  <Image
                    source={require('../../assets/sabong_favicon.png')}
                    style={{
                      width: 28,
                      height: 28,
                      tintColor: COLORS.border,
                    }}
                    resizeMode="contain"
                  />
                )}
              </View>

              {/* Info */}
              <View style={styles.roosterInfo}>
                <Text style={styles.roosterName}>{rooster.name}</Text>
                <Text style={styles.roosterBloodline}>
                  {rooster.bloodline || 'Unknown Bloodline'}
                </Text>
                <View style={styles.roosterMeta}>
                  <View style={styles.metaChip}>
                    <Ionicons name="scale-outline" size={11} color={COLORS.textmuted} />
                    <Text style={styles.metaText}>{weight}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <MaterialCommunityIcons name="sword-cross" size={11} color={COLORS.textmuted} />
                    <Text style={styles.metaText}>{wins}W · {losses}L</Text>
                  </View>
                </View>
              </View>

              {/* Pen + Chevron */}
              <View style={styles.roosterRight}>
                <View style={styles.penBadge}>
                  <Text style={styles.penText}>
                    {rooster.pens?.name || 'No Pen'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color={COLORS.border} style={{ marginTop: 8 }} />
              </View>
            </TouchableOpacity>
          );
        })
      )}

      {/* ── Quick Actions ── */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.quickActions}>
        <QuickAction
          icon={<Ionicons name="medkit-outline" size={24} color={COLORS.gold} />}
          label="Log Health"
          onPress={() => navigation.navigate('Health')}
        />
        <QuickAction
          icon={<Ionicons name="bar-chart-outline" size={24} color={COLORS.gold} />}
          label="Analytics"
          onPress={() => navigation.navigate('Analytics')}
        />
        <QuickAction
          icon={<Feather name="plus-circle" size={24} color={COLORS.gold} />}
          label="Add Rooster"
          onPress={() => navigation.navigate('AddRooster')}
        />
        <QuickAction
          icon={<MaterialCommunityIcons name="sword-cross" size={24} color={COLORS.gold} />}
          label="Fight Record"
          onPress={() => navigation.navigate('Roosters')}
        />
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

/* ────────────────────────────────────── Sub-components ── */

const StatCard = ({ label, value, icon, valueColor }) => (
  <View style={styles.statCard}>
    <View style={styles.statIconWrap}>{icon}</View>
    <Text style={[styles.statValue, valueColor && { color: valueColor }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickAction = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
    <View style={styles.quickIconWrap}>{icon}</View>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

/* ────────────────────────────────────────────── Styles ── */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },
  content: { padding: 20, paddingTop: 56 },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: { gap: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 12, color: COLORS.textmuted, letterSpacing: 1, textTransform: 'uppercase' },
  userName: { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  syncBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.gray,
  },
  syncBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  syncBadgeText: { color: COLORS.black, fontSize: 10, fontWeight: '800' },
  signOutBtn: {
    backgroundColor: COLORS.darkgray,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkred,
    borderRadius: 16,
    padding: 18,
    marginBottom: 28,
    gap: 14,
    borderWidth: 1,
    borderColor: '#9B1D1D',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerGlow: {
    position: 'absolute',
    top: -30,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212,175,55,0.08)',
  },
  bannerIcon: { width: 44, height: 44 },
  bannerText: { flex: 1, gap: 3 },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
  },
  bannerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
  addBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    padding: 10,
  },

  // Section titles
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textmuted,
    letterSpacing: 2.5,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  seeAll: { fontSize: 12, color: COLORS.gold, fontWeight: '700', letterSpacing: 0.3 },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: COLORS.darkgray,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  statIconWrap: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -1,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textmuted,
    textAlign: 'center',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Alert
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#130800',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#5C2E00',
    gap: 12,
  },
  alertIconWrap: {
    backgroundColor: 'rgba(255,165,0,0.12)',
    borderRadius: 8,
    padding: 8,
  },
  alertTitle: { fontSize: 13, fontWeight: '800', color: '#FFA500', letterSpacing: 0.2 },
  alertSub: { fontSize: 12, color: COLORS.textmuted, marginTop: 2 },

  // Rooster cards
  roosterCard: {
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
  roosterPhoto: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roosterImg: { width: 58, height: 58 },
  roosterInfo: { flex: 1, gap: 3 },
  roosterName: { fontSize: 15, fontWeight: '800', color: COLORS.white, letterSpacing: -0.2 },
  roosterBloodline: { fontSize: 11, color: COLORS.gold, fontWeight: '600', letterSpacing: 0.3 },
  roosterMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray,
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  metaText: { fontSize: 10, color: COLORS.textmuted, fontWeight: '600' },
  roosterRight: { alignItems: 'flex-end' },
  penBadge: {
    backgroundColor: COLORS.muted,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  penText: { fontSize: 10, color: COLORS.textlight, fontWeight: '700', letterSpacing: 0.3 },

  // Empty state
  emptyCard: {
    backgroundColor: COLORS.darkgray,
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  emptyIconWrap: {
    backgroundColor: COLORS.gray,
    borderRadius: 50,
    padding: 20,
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
  emptySub: { fontSize: 13, color: COLORS.textmuted, textAlign: 'center', marginBottom: 12 },
  emptyBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyBtnText: { color: COLORS.black, fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

  // Quick actions
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  quickAction: {
    backgroundColor: COLORS.darkgray,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  quickIconWrap: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 10,
    padding: 10,
  },
  quickLabel: {
    fontSize: 11,
    color: COLORS.textlight,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});