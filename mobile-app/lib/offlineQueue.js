import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = 'offline:queue';
const ID_MAP_KEY = 'offline:idmap';

export const createQueueItem = (type, payload) => ({
  id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  payload,
  createdAt: Date.now(),
  attempts: 0,
});

export const getQueue = async () => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('queue parse failed', err);
    return [];
  }
};

export const setQueue = async (queue) => {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const enqueueItem = async (item) => {
  const queue = await getQueue();
  queue.push(item);
  await setQueue(queue);
  return item;
};

export const removeQueueItem = async (id) => {
  const queue = await getQueue();
  const next = queue.filter((item) => item.id !== id);
  await setQueue(next);
  return next;
};

export const incrementAttempts = async (id) => {
  const queue = await getQueue();
  const next = queue.map((item) =>
    item.id === id ? { ...item, attempts: (item.attempts || 0) + 1 } : item
  );
  await setQueue(next);
  return next;
};

export const getPendingCount = async () => {
  const queue = await getQueue();
  return queue.length;
};

export const getIdMap = async () => {
  const raw = await AsyncStorage.getItem(ID_MAP_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.warn('id map parse failed', err);
    return {};
  }
};

export const setIdMap = async (map) => {
  await AsyncStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
};

export const mapLocalId = async (localId, serverId) => {
  const map = await getIdMap();
  map[localId] = serverId;
  await setIdMap(map);
  return map;
};
