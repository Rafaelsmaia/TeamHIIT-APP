import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import firebaseSyncService from '../services/FirebaseSync.js';
import { getLocalDateString } from '../utils/dateUtils.js';

const WATER_HISTORY_BASE_KEY = 'waterHistory';
const SLEEP_HISTORY_BASE_KEY = 'sleepHistory';
const HABITS_CACHE_BASE_KEY = 'teamhiit_habits';
const HABITS_OWNER_KEY = 'teamhiit_habits_owner';

const getStorageKey = (baseKey, currentUser) => {
  const suffix = currentUser?.uid ? `_${currentUser.uid}` : '_guest';
  return `${baseKey}${suffix}`;
};

const readStorageObject = (key) => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn(`⚠️ [useHabitSync] Erro ao ler ${key}:`, error);
    return {};
  }
};

const writeStorageObject = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`⚠️ [useHabitSync] Erro ao salvar ${key}:`, error);
  }
};

const writeHabitsCache = (cacheKey, waterIntake, sleepHours) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      cacheKey,
      JSON.stringify({
        waterIntake,
        sleepHours,
        lastUpdated: new Date().toISOString()
      })
    );
  } catch (error) {
    console.warn('⚠️ [useHabitSync] Erro ao salvar cache local de hábitos:', error);
  }
};

const readHabitsCache = (cacheKey) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(cacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('⚠️ [useHabitSync] Erro ao ler cache local de hábitos:', error);
    return null;
  }
};

export function useHabitSync(currentUser) {
  const storageKeys = useMemo(() => ({
    water: getStorageKey(WATER_HISTORY_BASE_KEY, currentUser),
    sleep: getStorageKey(SLEEP_HISTORY_BASE_KEY, currentUser),
    cache: getStorageKey(HABITS_CACHE_BASE_KEY, currentUser)
  }), [currentUser]);

  const [waterIntake, setWaterIntake] = useState(0);
  const [sleepHours, setSleepHours] = useState(7);
  const [waterHistory, setWaterHistory] = useState(() => readStorageObject(storageKeys.water));
  const [sleepHistory, setSleepHistory] = useState(() => readStorageObject(storageKeys.sleep));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const waterHistoryRef = useRef(waterHistory);
  const sleepHistoryRef = useRef(sleepHistory);
  const sleepHoursRef = useRef(sleepHours);

  useEffect(() => {
    waterHistoryRef.current = waterHistory;
  }, [waterHistory]);

  useEffect(() => {
    sleepHistoryRef.current = sleepHistory;
  }, [sleepHistory]);

  useEffect(() => {
    sleepHoursRef.current = sleepHours;
  }, [sleepHours]);

  const recalcTodayValues = useCallback((nextWaterHistory, nextSleepHistory) => {
    const todayKey = getLocalDateString();
    const todayWater = nextWaterHistory[todayKey] || 0;
    const todaySleep = typeof nextSleepHistory[todayKey] === 'number' ? nextSleepHistory[todayKey] : 7;

    setWaterIntake(todayWater);
    setSleepHours(todaySleep);
    waterHistoryRef.current = nextWaterHistory;
    sleepHistoryRef.current = nextSleepHistory;
    sleepHoursRef.current = todaySleep;
  }, []);

  const loadHabits = useCallback(async () => {
    const today = getLocalDateString();
    setLoading(true);

    try {
      let localWaterHistory = readStorageObject(storageKeys.water);
      let localSleepHistory = readStorageObject(storageKeys.sleep);

      const shouldMigrateLegacy =
        currentUser?.uid &&
        Object.keys(localWaterHistory || {}).length === 0 &&
        Object.keys(localSleepHistory || {}).length === 0;

      if (shouldMigrateLegacy && typeof window !== 'undefined') {
        const legacyOwner = window.localStorage.getItem(HABITS_OWNER_KEY);
        // Só migrar dados legados se pertencerem ao usuário atual
        // Isso evita que novos usuários herdem dados de outros usuários
        if (legacyOwner === currentUser.uid) {
          const legacyWater = readStorageObject(WATER_HISTORY_BASE_KEY);
          const legacySleep = readStorageObject(SLEEP_HISTORY_BASE_KEY);

          if (Object.keys(legacyWater).length > 0 || Object.keys(legacySleep).length > 0) {
            localWaterHistory = legacyWater;
            localSleepHistory = legacySleep;

            writeStorageObject(storageKeys.water, legacyWater);
            writeStorageObject(storageKeys.sleep, legacySleep);

            window.localStorage.setItem(HABITS_OWNER_KEY, currentUser.uid);
            window.localStorage.removeItem(WATER_HISTORY_BASE_KEY);
            window.localStorage.removeItem(SLEEP_HISTORY_BASE_KEY);
            window.localStorage.removeItem(HABITS_CACHE_BASE_KEY);
          }
        } else if (!legacyOwner) {
          // Se não há dono legado, limpar dados legados para evitar herança indevida
          window.localStorage.removeItem(WATER_HISTORY_BASE_KEY);
          window.localStorage.removeItem(SLEEP_HISTORY_BASE_KEY);
          window.localStorage.removeItem(HABITS_CACHE_BASE_KEY);
        }
      }

      setWaterHistory(localWaterHistory);
      setSleepHistory(localSleepHistory);
      recalcTodayValues(localWaterHistory, localSleepHistory);

      const localTodayWater = localWaterHistory[today] || 0;
      const localTodaySleep = typeof localSleepHistory[today] === 'number' ? localSleepHistory[today] : 7;
      writeHabitsCache(storageKeys.cache, localTodayWater, localTodaySleep);

      if (!currentUser) {
        setError(null);
        setLoading(false);
        return;
      }

      const habitsData = await firebaseSyncService.loadHabits();

      if (habitsData) {
        const localCache = readHabitsCache(storageKeys.cache);
        const localLastUpdated = localCache?.lastUpdated ? new Date(localCache.lastUpdated).getTime() : 0;
        const firebaseLastUpdated = habitsData.lastUpdated ? new Date(habitsData.lastUpdated).getTime() : 0;
        const shouldPreferFirebase = firebaseLastUpdated >= localLastUpdated;

        const firebaseWaterHistory = habitsData.waterHistory || {};
        const firebaseSleepHistory = habitsData.sleepHistory || {};

        const mergedWaterHistory = shouldPreferFirebase
          ? { ...localWaterHistory, ...firebaseWaterHistory }
          : { ...firebaseWaterHistory, ...localWaterHistory };
        const mergedSleepHistory = shouldPreferFirebase
          ? { ...localSleepHistory, ...firebaseSleepHistory }
          : { ...firebaseSleepHistory, ...localSleepHistory };

        writeStorageObject(storageKeys.water, mergedWaterHistory);
        writeStorageObject(storageKeys.sleep, mergedSleepHistory);

        if (currentUser?.uid && typeof window !== 'undefined') {
          window.localStorage.setItem(HABITS_OWNER_KEY, currentUser.uid);
        }

        setWaterHistory(mergedWaterHistory);
        setSleepHistory(mergedSleepHistory);
        recalcTodayValues(mergedWaterHistory, mergedSleepHistory);

        const todayKey = today;
        const mergedWaterIntake = mergedWaterHistory[todayKey] || 0;
        const mergedSleepHours =
          typeof mergedSleepHistory[todayKey] === 'number'
            ? mergedSleepHistory[todayKey]
            : habitsData.sleepHours || 7;

        writeHabitsCache(storageKeys.cache, mergedWaterIntake, mergedSleepHours);

        if (!shouldPreferFirebase && currentUser) {
          try {
            await firebaseSyncService.syncHabits({
              waterHistory: mergedWaterHistory,
              sleepHistory: mergedSleepHistory,
              lastUpdated: new Date().toISOString()
            });
          } catch (syncError) {
            console.error('❌ [useHabitSync] Erro ao sincronizar hábitos mais recentes com Firebase:', syncError);
          }
        }
      }

      setError(null);
    } catch (err) {
      console.error('❌ [useHabitSync] Erro ao carregar hábitos:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, recalcTodayValues, storageKeys]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const updateWaterEntry = useCallback(
    async (dateKey, liters) => {
      const normalizedLiters = Math.max(0, Number(liters) || 0);

      const updatedWaterHistory = {
        ...waterHistoryRef.current,
        [dateKey]: normalizedLiters
      };

      setWaterHistory(updatedWaterHistory);
      recalcTodayValues(updatedWaterHistory, sleepHistoryRef.current);

      writeStorageObject(storageKeys.water, updatedWaterHistory);
      const todayKey = getLocalDateString();
      const todayWater = updatedWaterHistory[todayKey] || 0;
      const todaySleep = sleepHistoryRef.current[todayKey] ?? sleepHoursRef.current;
      writeHabitsCache(storageKeys.cache, todayWater, todaySleep);

      if (currentUser?.uid && typeof window !== 'undefined') {
        window.localStorage.setItem(HABITS_OWNER_KEY, currentUser.uid);
      }

      if (!currentUser) {
        return normalizedLiters;
      }

      try {
        await firebaseSyncService.syncHabits({
          waterIntake: todayWater,
          waterHistory: updatedWaterHistory,
          lastUpdated: new Date().toISOString()
        });
      } catch (syncError) {
        console.error('❌ [useHabitSync] Erro ao sincronizar água:', syncError);
      }

      return normalizedLiters;
    },
    [currentUser, recalcTodayValues, storageKeys]
  );

  const addWaterIntake = useCallback(
    async (amountInMl = 0) => {
      const todayKey = getLocalDateString();
      const litersToAdd = amountInMl / 1000;
      const currentLiters = waterHistoryRef.current[todayKey] || 0;
      const nextLiters = currentLiters + litersToAdd;
      await updateWaterEntry(todayKey, nextLiters);
      return nextLiters;
    },
    [updateWaterEntry]
  );

  const updateSleepEntry = useCallback(
    async (dateKey, hours) => {
      const normalizedHours = Math.max(0, Math.min(Number(hours) || 0, 12));

      const updatedSleepHistory = {
        ...sleepHistoryRef.current,
        [dateKey]: normalizedHours
      };

      setSleepHistory(updatedSleepHistory);
      recalcTodayValues(waterHistoryRef.current, updatedSleepHistory);

      writeStorageObject(storageKeys.sleep, updatedSleepHistory);
      const todayKey = getLocalDateString();
      const todayWater = waterHistoryRef.current[todayKey] || waterIntake;
      const todaySleep = updatedSleepHistory[todayKey] ?? sleepHoursRef.current;
      writeHabitsCache(storageKeys.cache, todayWater, todaySleep);

      if (currentUser?.uid && typeof window !== 'undefined') {
        window.localStorage.setItem(HABITS_OWNER_KEY, currentUser.uid);
      }

      if (!currentUser) {
        return normalizedHours;
      }

      try {
        await firebaseSyncService.syncHabits({
          sleepHistory: updatedSleepHistory,
          lastUpdated: new Date().toISOString()
        });
      } catch (syncError) {
        console.error('❌ [useHabitSync] Erro ao sincronizar sono:', syncError);
      }

      return normalizedHours;
    },
    [currentUser, recalcTodayValues, storageKeys, waterIntake]
  );

  const saveSleepEntry = useCallback(
    async (hours, dateKey = getLocalDateString()) => {
      return updateSleepEntry(dateKey, hours);
    },
    [updateSleepEntry]
  );

  const state = useMemo(
    () => ({
      waterIntake,
      sleepHours,
      waterHistory,
      sleepHistory,
      loading,
      error
    }),
    [waterHistory, sleepHistory, sleepHours, waterIntake, loading, error]
  );

  return {
    ...state,
    setSleepHours,
    reload: loadHabits,
    addWaterIntake,
    updateWaterEntry,
    saveSleepEntry,
    updateSleepEntry
  };
}

export default useHabitSync;

