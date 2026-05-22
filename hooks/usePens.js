import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import { cacheKeys, getCache, setCache, updateCacheArray } from '../lib/offlineStore';
import { createQueueItem, enqueueItem } from '../lib/offlineQueue';

export const usePens = () => {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [pens, setPens] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCached = useCallback(async () => {
    if (!user) return;
    const { data } = await getCache(cacheKeys.pens(user.id));
    if (data) setPens(data);
    setLoading(false);
  }, [user]);

  const fetchPens = useCallback(async () => {
    if (!user) return;
    if (!isOnline) {
      await loadCached();
      return;
    }
    const { data, error } = await supabase
      .from('pens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      setPens(data || []);
      await setCache(cacheKeys.pens(user.id), data || []);
    }
    setLoading(false);
  }, [isOnline, loadCached, user]);

  const createPen = async (name, location, notes) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    if (!isOnline) {
      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const pendingPen = {
        id: localId,
        user_id: user.id,
        name,
        location,
        notes,
        created_at: new Date().toISOString(),
        is_pending: true,
      };
      await enqueueItem(createQueueItem('pen:create', {
        localId,
        name,
        location,
        notes,
      }));
      await updateCacheArray(cacheKeys.pens(user.id), (items) => [pendingPen, ...items]);
      setPens((prev) => [pendingPen, ...prev]);
      return { data: pendingPen, error: null, pending: true };
    }

    const { data, error } = await supabase
      .from('pens')
      .insert({ user_id: user.id, name, location, notes })
      .select()
      .single();
    if (!error) {
      setPens(prev => [data, ...prev]);
      await updateCacheArray(cacheKeys.pens(user.id), (items) => [data, ...items]);
    }
    return { data, error };
  };

  useEffect(() => {
    fetchPens();
  }, [fetchPens]);

  return { pens, loading, fetchPens, createPen };
};