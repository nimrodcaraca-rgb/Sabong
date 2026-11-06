import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  VictoryChart, VictoryLine, VictoryBar,
  VictoryAxis, VictoryTheme, VictoryScatter,
  VictoryPie
} from 'victory-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoosters } from '../../hooks/useRoosters';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { cacheKeys, getCache, setCache } from '../../lib/offlineStore';
import { Ionicons } from '@expo/vector-icons';

// ── Design Tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:         '#0A0A0B',
  surface:    '#111113',
  surface2:   '#18181B',
  surface3:   '#202024',
  border:     'rgba(255,255,255,0.06)',
  border2:    'rgba(255,255,255,0.10)',
  border3:    'rgba(255,255,255,0.16)',
  gold:       '#C9A84C',
  goldLight:  '#E2C97E',
  goldDim:    'rgba(201,168,76,0.09)',
  goldBorder: 'rgba(201,168,76,0.22)',
  white:      '#F0EDE8',
  sub:        '#8A8994',
  muted:      '#4E4D56',
  red:        '#D97070',
  teal:       '#45BF96',
  violet:     '#8B7EC8',
  gridLine:   'rgba(255,255,255,0.04)',
};

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { roosters, fetchRoosters, getStats } = useRoosters();
  const stats = getStats();

  const [loading, setLoading]                 = useState(false);
  const [activeTab, setActiveTab]             = useState('overview');
  const [selectedRooster, setSelectedRooster] = useState(null);
  const [weightData, setWeightData]           = useState([]);
  const [spurData, setSpurData]               = useState([]);
  const [wingspanData, setWingspanData]       = useState([]);
  const [fightData, setFightData]             = useState([]);

  useFocusEffect(useCallback(() => {
    fetchRoosters();
  }, [user]));

  useFocusEffect(useCallback(() => {
    if (roosters.length && !selectedRooster) {
      setSelectedRooster(roosters[0]);
    }
  }, [roosters]));

  const applyChartData = (measurements, fights) => {
    if (measurements?.length) {
      setWeightData(measurements
        .filter(m => m.weight_kg != null)
        .map((m, i) => ({ x: i + 1, y: parseFloat(m.weight_kg) }))
      );
      setSpurData(measurements
        .filter(m => m.spur_length_cm != null)
        .map((m, i) => ({ x: i + 1, y: parseFloat(m.spur_length_cm) }))
      );
      setWingspanData(measurements
        .filter(m => m.wingspan_cm != null)
        .map((m, i) => ({ x: i + 1, y: parseFloat(m.wingspan_cm) }))
      );
    } else {
      setWeightData([]); setSpurData([]); setWingspanData([]);
    }

    if (fights?.length) {
      const w = fights.filter(f => f.result === 'Win').length;
      const l = fights.filter(f => f.result === 'Loss').length;
      const d = fights.filter(f => f.result === 'Draw').length;
      setFightData([
        { x: 'W', y: w },
        { x: 'L', y: l },
        { x: 'D', y: d },
      ]);
    } else {
      setFightData([]);
    }
  };

  const fetchRoosterChartData = async (rooster) => {
    if (!rooster) return;
    setLoading(true);
    try {
      if (!isOnline) {
        const cachedMeasurements = await getCache(cacheKeys.measurements(rooster.id));
        const cachedFights = await getCache(cacheKeys.fights(rooster.id));
        applyChartData(cachedMeasurements.data || [], cachedFights.data || []);
        return;
      }

      const { data: measurements } = await supabase
        .from('measurement_logs')
        .select('logged_at, weight_kg, spur_length_cm, wingspan_cm')
        .eq('rooster_id', rooster.id)
        .order('logged_at', { ascending: true })
        .limit(20);

      const { data: fights } = await supabase
        .from('fight_records')
        .select('result')
        .eq('rooster_id', rooster.id);

      await setCache(cacheKeys.measurements(rooster.id), measurements || []);
      await setCache(cacheKeys.fights(rooster.id), fights || []);
      applyChartData(measurements || [], fights || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useFocusEffect(useCallback(() => {
    if (selectedRooster) fetchRoosterChartData(selectedRooster);
  }, [selectedRooster]));

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'growth',   label: 'Growth'   },
    { key: 'fights',   label: 'Fights'   },
  ];

  // Build stable wins bar data — only roosters with at least one win
  const stableWinsData = roosters
    .filter(r => r.fight_records?.some(f => f.result === 'Win'))
    .map(r => ({
      x: (r.name ?? 'Unknown').length > 7
        ? (r.name ?? 'Unknown').slice(0, 7) + '…'
        : (r.name ?? 'Unknown'),
      y: r.fight_records.filter(f => f.result === 'Win').length,
    }));

  return (
    <View style={styles.container}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Stable Analytics</Text>
        <Text style={styles.headerTitle}>Insights</Text>
        <Text style={styles.headerSub}>Performance and progress overview</Text>
      </View>

      {/* ── Tab Bar ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            activeOpacity={0.75}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchRoosterChartData(selectedRooster)}
            tintColor={T.gold}
          />
        }
      >

        {/* ════════ OVERVIEW TAB ════════ */}
        {activeTab === 'overview' && (
          <View style={styles.content}>
            <SectionLabel text="Stable Summary" />
            <View style={styles.statsGrid}>
              <StatCard label="Roosters" value={stats.total} />
              <StatCard label="Wins"     value={stats.wins}   accent={T.gold} />
              <StatCard label="Losses"   value={stats.losses} accent={T.red}  />
              <StatCard label="Win Rate" value={`${stats.winRate}%`}
                accent={stats.winRate >= 50 ? T.gold : T.red} />
            </View>

            <SectionLabel text="Per Rooster" style={{ marginTop: 8 }} />
            {roosters.length === 0
              ? <EmptyState text="No roosters added yet" />
              : roosters.map(r => {
                  const w     = r.fight_records?.filter(f => f.result === 'Win').length  || 0;
                  const l     = r.fight_records?.filter(f => f.result === 'Loss').length || 0;
                  const total = w + l;
                  const rate  = total > 0 ? Math.round((w / total) * 100) : 0;
                  const lastWeight = r.measurement_logs?.length
                    ? [...r.measurement_logs]
                        .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at))[0]?.weight_kg
                    : null;
                  return (
                    <View key={r.id} style={styles.roosterRow}>
                      <View style={styles.roosterAvatarWrap}>
                        <Ionicons name="egg-outline" size={18} color={T.sub} />
                      </View>
                      <View style={styles.roosterRowBody}>
                        <View style={styles.roosterRowTop}>
                          <Text style={styles.roosterRowName}>{r.name}</Text>
                          <Text style={[styles.roosterRowRate, { color: rate >= 50 ? T.gold : T.red }]}>
                            {rate}%
                          </Text>
                        </View>
                        <View style={styles.roosterRowMeta}>
                          <Text style={styles.roosterRowSub}>
                            {r.bloodline || 'Unknown bloodline'}
                            {lastWeight ? `  ·  ${lastWeight} kg` : ''}
                          </Text>
                          <Text style={styles.roosterRowWL}>{w}W  {l}L</Text>
                        </View>
                        <View style={styles.winRateBar}>
                          <View style={[styles.winRateFill, {
                            width: `${rate}%`,
                            backgroundColor: rate >= 50 ? T.gold : T.red,
                          }]} />
                        </View>
                      </View>
                    </View>
                  );
                })
            }
          </View>
        )}

        {/* ════════ GROWTH TAB ════════ */}
        {activeTab === 'growth' && (
          <View style={styles.content}>
            <SectionLabel text="Select Rooster" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
              {roosters.map(r => (
                <TouchableOpacity key={r.id} activeOpacity={0.7}
                  style={[styles.chip, selectedRooster?.id === r.id && styles.chipActive]}
                  onPress={() => setSelectedRooster(r)}>
                  <View style={styles.chipRow}>
                    <Ionicons
                      name="egg-outline"
                      size={12}
                      color={selectedRooster?.id === r.id ? T.gold : T.sub}
                    />
                    <Text style={[styles.chipText, selectedRooster?.id === r.id && styles.chipTextActive]}>
                      {r.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedRooster && (
              <>
                <ChartBlock label="Weight"      unit="kg" data={weightData}   color={T.gold}   />
                <ChartBlock label="Spur Length"  unit="cm" data={spurData}     color={T.teal}   />
                <ChartBlock label="Wingspan"     unit="cm" data={wingspanData} color={T.violet} />
              </>
            )}
          </View>
        )}

        {/* ════════ FIGHTS TAB ════════ */}
        {activeTab === 'fights' && (
          <View style={styles.content}>
            <SectionLabel text="Select Rooster" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={styles.chipScroll} contentContainerStyle={styles.chipRow}>
              {roosters.map(r => (
                <TouchableOpacity key={r.id} activeOpacity={0.7}
                  style={[styles.chip, selectedRooster?.id === r.id && styles.chipActive]}
                  onPress={() => setSelectedRooster(r)}>
                  <View style={styles.chipRow}>
                    <Ionicons
                      name="egg-outline"
                      size={12}
                      color={selectedRooster?.id === r.id ? T.gold : T.sub}
                    />
                    <Text style={[styles.chipText, selectedRooster?.id === r.id && styles.chipTextActive]}>
                      {r.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedRooster && (
              fightData.length > 0 && fightData.some(d => d.y > 0) ? (
                <>
                  <SectionLabel text="Win / Loss Breakdown" />
                  <DonutBreakdown fightData={fightData} />

                  <SectionLabel text="Wins Across Stable" />
                  <View style={styles.chartCard}>
                    {stableWinsData.length > 0 ? (
                      <VictoryChart
                        theme={VictoryTheme.material}
                        height={240}
                        domainPadding={{ x: 30 }}
                        padding={{ top: 20, bottom: 60, left: 44, right: 20 }}
                        domain={{ y: [0, Math.max(...stableWinsData.map(d => d.y)) + 1] }}
                      >
                        <VictoryAxis
                          style={{
                            axis:       { stroke: T.border2 },
                            tickLabels: {
                              fill: T.sub, fontSize: 10, fontFamily: 'Courier',
                              angle: -35, textAnchor: 'end', padding: 8,
                            },
                            grid: { stroke: 'transparent' },
                          }}
                        />
                        <VictoryAxis
                          dependentAxis
                          tickFormat={t => (Number.isInteger(t) ? t : '')}
                          style={{
                            axis:       { stroke: T.border2 },
                            tickLabels: { fill: T.sub, fontSize: 10, fontFamily: 'Courier' },
                            grid:       { stroke: T.gridLine, strokeDasharray: '4' },
                          }}
                        />
                        <VictoryBar
                          data={stableWinsData}
                          cornerRadius={{ top: 4 }}
                          style={{ data: { fill: T.gold, width: 22 } }}
                        />
                      </VictoryChart>
                    ) : (
                      <EmptyState text="No wins recorded yet" />
                    )}
                  </View>
                </>
              ) : (
                <EmptyState text="No fight records for this rooster yet" />
              )
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

// ── SectionLabel ───────────────────────────────────────────────────────────────
const SectionLabel = ({ text, style }) => (
  <View style={[labelStyles.wrap, style]}>
    <View style={labelStyles.line} />
    <Text style={labelStyles.text}>{text.toUpperCase()}</Text>
    <View style={[labelStyles.line, { flex: 1 }]} />
  </View>
);
const labelStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 4 },
  line: { height: 1, width: 16, backgroundColor: T.border2 },
  text: { fontSize: 9, fontWeight: '800', letterSpacing: 2.5, color: T.sub },
});

// ── StatCard ───────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, accent }) => (
  <View style={[cardStyles.card, accent && { borderColor: `${accent}33` }]}>
    <Text style={[cardStyles.value, accent && { color: accent }]}>{value}</Text>
    <Text style={cardStyles.label}>{label}</Text>
    {accent && <View style={[cardStyles.glow, { backgroundColor: `${accent}09` }]} />}
  </View>
);
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: T.surface, borderRadius: 12, padding: 18,
    width: '47.5%', borderWidth: 1, borderColor: T.border,
    overflow: 'hidden', position: 'relative',
  },
  value: { fontSize: 30, fontWeight: '900', color: T.white, letterSpacing: -0.5, marginBottom: 5 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, color: T.sub, textTransform: 'uppercase' },
  glow:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 12 },
});

// ── ChartBlock — VictoryVoronoiContainer fully removed, VictoryScatter for dots
const ChartBlock = ({ label, unit, data, color }) => {
  const yValues = data.map(d => d.y);
  const yMin    = yValues.length ? Math.min(...yValues) : 0;
  const yMax    = yValues.length ? Math.max(...yValues) : 1;
  const pad     = (yMax - yMin) * 0.2 || 0.5;
  const domain  = data.length >= 2
    ? { x: [1, data.length], y: [yMin - pad, yMax + pad] }
    : undefined;

  return (
    <>
      <SectionLabel text={`${label} over time (${unit})`} />
      <View style={styles.chartCard}>
        {data.length >= 2 ? (
          <>
            <VictoryChart
              theme={VictoryTheme.material}
              height={190}
              domain={domain}
              padding={{ top: 20, bottom: 36, left: 50, right: 20 }}
            >
              <VictoryAxis
                tickFormat={t => (Number.isInteger(t) ? `#${t}` : '')}
                style={{
                  axis:       { stroke: T.border2 },
                  tickLabels: { fill: T.sub, fontSize: 10, fontFamily: 'Courier' },
                  grid:       { stroke: 'transparent' },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={t => `${parseFloat(t.toFixed(1))}`}
                style={{
                  axis:       { stroke: T.border2 },
                  tickLabels: { fill: T.sub, fontSize: 10, fontFamily: 'Courier' },
                  grid:       { stroke: T.gridLine, strokeDasharray: '4' },
                }}
              />
              <VictoryLine
                data={data}
                style={{ data: { stroke: color, strokeWidth: 2 } }}
              />
              <VictoryScatter
                data={data}
                size={4}
                style={{ data: { fill: color, stroke: T.surface, strokeWidth: 2 } }}
              />
            </VictoryChart>

            {/* Latest value pill */}
            <View style={chartStyles.latestRow}>
              <View style={[chartStyles.dot, { backgroundColor: color }]} />
              <Text style={chartStyles.latestLabel}>Latest</Text>
              <Text style={[chartStyles.latestValue, { color }]}>
                {data[data.length - 1].y} {unit}
              </Text>
            </View>
          </>
        ) : (
          <EmptyState text={`Log at least 2 measurements to see the ${label.toLowerCase()} trend`} />
        )}
      </View>
    </>
  );
};
const chartStyles = StyleSheet.create({
  latestRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 14, paddingTop: 2, gap: 6,
  },
  dot:         { width: 7, height: 7, borderRadius: 4 },
  latestLabel: { fontSize: 11, color: T.sub, fontWeight: '600', flex: 1 },
  latestValue: { fontSize: 13, fontWeight: '900', letterSpacing: -0.3 },
});

// ── DonutBreakdown ─────────────────────────────────────────────────────────────
const DonutBreakdown = ({ fightData }) => {
  const w = fightData.find(d => d.x === 'W')?.y || 0;
  const l = fightData.find(d => d.x === 'L')?.y || 0;
  const d = fightData.find(d => d.x === 'D')?.y || 0;
  const total   = w + l + d;
  const winRate = total > 0 ? Math.round((w / total) * 100) : 0;

  const pieData = fightData.filter(item => item.y > 0);
  if (pieData.length === 0) return <EmptyState text="No fight records to display" />;

  return (
    <View style={styles.chartCard}>
      <View style={donutStyles.pieWrap}>
        <VictoryPie
          data={pieData}
          width={220}
          height={220}
          colorScale={[T.gold, T.red, T.sub]}
          innerRadius={72}
          padAngle={pieData.length > 1 ? 3 : 0}
          labels={() => ''}
          style={{ parent: { alignSelf: 'center' } }}
        />
        <View style={donutStyles.centerOverlay} pointerEvents="none">
          <Text style={donutStyles.centerRate}>{winRate}%</Text>
          <Text style={donutStyles.centerLabel}>Win Rate</Text>
        </View>
      </View>

      <View style={donutStyles.statsRow}>
        {[
          { label: 'Wins',   value: w, color: T.gold },
          { label: 'Losses', value: l, color: T.red  },
          { label: 'Draws',  value: d, color: T.sub  },
        ].map(({ label, value, color }, i, arr) => (
          <React.Fragment key={label}>
            <View style={donutStyles.statItem}>
              <View style={[donutStyles.statDot, { backgroundColor: color }]} />
              <Text style={[donutStyles.statValue, { color }]}>{value}</Text>
              <Text style={donutStyles.statLabel}>{label}</Text>
            </View>
            {i < arr.length - 1 && <View style={donutStyles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};
const donutStyles = StyleSheet.create({
  pieWrap: {
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', paddingTop: 8,
  },
  centerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center', paddingTop: 8,
  },
  centerRate:  { fontSize: 28, fontWeight: '900', color: T.white, letterSpacing: -1 },
  centerLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 2,
    color: T.sub, textTransform: 'uppercase', marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row', borderTopWidth: 1,
    borderTopColor: T.border, marginTop: 4, marginBottom: 4,
  },
  statItem:  { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  statDot:   { width: 6, height: 6, borderRadius: 3, marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: {
    fontSize: 9, fontWeight: '700', letterSpacing: 1.8,
    color: T.sub, textTransform: 'uppercase',
  },
  divider: { width: 1, backgroundColor: T.border, marginVertical: 12 },
});

// ── EmptyState ─────────────────────────────────────────────────────────────────
const EmptyState = ({ text }) => (
  <View style={emptyStyles.wrap}>
    <View style={emptyStyles.iconWrap}>
      <Text style={emptyStyles.dash}>—</Text>
    </View>
    <Text style={emptyStyles.title}>No records yet</Text>
    <Text style={emptyStyles.text}>{text}</Text>
  </View>
);
const emptyStyles = StyleSheet.create({
  wrap:     { alignItems: 'center', paddingTop: 32, paddingBottom: 16, gap: 6 },
  iconWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  dash:  { fontSize: 20, color: T.muted, fontWeight: '300' },
  title: { fontSize: 14, fontWeight: '700', color: T.white },
  text:  { fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 18, maxWidth: 220 },
});

// ── Main Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 40,
    paddingBottom: 20,
    backgroundColor: T.surface,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  eyebrow: {
    fontSize: 10, fontWeight: '700', letterSpacing: 2,
    textTransform: 'uppercase', color: T.gold, marginBottom: 6,
  },
  headerTitle: { fontSize: 26, fontWeight: '800', color: T.white, letterSpacing: -0.5, lineHeight: 30 },
  headerSub:   { fontSize: 13, color: T.muted, marginTop: 4 },

  tabBar: {
    backgroundColor: T.surface, borderBottomWidth: 1,
    borderBottomColor: T.border, flexShrink: 0, maxHeight: 50,
  },
  tabBarContent: { paddingHorizontal: 14, paddingVertical: 9, gap: 6, alignItems: 'center' },
  tab: {
    paddingHorizontal: 16, paddingVertical: 5, borderRadius: 6,
    backgroundColor: 'transparent', borderWidth: 1, borderColor: T.border2,
  },
  tabActive:     { backgroundColor: T.gold, borderColor: T.gold },
  tabText:       { color: T.sub, fontWeight: '600', fontSize: 12, letterSpacing: 0.2 },
  tabTextActive: { color: '#0A0A0B', fontWeight: '800' },

  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scroll:  { flex: 1 },
  content: { padding: 14 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },

  roosterRow: {
    flexDirection: 'row', backgroundColor: T.surface, borderRadius: 12,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: T.border,
    gap: 12, alignItems: 'center',
  },
  roosterAvatarWrap: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: T.goldDim,
    borderWidth: 1, borderColor: T.goldBorder, alignItems: 'center',
    justifyContent: 'center', marginTop: 1,
  },
  roosterAvatar:   { fontSize: 14 },
  roosterRowBody:  { flex: 1, gap: 5 },
  roosterRowTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roosterRowName:  { fontSize: 14, fontWeight: '700', color: T.white, letterSpacing: -0.1 },
  roosterRowRate:  { fontSize: 13, fontWeight: '900', letterSpacing: -0.3 },
  roosterRowMeta:  { flexDirection: 'row', justifyContent: 'space-between' },
  roosterRowSub:   { fontSize: 11, color: T.sub, letterSpacing: 0.2 },
  roosterRowWL:    { fontSize: 11, color: T.muted, fontWeight: '700', letterSpacing: 1 },
  winRateBar:  { height: 3, backgroundColor: T.surface3, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  winRateFill: { height: '100%', borderRadius: 2 },

  chipScroll: { marginBottom: 20 },
  chipRow:    { gap: 8, paddingRight: 4 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 6,
    backgroundColor: T.surface2, borderWidth: 1, borderColor: T.border2,
  },
  chipActive:     { backgroundColor: T.gold, borderColor: T.gold },
  chipText:       { color: T.sub, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#0A0A0B', fontWeight: '800' },

  chartCard: {
    backgroundColor: T.surface, borderRadius: 12, borderWidth: 1,
    borderColor: T.border, marginBottom: 24, overflow: 'hidden',
    paddingTop: 8, paddingBottom: 4, paddingHorizontal: 4,
  },
});