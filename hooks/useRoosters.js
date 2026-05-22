import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import { cacheKeys, getCache, setCache } from '../lib/offlineStore';

export const useRoosters = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [roosters, setRoosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const enrichRoosters = useCallback((data) => {
    return (data || []).map((r) => {
      const fights = r.fight_records || [];
      const wins = fights.filter(f => f.result === 'Win').length;
      const losses = fights.filter(f => f.result === 'Loss').length;
      const draws = fights.filter(f => f.result === 'Draw').length;

      const healthLogs = [...(r.health_logs || [])].sort(
        (a, b) => new Date(b.logged_at) - new Date(a.logged_at)
      );
      const lastHealth = healthLogs[0] || null;

      return { ...r, wins, losses, draws, lastHealth };
    });
  }, []);

  const loadCached = useCallback(async () => {
    if (!user) return;
    const { data } = await getCache(cacheKeys.roosters(user.id));
    if (data) setRoosters(enrichRoosters(data));
    setLoading(false);
  }, [enrichRoosters, user]);

  const fetchRoosters = useCallback(async () => {
    if (!user) return;
    if (!isOnline) {
      await loadCached();
      setRefreshing(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('roosters')
        .select(`
          *,
          pens (id, name),
          fight_records (result),
          measurement_logs (weight_kg, logged_at),
          health_logs (logged_at, symptoms, notes)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      await setCache(cacheKeys.roosters(user.id), data || []);
      setRoosters(enrichRoosters(data));
    } catch (err) {
      console.error('fetchRoosters error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [enrichRoosters, isOnline, loadCached, user]);

  useEffect(() => { fetchRoosters(); }, [fetchRoosters]);

  const refresh = () => {
    setRefreshing(true);
    fetchRoosters();
  };

  // Used by Dashboard
  const getStats = () => {
    const total = roosters.length;
    const wins = roosters.reduce((acc, r) => acc + (r.wins || 0), 0);
    const losses = roosters.reduce((acc, r) => acc + (r.losses || 0), 0);
    const totalFights = wins + losses;
    const winRate = totalFights > 0 ? Math.round((wins / totalFights) * 100) : 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const needsAttention = roosters.filter(r => {
      const lastLog = r.health_logs?.[0]?.logged_at;
      if (!lastLog) return true;
      return new Date(lastLog) < sevenDaysAgo;
    }).length;

    return { total, wins, losses, winRate, totalFights, needsAttention };
  };

  return { roosters, loading, refreshing, refresh, fetchRoosters, getStats };
};