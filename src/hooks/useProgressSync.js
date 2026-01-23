import { useCallback } from 'react';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import firebaseSyncService from '../services/FirebaseSync.js';
import progressManager from '../utils/ProgressManager.js';
import { getLocalDateString } from '../utils/dateUtils.js';
import { getVideoDuration } from '../utils/VideoDurations.js';

export default function useProgressSync({
  currentUser,
  trainingsData,
  userProgress,
  setUserProgress,
  setActiveModules,
  getActiveModules,
  setUserProfile,
  addToast,
  setLoading,
  isLoadingProgress,
  setIsLoadingProgress,
}) {
  const updateDailyCalories = useCallback((calories) => {
    if (!userProgress) return;

    const today = getLocalDateString();
    const updatedProgress = {
      ...userProgress,
      dailyCalories: {
        ...userProgress.dailyCalories,
        [today]: (userProgress.dailyCalories?.[today] || 0) + calories,
      },
    };

    setUserProgress(updatedProgress);

    const progressData = progressManager.getProgress();
    if (progressData) {
      progressData.dailyCalories = updatedProgress.dailyCalories;
      progressManager.saveProgress(progressData);
    }

    console.log(`🔥 [Dashboard] Calorias adicionadas: ${calories} kcal para ${today}`);
  }, [userProgress, setUserProgress]);

  const loadProgressData = useCallback(async () => {
    if (isLoadingProgress) {
      return;
    }

    try {
      setIsLoadingProgress(true);

      const progress = await progressManager.loadProgress();
      let finalProgress = progress;
      if (!finalProgress) {
        finalProgress = {
          completedVideos: [],
          totalTime: 0,
          workoutDates: {},
          lastWorkoutDate: null,
          lastUpdated: new Date().toISOString(),
        };
      }

      if (finalProgress.completedVideos && finalProgress.completedVideos.length > 0) {
        const videosByTraining = {};
        finalProgress.completedVideos.forEach((videoKey) => {
          const parts = videoKey.split('-');
          let trainingId = '';

          for (let i = 0; i < parts.length; i++) {
            if (parts[i] === 'default' || parts[i] === 'category') {
              trainingId = parts.slice(0, i).join('-');
              break;
            }
          }

          if (trainingId) {
            videosByTraining[trainingId] = true;
          }
        });

        const trainingsWithProgress = Object.keys(videosByTraining);
        const needsMigration = trainingsWithProgress.some((trainingId) =>
          !finalProgress.lastAccessedVideos || !finalProgress.lastAccessedVideos[trainingId]
        );

        if (needsMigration) {
          finalProgress.lastAccessedVideos = finalProgress.lastAccessedVideos || {};
          const videosGrouped = {};

          finalProgress.completedVideos.forEach((videoKey) => {
            const parts = videoKey.split('-');
            let trainingId = '';

            for (let i = 0; i < parts.length; i++) {
              if (parts[i] === 'default' || parts[i] === 'category') {
                trainingId = parts.slice(0, i).join('-');
                break;
              }
            }

            if (trainingId) {
              if (!videosGrouped[trainingId]) {
                videosGrouped[trainingId] = [];
              }
              videosGrouped[trainingId].push(videoKey);
            }
          });

          const trainingsOrder = [];

          finalProgress.completedVideos.forEach((videoKey, index) => {
            const parts = videoKey.split('-');
            let trainingId = '';

            for (let i = 0; i < parts.length; i++) {
              if (parts[i] === 'default' || parts[i] === 'category') {
                trainingId = parts.slice(0, i).join('-');
                break;
              }
            }

            if (trainingId) {
              const existingIndex = trainingsOrder.findIndex((t) => t.trainingId === trainingId);
              if (existingIndex >= 0) {
                trainingsOrder[existingIndex] = { trainingId, index, videoKey };
              } else {
                trainingsOrder.push({ trainingId, index, videoKey });
              }
            }
          });

          trainingsOrder.sort((a, b) => a.index - b.index);

          // IMPORTANTE: Usar datas ANTIGAS (30+ dias atrás) para treinos migrados
          // para não contaminar o cálculo de treinos do dia atual
          const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
          let baseTime = Date.now() - THIRTY_DAYS_MS - (trainingsOrder.length * 24 * 60 * 60 * 1000);

          trainingsOrder.forEach((item, orderIndex) => {
            const { trainingId, videoKey } = item;

            if (!finalProgress.lastAccessedVideos[trainingId]) {
              const parts = videoKey.split('-');

              let moduleId = 'default';
              let videoId = '';

              for (let i = 0; i < parts.length; i++) {
                if (parts[i] === 'default' || parts[i] === 'category') {
                  moduleId = parts[i];
                  videoId = parts.slice(i + 1).join('-');
                  break;
                }
              }

              // Cada treino migrado recebe uma data 1 dia antes do anterior
              // Isso mantém a ordem mas coloca no passado distante
              const timestamp = new Date(baseTime + orderIndex * 24 * 60 * 60 * 1000);

              finalProgress.lastAccessedVideos[trainingId] = {
                accessedAt: timestamp.toISOString(),
                videoId,
                moduleId,
              };
            }
          });
        }
      }

      setUserProgress({ ...finalProgress });

      if (trainingsData && trainingsData.sections) {
        const modules = getActiveModules(finalProgress);
        setActiveModules(modules);
      } else {
        setActiveModules([]);
      }

      setLoading(false);

      if (currentUser) {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setUserProfile(profileData);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      setLoading(false);
    } finally {
      setIsLoadingProgress(false);
    }
  }, [
    isLoadingProgress,
    setIsLoadingProgress,
    setLoading,
    setUserProgress,
    trainingsData,
    getActiveModules,
    setActiveModules,
    currentUser,
    setUserProfile,
  ]);

  const loadUserProgress = useCallback(async () => {
    if (isLoadingProgress) {
      return;
    }

    try {
      setLoading(true);

      if (trainingsData && trainingsData.sections) {
        loadProgressData();
        return;
      }

      if (window.trainingsData && window.trainingsData.sections) {
        loadProgressData();
        return;
      }

      const checkInterval = setInterval(() => {
        if (
          (trainingsData && trainingsData.sections) ||
          (window.trainingsData && window.trainingsData.sections)
        ) {
          loadProgressData();
          clearInterval(checkInterval);
        }
      }, 100);

      setTimeout(() => {
        if (isLoadingProgress) {
          console.warn('⚠️ Dashboard: Timeout ao carregar dados dos treinos - usando cache ou dados padrão');
          setLoading(false);
          clearInterval(checkInterval);
        }
      }, 10000);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  }, [
    isLoadingProgress,
    trainingsData,
    setLoading,
    loadProgressData,
  ]);

  const handleForceSync = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));

      const firebaseProgress = await firebaseSyncService.loadProgress();
      console.log('📥 [Dashboard] Dados do Firebase após sync forçado:', firebaseProgress);

      if (firebaseProgress) {
        localStorage.setItem('teamhiit_user_progress', JSON.stringify(firebaseProgress));
        console.log('💾 [Dashboard] Dados salvos no localStorage');
        await loadProgressData();
        addToast('Dados sincronizados com sucesso!', 'success');
      } else {
        console.warn('⚠️ [Dashboard] Nenhum dado encontrado no Firebase');
        addToast('Nenhum dado encontrado no Firebase. Use "Upload" para enviar dados locais.', 'info');
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao forçar sincronização:', error);
      addToast('Erro ao sincronizar dados', 'error');
      setLoading(false);
    }
  }, [setLoading, loadProgressData, addToast]);

  const handleUploadLocalData = useCallback(async () => {
    try {
      console.log('📤 [Dashboard] Fazendo upload de dados locais para Firebase...');
      setLoading(true);

      const localProgress = progressManager.getProgress();
      console.log('📊 [Dashboard] Dados locais encontrados:', localProgress);

      if (!localProgress || !localProgress.completedVideos || localProgress.completedVideos.length === 0) {
        console.warn('⚠️ [Dashboard] Nenhum dado local encontrado para upload');
        addToast('Nenhum dado local encontrado. Complete alguns treinos primeiro.', 'info');
        setLoading(false);
        return;
      }

      console.log('📤 [Dashboard] Enviando para Firebase...');
      const success = await firebaseSyncService.syncProgress(localProgress);

      if (success) {
        console.log('✅ [Dashboard] Upload concluído com sucesso!');
        addToast(`Upload concluído! ${localProgress.completedVideos.length} treinos enviados.`, 'success');
        await loadProgressData();
      } else {
        console.error('❌ [Dashboard] Falha no upload');
        addToast('Erro ao fazer upload dos dados', 'error');
      }

      setLoading(false);
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao fazer upload:', error);
      addToast('Erro ao fazer upload dos dados', 'error');
      setLoading(false);
    }
  }, [setLoading, addToast, loadProgressData]);

  const getCaloriesForDate = useCallback(async (date) => {
    if (!userProgress) {
      return 0;
    }

    const dateString = getLocalDateString(date);

    try {
      const firebaseCalories = await firebaseSyncService.getCaloriesByDate(dateString);
      if (firebaseCalories > 0) {
        return firebaseCalories;
      }
    } catch (error) {
      console.warn('⚠️ [getCaloriesForDate] Erro ao buscar dados do Firebase, usando fallback:', error);
    }

    let totalCalories = 0;

    if (userProgress.dailyCalories && userProgress.dailyCalories[dateString]) {
      totalCalories += userProgress.dailyCalories[dateString];
    }

    if (userProgress.lastAccessedVideos) {
      Object.keys(userProgress.lastAccessedVideos).forEach((trainingId) => {
        const lastAccess = userProgress.lastAccessedVideos[trainingId];
        if (lastAccess && lastAccess.accessedAt) {
          const accessDate = getLocalDateString(new Date(lastAccess.accessedAt));
          if (accessDate === dateString && lastAccess.calories) {
            totalCalories += lastAccess.calories;
          }
        }
      });
    }

    return totalCalories;
  }, [userProgress]);

  const getWorkoutTimeForDate = useCallback(async (date) => {
    if (!userProgress) {
      return 0;
    }

    const dateString = getLocalDateString(date);

    // Primeiro, tentar obter do Firebase (fonte mais confiável)
    try {
      const firebaseDuration = await firebaseSyncService.getDurationByDate(dateString);
      if (firebaseDuration > 0) {
        return firebaseDuration;
      }
    } catch (error) {
      console.warn('⚠️ [getWorkoutTimeForDate] Erro ao buscar dados do Firebase, usando fallback:', error);
    }

    // Fallback: somar tempo de todos os treinos completados no dia
    let totalMinutes = 0;

    if (userProgress.workoutDates && userProgress.workoutDates[dateString]) {
      const workoutCount = userProgress.workoutDates[dateString];

      if (workoutCount > 0) {
        const today = new Date();
        const dateObj = new Date(dateString);
        const daysDiff = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0 && userProgress.lastAccessedVideos) {
          // Somar todos os treinos que foram completados hoje
          Object.keys(userProgress.lastAccessedVideos).forEach((trainingId) => {
            const lastAccess = userProgress.lastAccessedVideos[trainingId];
            if (lastAccess && lastAccess.accessedAt) {
              const accessDate = getLocalDateString(new Date(lastAccess.accessedAt));

              if (accessDate === dateString && lastAccess.videoId) {
                const videoDuration = getVideoDuration(lastAccess.videoId);
                const minutes = parseInt(videoDuration.replace(' min', ''), 10);
                if (!isNaN(minutes)) {
                  totalMinutes += minutes;
                }
              }
            }
          });
        } else if (userProgress.lastAccessedVideos) {
          // Para dias passados também somar os treinos daquele dia
          Object.keys(userProgress.lastAccessedVideos).forEach((trainingId) => {
            const lastAccess = userProgress.lastAccessedVideos[trainingId];
            if (lastAccess && lastAccess.accessedAt) {
              const accessDate = getLocalDateString(new Date(lastAccess.accessedAt));
              if (accessDate === dateString && lastAccess.videoId) {
                const videoDuration = getVideoDuration(lastAccess.videoId);
                const minutes = parseInt(videoDuration.replace(' min', ''), 10);
                if (!isNaN(minutes)) {
                  totalMinutes += minutes;
                }
              }
            }
          });
        }
      }
    }

    return totalMinutes;
  }, [userProgress]);

  return {
    updateDailyCalories,
    loadProgressData,
    loadUserProgress,
    handleForceSync,
    handleUploadLocalData,
    getCaloriesForDate,
    getWorkoutTimeForDate,
  };
}


