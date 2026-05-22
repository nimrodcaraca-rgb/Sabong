import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNetworkStatus } from './useNetworkStatus';
import {
  getQueue,
  setQueue,
  mapLocalId,
  getIdMap,
} from '../lib/offlineQueue';
import {
  cacheKeys,
  replaceCachedItem,
  getCache,
  setCache,
} from '../lib/offlineStore';
import { uploadPhotoToSupabase } from '../lib/uploadPhoto';

const isLocalId = (id) => typeof id === 'string' && id.startsWith('local-');

export const useOfflineSync = (user) => {
  const { isOnline } = useNetworkStatus();
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const lockRef = useRef(false);

  const refreshCount = useCallback(async () => {
    const queue = await getQueue();
    setPendingCount(queue.length);
  }, []);

  const resolveRoosterId = async (roosterId) => {
    if (!isLocalId(roosterId)) return roosterId;
    const map = await getIdMap();
    return map[roosterId] || null;
  };

  const processItem = useCallback(async (item) => {
    if (!user) return { keep: true };

    const { type, payload } = item;

    if (type === 'pen:create') {
      const { data, error } = await supabase
        .from('pens')
        .insert({ user_id: user.id, ...payload })
        .select()
        .single();
      if (error) throw error;

      await replaceCachedItem(
        cacheKeys.pens(user.id),
        (p) => p.id === payload.localId,
        data
      );
      return { keep: false };
    }

    if (type === 'rooster:create') {
      let photoUrl = null;
      if (payload.photoLocalUri) {
        photoUrl = await uploadPhotoToSupabase(user.id, payload.photoLocalUri);
      }
      const insertPayload = {
        user_id: user.id,
        pen_id: payload.pen_id || null,
        name: payload.name,
        bloodline: payload.bloodline || null,
        birthdate: payload.birthdate || null,
        breeder: payload.breeder || null,
        pedigree_notes: payload.pedigree_notes || null,
        photo_url: photoUrl,
        is_active: true,
      };
      const { data, error } = await supabase
        .from('roosters')
        .insert(insertPayload)
        .select(`
          *,
          pens (id, name),
          fight_records (result),
          measurement_logs (weight_kg, logged_at),
          health_logs (logged_at, symptoms, notes)
        `)
        .single();
      if (error) throw error;

      await mapLocalId(payload.localId, data.id);
      await replaceCachedItem(
        cacheKeys.roosters(user.id),
        (r) => r.id === payload.localId,
        { ...data, is_pending: false }
      );
      return { keep: false };
    }

    if (type === 'fight:create') {
      const resolved = await resolveRoosterId(payload.rooster_id);
      if (!resolved) return { keep: true };

      const { error } = await supabase
        .from('fight_records')
        .insert({ ...payload, rooster_id: resolved });
      if (error) throw error;

      return { keep: false };
    }

    if (type === 'measurement:create') {
      const resolved = await resolveRoosterId(payload.rooster_id);
      if (!resolved) return { keep: true };

      const { error } = await supabase
        .from('measurement_logs')
        .insert({ ...payload, rooster_id: resolved });
      if (error) throw error;

      return { keep: false };
    }

    if (type === 'training:create') {
      const resolved = await resolveRoosterId(payload.rooster_id);
      if (!resolved) return { keep: true };

      const { error } = await supabase
        .from('training_logs')
        .insert({ ...payload, rooster_id: resolved });
      if (error) throw error;

      return { keep: false };
    }

    if (type === 'health:create') {
      const resolved = await resolveRoosterId(payload.rooster_id);
      if (!resolved) return { keep: true };

      const { error } = await supabase
        .from('health_logs')
        .insert({ ...payload, rooster_id: resolved });
      if (error) throw error;

      return { keep: false };
    }

    if (type === 'vaccination:create') {
      const resolved = await resolveRoosterId(payload.rooster_id);
      if (!resolved) return { keep: true };

      const { error } = await supabase
        .from('vaccination_records')
        .insert({ ...payload, rooster_id: resolved });
      if (error) throw error;

      return { keep: false };
    }

    if (type === 'vet:create') {
      const resolved = await resolveRoosterId(payload.rooster_id);
      if (!resolved) return { keep: true };

      const { error } = await supabase
        .from('vet_visits')
        .insert({ ...payload, rooster_id: resolved });
      if (error) throw error;

      return { keep: false };
    }

    if (type === 'feeding:create') {
      const resolved = await resolveRoosterId(payload.rooster_id);
      if (!resolved) return { keep: true };

      const { error } = await supabase
        .from('feeding_logs')
        .insert({ ...payload, rooster_id: resolved });
      if (error) throw error;

      return { keep: false };
    }

    if (type === 'rooster:update') {
      const resolved = await resolveRoosterId(payload.id);
      if (!resolved) return { keep: true };

      const { error } = await supabase
        .from('roosters')
        .update(payload.updates)
        .eq('id', resolved);
      if (error) throw error;

      return { keep: false };
    }

    if (type === 'profile:update') {
      const { error } = await supabase
        .from('profiles')
        .update(payload.updates)
        .eq('id', user.id);
      if (error) throw error;

      const cached = await getCache(cacheKeys.profile(user.id));
      await setCache(cacheKeys.profile(user.id), { ...cached.data, ...payload.updates });
      return { keep: false };
    }

    return { keep: false };
  }, [user]);

  const runSync = useCallback(async () => {
    if (!user || !isOnline || lockRef.current) return;
    lockRef.current = true;
    setSyncing(true);

    try {
      const queue = await getQueue();
      const nextQueue = [];

      for (const item of queue) {
        try {
          const result = await processItem(item);
          if (result.keep) nextQueue.push(item);
        } catch (err) {
          console.warn('sync item failed', item.type, err?.message || err);
          nextQueue.push({
            ...item,
            attempts: (item.attempts || 0) + 1,
          });
        }
      }

      await setQueue(nextQueue);
      await refreshCount();
    } finally {
      setSyncing(false);
      lockRef.current = false;
    }
  }, [isOnline, processItem, refreshCount, user]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  useEffect(() => {
    if (isOnline && user) runSync();
  }, [isOnline, user, runSync]);

  return { isOnline, syncing, pendingCount, runSync };
};
