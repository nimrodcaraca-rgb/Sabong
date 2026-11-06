import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export const cacheKeys = {
  roosters: (userId) => `cache:roosters:${userId}`,
  pens: (userId) => `cache:pens:${userId}`,
  measurements: (roosterId) => `cache:measurements:${roosterId}`,
  fights: (roosterId) => `cache:fights:${roosterId}`,
  profile: (userId) => `cache:profile:${userId}`,
  healthLogs: (userId) => `cache:health:${userId}`,
  vaccinations: (userId) => `cache:vaccinations:${userId}`,
  vetVisits: (userId) => `cache:vet:${userId}`,
  feedingLogs: (userId) => `cache:feeding:${userId}`,
};

export const setCache = async (key, data) => {
  const payload = { data, updatedAt: Date.now() };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
};

export const getCache = async (key, options = {}) => {
  const { allowStale = true } = options;
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return { data: null, stale: false };

  try {
    const parsed = JSON.parse(raw);
    const age = Date.now() - (parsed.updatedAt || 0);
    const stale = age > CACHE_TTL_MS;
    if (stale && !allowStale) return { data: null, stale: true };
    return { data: parsed.data ?? null, stale };
  } catch (err) {
    console.warn('cache parse failed', err);
    return { data: null, stale: true };
  }
};

export const updateCacheArray = async (key, updater) => {
  const { data } = await getCache(key);
  const current = Array.isArray(data) ? data : [];
  const next = updater(current) || current;
  await setCache(key, next);
  return next;
};

export const replaceCachedItem = async (key, matcher, replacement) => {
  return updateCacheArray(key, (items) =>
    items.map((item) => (matcher(item) ? replacement : item))
  );
};

export const updateCachedItem = async (key, matcher, updater) => {
  return updateCacheArray(key, (items) =>
    items.map((item) => (matcher(item) ? updater(item) : item))
  );
};
