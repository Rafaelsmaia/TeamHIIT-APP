import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Flame, Headphones } from 'lucide-react';
import ProfilePhoto from '../components/ProfilePhoto.jsx';
import FireCircle from '../components/FireCircle.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import progressManager from '../utils/ProgressManager.js';
import { preloadTrainingsData, useTrainingsData } from '../hooks/useTrainingsData.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { getVideoCalories, getVideoDuration, getCaloriesByDuration } from '../utils/VideoDurations.js';
import { getLocalDateString } from '../utils/dateUtils.js';
import { encodeImageUrl, getYouTubeVideoId } from '../utils/mediaHelpers.js';
import BottomNavigation from '../components/ui/BottomNavigation.jsx';
import Header from '../components/ui/Header.jsx';
import { SimpleNotificationButton } from '../components/SimpleNotificationButton.jsx';
import HabitTrackerSection from '../components/dashboard/HabitTrackerSection.jsx';
import '../styles/fire-animations.css';
import useProgressSync from '../hooks/useProgressSync.js';

function Dashboard() {
  
  const [currentUser, setCurrentUser] = useState(null);
  const [userProgress, setUserProgress] = useState(null);
  
  const [, setActiveModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  // Proteção contra carregamento múltiplo
  const [isLoadingProgress, setIsLoadingProgress] = useState(false);
  const [firestoreImages, setFirestoreImages] = useState({});

  const { data: trainingsData } = useTrainingsData();

  // Buscar imagens (banner/capa) do Firestore para sobrescrever trainings.js
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'trainings'));
        if (cancelled) return;
        const map = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          if (data.id) map[data.id] = { bannerImageUrl: data.bannerImageUrl, imageUrl: data.imageUrl };
        });
        setFirestoreImages(map);
      } catch (e) {
        console.warn('Dashboard: erro ao carregar imagens do Firestore', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dataForDisplay = useMemo(() => {
    if (!trainingsData?.sections) return trainingsData;
    return {
      ...trainingsData,
      sections: trainingsData.sections.map((s) => ({
        ...s,
        trainings: (s.trainings || []).map((t) => {
          const overrides = firestoreImages[t.id] || {};
          const merged = { ...t };
          if (overrides.bannerImageUrl) merged.bannerImageUrl = overrides.bannerImageUrl;
          if (overrides.imageUrl) merged.imageUrl = overrides.imageUrl;
          return merged;
        }),
      })),
    };
  }, [trainingsData, firestoreImages]);

  const getNextVideoForTrainingFixed = useCallback(
    (trainingId, progress, context) => {
      if (!trainingId || !progress || !dataForDisplay?.sections) {
        return null;
      }

      const matches = findTrainingMatches(trainingId, dataForDisplay);
      if (!matches.length) {
        return null;
      }

      const computedContext = context || buildProgressContext(progress);

      for (const { training, sectionId } of matches) {
        const videos = extractTrainingVideos(training);
        if (!videos.length) {
          continue;
        }

        for (const video of videos) {
          if (!hasCompletedVideo(computedContext, trainingId, video.moduleId, video.videoId)) {
            return {
              trainingId,
              sectionId,
              moduleId: video.moduleId,
              moduleTitle: video.moduleTitle,
              videoId: video.videoId,
              videoTitle: video.videoTitle || video.title,
              duration: video.duration,
              calories: video.calories,
              imageUrl: video.imageUrl,
              trainingTitle: training.title,
            };
          }
        }
      }

      return null;
    },
    [dataForDisplay]
  );

  const getActiveModules = useCallback(
    (progress) => {
      if (!progress || !dataForDisplay?.sections) {
        return [];
      }

      const context = buildProgressContext(progress);
      const modules = [];

      dataForDisplay.sections.forEach((section) => {
        section.trainings?.forEach((training) => {
          if (!training?.modules || training.modules.length === 0) {
            return;
          }

          // Verificar se é "Comece por aqui" - não deve aparecer nos módulos ativos
          const id = (training?.id || '').toLowerCase();
          const title = (training?.title || '').toLowerCase();
          const isComeceAqui = 
            id === 'comece-aqui' ||
            id === 'comece_por_aqui' ||
            id === 'comece-por-aqui' ||
            title.includes('comece por aqui') ||
            title.startsWith('comece');
          
          if (isComeceAqui) {
            return; // Pular "Comece por aqui" - ele é tratado separadamente
          }

          const allVideos = extractTrainingVideos(training);
          const completedVideos = allVideos.reduce((count, video) => {
            return hasCompletedVideo(context, training.id, video.moduleId, video.videoId) ? count + 1 : count;
          }, 0);

          // Só adicionar módulos que o usuário já iniciou (completou pelo menos 1 treino)
          if (completedVideos === 0) {
            return;
          }

          const nextVideo = getNextVideoForTrainingFixed(training.id, progress, context);
          if (!nextVideo) {
            return;
          }

          const lastAccessDate = progress.lastAccessedVideos?.[training.id]?.accessedAt;

          modules.push({
            trainingId: training.id,
            trainingTitle: training.title,
            imageUrl:
              training.bannerImageUrl ||
              nextVideo.imageUrl ||
              training.coverImage ||
              training.bannerImage ||
              training.thumbnail ||
              training.imageUrl,
            nextVideo: {
              videoId: nextVideo.videoId,
              moduleId: nextVideo.moduleId,
              moduleTitle: nextVideo.moduleTitle,
              videoTitle: nextVideo.videoTitle,
            },
            duration: nextVideo.duration,
            calories: nextVideo.calories,
            completedVideos,
            lastAccessDate: lastAccessDate ? new Date(lastAccessDate) : undefined,
            sectionId: nextVideo.sectionId,
          });
        });
      });

      return modules;
    },
    [dataForDisplay, getNextVideoForTrainingFixed]
  );

  const getActiveModulesForCarousel = useCallback(() => {
    if (!userProgress) {
      return [];
    }

    return getActiveModules(userProgress);
  }, [userProgress, getActiveModules]);
  
  // Função temporária para substituir addToast
  const addToast = (message, type = 'info') => {
    console.log(`Toast ${type}: ${message}`);
  };
  
  const { loadProgressData, loadUserProgress, getCaloriesForDate, getWorkoutTimeForDate } = useProgressSync({
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
  });
  
  // Estados para calorias da semana
  const [weeklyCaloriesTotal, setWeeklyCaloriesTotal] = useState(0);
  const [weeklyCaloriesData, setWeeklyCaloriesData] = useState({});
  
  // Estados para tempo de treinos da semana
  const [weeklyTimeTotal, setWeeklyTimeTotal] = useState(0);
  const [weeklyTimeData, setWeeklyTimeData] = useState({});

  // Carregar dados de calorias da semana
  useEffect(() => {
    const loadWeeklyCalories = async () => {
      if (!userProgress) return;

      try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
        
        let total = 0;
        const caloriesData = {};
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + i);
          const dateString = getLocalDateString(currentDate);

          const calories = await getCaloriesForDate(currentDate);
          caloriesData[dateString] = calories;
          total += calories;
        }

        setWeeklyCaloriesData(caloriesData);
        setWeeklyCaloriesTotal(total);
      } catch (error) {
        console.error('Erro ao carregar calorias da semana:', error);
      }
    };

    loadWeeklyCalories();
  }, [userProgress, getCaloriesForDate]);

  // Carregar dados de tempo da semana
  useEffect(() => {
    const loadWeeklyTime = async () => {
      if (!userProgress) return;

      try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
        
        let total = 0;
        const timeData = {};
        
        for (let i = 0; i < 7; i++) {
          const currentDate = new Date(startOfWeek);
          currentDate.setDate(startOfWeek.getDate() + i);
          const dateString = getLocalDateString(currentDate);

          const minutes = await getWorkoutTimeForDate(currentDate);
          timeData[dateString] = minutes;
          total += minutes;
        }

        setWeeklyTimeData(timeData);
        setWeeklyTimeTotal(total);
      } catch (error) {
        console.error('Erro ao carregar tempo da semana:', error);
      }
    };

    loadWeeklyTime();
  }, [userProgress, getWorkoutTimeForDate]);
  
  // Estado para controlar qual dia está selecionado no gráfico
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedWorkoutTimeDay, setSelectedWorkoutTimeDay] = useState(null);
  const navigate = useNavigate();
  // useToast removido para evitar erros
  // const { addToast, ToastContainer } = useToast();

  // Mapa de durações reais por vídeo (minutos decimais) para exibição nos cards
  // Removido: VIDEO_ID_TO_MINUTES - agora usando VideoUtils.js

  function getFirstName() {
    // Usar displayName do Firebase Auth (fonte principal)
    if (currentUser?.displayName) {
      const first = currentUser.displayName.trim().split(' ')[0];
      if (first) return first;
    }

    // Fallback: usar email
    if (currentUser?.email) {
      const emailName = currentUser.email.split('@')[0];
      if (emailName) return emailName;
    }

    return 'Atleta';
  }

  function getCurrentDate() {
    const now = new Date();
    const formatted = now.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    if (!formatted) {
      return now.toISOString().slice(0, 10);
    }

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  function getFirstVideoFromComeceAqui() {
    if (!trainingsData?.sections) {
      return null;
    }

    let targetTraining = null;

    trainingsData.sections.forEach((section) => {
      section.trainings?.forEach((training) => {
        if (targetTraining) {
            return;
          }
          
        const id = (training?.id || '').toLowerCase();
        const title = (training?.title || '').toLowerCase();

        if (
          id === 'comece-aqui' ||
          id === 'comece_por_aqui' ||
          id === 'comece-por-aqui' ||
          title.includes('comece por aqui') ||
          title.startsWith('comece')
        ) {
          targetTraining = training;
        }
      });
    });

    if (!targetTraining) {
      return null;
    }

    const fallbackVideos = extractTrainingVideos(targetTraining);
    if (!fallbackVideos.length) {
      return null;
    }

    const progressContext = userProgress ? buildProgressContext(userProgress) : null;
    const nextVideo =
      getNextVideoForTrainingFixed(targetTraining.id, userProgress, progressContext) || fallbackVideos[0];

    if (!nextVideo) {
      return null;
    }

    const completedVideos = fallbackVideos.reduce((count, video) => {
      if (!progressContext) {
        return count;
      }
      return hasCompletedVideo(progressContext, targetTraining.id, video.moduleId, video.videoId)
        ? count + 1
        : count;
    }, 0);

    const lastAccess = progressContext?.progress.lastAccessedVideos?.[targetTraining.id]?.accessedAt;
          
          return {
      trainingId: targetTraining.id,
      trainingTitle: targetTraining.title,
      nextVideo: {
        videoId: nextVideo.videoId,
        moduleId: nextVideo.moduleId,
        moduleTitle: nextVideo.moduleTitle,
        videoTitle: nextVideo.videoTitle,
      },
      duration: nextVideo.duration,
      calories: nextVideo.calories,
      imageUrl: targetTraining.bannerImageUrl || nextVideo.imageUrl || pickImageSource(targetTraining),
      isComeceAqui: true,
      completedVideos,
      lastAccessDate: lastAccess ? new Date(lastAccess) : undefined,
    };
  }
  
  // Usar o hook personalizado para dados dos treinos
  // const { data: trainingsData } = useTrainingsData(); // Moved up
  
  
  // Usar o hook de tema
  const { isDarkMode } = useTheme();



  // Scroll para o topo quando a página é carregada
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Função para encontrar o primeiro vídeo de um módulo (ignorando apresentação)
  const getFirstVideoId = (trainingId) => {
    if (!dataForDisplay?.sections) return null;
    
    for (const section of dataForDisplay.sections) {
      const training = section.trainings.find(t => t.id === trainingId);
      if (training && training.modules && training.modules.length > 0) {
        // Encontrar o primeiro módulo que não seja apresentação
        const firstTrainingModule = training.modules.find(module => {
          const isPresentation = module.title && module.title.toLowerCase().includes('apresentação');
          return !isPresentation;
        });
        
        if (firstTrainingModule && firstTrainingModule.videoUrl) {
          const videoId = getYouTubeVideoId(firstTrainingModule.videoUrl);
          return videoId;
        }
        
        // Fallback: se não encontrou treino, usar o primeiro módulo disponível
        const firstModule = training.modules[0];
        if (firstModule && firstModule.videoUrl) {
          const videoId = getYouTubeVideoId(firstModule.videoUrl);
          return videoId;
        }
      }
    }
    return null;
  };

  const navigateToTrainingEntry = (item, source = 'card') => {
    if (!item) {
      return;
    }

    if (item.isComeceAqui) {
      if (source === 'cta') {
        const firstVideoId = item.nextVideo?.videoId || getFirstVideoId(item.trainingId || 'comece-aqui') || 'f7KNh2jRf5I';
        navigate(`/player/${item.trainingId || 'comece-aqui'}/${firstVideoId}`, { replace: true });
        return;
      }

      navigate(`/video/${item.trainingId || 'comece-aqui'}`, { replace: true });
      return;
    }

    if (item.nextVideo?.videoId) {
      navigate(`/player/${item.trainingId}/${item.nextVideo.videoId}`, { replace: true });
      return;
    }

    const firstVideoId = getFirstVideoId(item.trainingId);
    if (firstVideoId) {
      navigate(`/player/${item.trainingId}/${firstVideoId}`, { replace: true });
      return;
    }

    navigate('/dashboard');
  };

  // Carregar o usuário atual do Firebase
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    
    return () => unsubscribe();
  }, []);

  // Carregar progresso do usuário autenticado
  const loadUserProgressRef = useRef(loadUserProgress);
  const preloadTrainingsDataRef = useRef(preloadTrainingsData);

  useEffect(() => {
    loadUserProgressRef.current = loadUserProgress;
  });

  useEffect(() => {
    preloadTrainingsDataRef.current = preloadTrainingsData;
  });

  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    let isCancelled = false;

    const loadData = async () => {
      await loadUserProgressRef.current();

      if (isCancelled) return;

      try {
        await preloadTrainingsDataRef.current();
      } catch (error) {
          console.warn('Erro ao pré-carregar dados dos treinos:', error);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser]);

  // Monitorar quando os dados dos treinos ficam disponíveis
  useEffect(() => {
    if (trainingsData && trainingsData.sections && loading && !isLoadingProgress) {
      loadProgressData();
    }
  }, [trainingsData, loading, isLoadingProgress, loadProgressData]);

  // Atualizar módulos ativos quando trainingsData ou userProgress mudarem
  useEffect(() => {
    if (trainingsData && trainingsData.sections && userProgress) {
      const modules = getActiveModules(userProgress);
      setActiveModules(modules);
    }
  }, [trainingsData, userProgress, getActiveModules]);

  // Timeout de segurança para garantir que sempre mostremos dados
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        
        // Criar progresso básico se não temos nada
        if (!userProgress) {
          setUserProgress({
            completedVideos: [],
            totalTime: 0,
            workoutDates: {},
            lastWorkoutDate: null,
            lastUpdated: new Date().toISOString()
          });
        }
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(safetyTimeout);
  }, [loading, userProgress]);

  // Listener para mudanças no progresso (quando um vídeo é concluído)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'teamhiit_user_progress') {
        // Forçar recarregamento ignorando a proteção
        setIsLoadingProgress(false);
        
        // Atualizar diretamente do localStorage com novo objeto
        const updatedProgressStr = localStorage.getItem('teamhiit_user_progress');
        if (updatedProgressStr) {
          try {
            const updatedProgress = JSON.parse(updatedProgressStr);
            setUserProgress({ ...updatedProgress });
          } catch (error) {
            console.error('❌ Erro ao parsear progresso do storage:', error);
          }
        }
        
        loadUserProgress();
      }
    };

    // Listener para mudanças no localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // Listener para mudanças no mesmo tab (quando o progresso é atualizado)
    const checkProgressInterval = setInterval(() => {
      const currentProgress = progressManager.getProgress();
      if (currentProgress && userProgress) {
        const currentCompletedCount = currentProgress.completedVideos?.length || 0;
        const previousCompletedCount = userProgress.completedVideos?.length || 0;
        
        if (currentCompletedCount > previousCompletedCount) {
          // Forçar recarregamento ignorando a proteção
          setIsLoadingProgress(false);
          
          // Atualizar diretamente com novo objeto
          setUserProgress({ ...currentProgress });
          
          loadUserProgress();
        }
      }
    }, 2000); // Verificar a cada 2 segundos

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkProgressInterval);
    };
  }, [userProgress, loadUserProgress]);

  // Listener para evento de vídeo concluído
  useEffect(() => {
    const handleVideoCompleted = async (event) => {
      console.log('🎉 Evento videoCompleted recebido no Dashboard:', event.detail);
      
      // Forçar recarregamento ignorando a proteção
      setIsLoadingProgress(false);
      
      // Aguardar um pouco para garantir que o localStorage foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Recarregar progresso do localStorage diretamente
      const updatedProgressStr = localStorage.getItem('teamhiit_user_progress');
      if (updatedProgressStr) {
        try {
          const updatedProgress = JSON.parse(updatedProgressStr);
          console.log('📊 Dashboard: Progresso atualizado do localStorage:', updatedProgress);
          console.log('🔍 Dashboard: completedVideos count:', updatedProgress.completedVideos?.length);
          console.log('🔍 Dashboard: lastAccessedVideos:', updatedProgress.lastAccessedVideos);
          
          // Forçar atualização criando novo objeto (para React detectar mudança)
          setUserProgress({ ...updatedProgress });
          
          // Atualizar módulos ativos também
          if (trainingsData && trainingsData.sections) {
            const modules = getActiveModules(updatedProgress);
            setActiveModules(modules);
            console.log('✅ Dashboard: Módulos ativos atualizados:', modules.map(m => m.trainingTitle));
          }
        } catch (error) {
          console.error('❌ Erro ao parsear progresso do evento:', error);
        }
      }
      
      loadUserProgress();
    };

    window.addEventListener('videoCompleted', handleVideoCompleted);

    return () => {
      window.removeEventListener('videoCompleted', handleVideoCompleted);
    };
  }, [trainingsData, loadUserProgress, getActiveModules]);

  const memoizedActiveModules = useMemo(() => getActiveModulesForCarousel(), [getActiveModulesForCarousel]);

  // Função para verificar se houve treino em um dia específico
  const hasWorkoutOnDate = (date) => {
    if (!userProgress) {
      return false;
    }
    
    // Converter a data para string no formato YYYY-MM-DD
    const dateString = getLocalDateString(date);
    
    // Verificar se há treinos registrados neste dia específico
    if (userProgress.workoutDates && userProgress.workoutDates[dateString]) {
      return true;
    }
    
    // IMPORTANTE: NUNCA retornar true para datas futuras
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fim do dia atual
    
    if (date > today) {
      return false; // Datas futuras nunca devem ter treinos
    }
    
    return false;
  };

  // Função para analisar treinos completados em uma data específica
  const getCompletedWorkoutsForDate = useCallback((date) => {
    if (!userProgress || !userProgress.workoutDates) {
      return [];
    }

    const dateString = getLocalDateString(date);
    const completedWorkouts = [];

    // Verificar se há workout nesta data usando workoutDates (fonte confiável)
    if (userProgress.workoutDates[dateString]) {
      const workoutCount = userProgress.workoutDates[dateString];
      // console.log(`🔍 [getCompletedWorkoutsForDate] ${dateString}: ${workoutCount} treino(s) registrado(s)`);
      
      // NOVA ABORDAGEM: Como lastAccessedVideos pode ser sobrescrito,
      // vamos usar uma lógica diferente para identificar os treinos
      
      if (workoutCount > 0) {
        // Para treinos recentes (últimos 7 dias), usar lastAccessedVideos
        const today = new Date();
        const dateObj = new Date(dateString);
        const daysDiff = Math.floor((today - dateObj) / (1000 * 60 * 60 * 24));
        
        // Só usar lastAccessedVideos para treinos de hoje (0 dias)
        // Para treinos passados, usar abordagem genérica
        if (daysDiff === 0 && userProgress.lastAccessedVideos) {
          console.log(`🔍 [getCompletedWorkoutsForDate] Buscando treinos recentes (${daysDiff} dias atrás)`);
          
          Object.keys(userProgress.lastAccessedVideos).forEach(trainingId => {
            const lastAccess = userProgress.lastAccessedVideos[trainingId];
            if (lastAccess && lastAccess.accessedAt) {
              const accessDate = getLocalDateString(new Date(lastAccess.accessedAt));
              
              if (accessDate === dateString) {
                console.log(`✅ [getCompletedWorkoutsForDate] Encontrado treino ${trainingId} na data ${dateString}`);
                
                // Encontrar informações do treino nos dados de treinos
                let trainingInfo = null;
                if (trainingsData && trainingsData.sections) {
                  trainingsData.sections.forEach(section => {
                    section.trainings.forEach(training => {
                      if (training.id === trainingId) {
                        trainingInfo = training;
                      }
                    });
                  });
                }
                
                completedWorkouts.push({
                  trainingId,
                  trainingTitle: trainingInfo?.title || trainingId,
                  accessedAt: lastAccess.accessedAt,
                  videoTitle: lastAccess.videoTitle || `Treino ${trainingId}`,
                  videoId: lastAccess.videoId || 'N/A'
                });
              }
            }
          });
        } else {
          // Para treinos mais antigos, criar entradas genéricas baseadas no workoutCount
          // console.log(`🔍 [getCompletedWorkoutsForDate] Treino antigo (${daysDiff} dias atrás) - criando entrada genérica`);
          
          // Criar entradas genéricas para os treinos registrados
          for (let i = 0; i < workoutCount; i++) {
            completedWorkouts.push({
              trainingId: `treino-${dateString}-${i + 1}`,
              trainingTitle: `Treino ${dateString}`,
              accessedAt: `${dateString}T12:00:00.000Z`, // Hora estimada
              videoTitle: `Treino completado em ${dateString}`,
              videoId: 'N/A'
            });
          }
        }
      }
    } else {
      // console.log(`❌ [getCompletedWorkoutsForDate] Nenhum workout registrado para ${dateString}`);
    }
    
    return completedWorkouts;
  }, [userProgress, trainingsData]);

  // Função para analisar treinos de ontem e hoje
  const analyzeRecentWorkouts = useCallback(() => {
    if (!userProgress) {
      return { today: [], yesterday: [] };
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todayWorkouts = getCompletedWorkoutsForDate(today);
    const yesterdayWorkouts = getCompletedWorkoutsForDate(yesterday);

    // console.log('📊 [analyzeRecentWorkouts] Treinos de hoje:', todayWorkouts);
    // console.log('📊 [analyzeRecentWorkouts] Treinos de ontem:', yesterdayWorkouts);

    return {
      today: todayWorkouts,
      yesterday: yesterdayWorkouts
    };
  }, [userProgress, getCompletedWorkoutsForDate]);

  // Executar análise quando userProgress estiver disponível
  useEffect(() => {
    if (userProgress && trainingsData) {
      const recentWorkouts = analyzeRecentWorkouts();
      
      if (recentWorkouts.today.length > 0) {
        // console.log('✅ TREINOS COMPLETADOS HOJE:');
        // recentWorkouts.today.forEach(workout => {
        //   console.log(`  - ${workout.trainingTitle}: ${workout.videoTitle} (${workout.accessedAt})`);
        // });
      } else {
        // console.log('❌ Nenhum treino completado hoje');
      }

      if (recentWorkouts.yesterday.length > 0) {
        // console.log('✅ TREINOS COMPLETADOS ONTEM:');
        // recentWorkouts.yesterday.forEach(workout => {
        //   console.log(`  - ${workout.trainingTitle}: ${workout.videoTitle} (${workout.accessedAt})`);
        // });
      } else {
        // console.log('❌ Nenhum treino completado ontem');
      }
    }
  }, [userProgress, trainingsData, analyzeRecentWorkouts]);

  // Dashboard renderizando normalmente
  
  // FALLBACK: Se algo der errado, sempre mostrar conteúdo
  const forceRender = true;
  
  // Se ainda está carregando, mostrar loading
  if (loading && !forceRender) {
    console.log('⏳ [DASHBOARD] Ainda carregando, mostrando loading...');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Dashboard...</p>
        </div>
      </div>
    );
  }
  
  // Dashboard renderizando normalmente
  
  // Timeout de segurança removido para evitar problemas de hooks
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      
      {/* 1. HEADER FIXO REAL (com logo e menu) */}
      <Header />

      {/* 2. CONTEÚDO DO DASHBOARD com a compensação de padding */}
      {/* pt-[4.5rem] (18 * 0.25rem) - padding ajustado para compensar o header fixo */}
      <div
        className="main-content px-4 pb-32 sm:px-6"
        style={{ paddingTop: 'calc(4.75rem + env(safe-area-inset-top, 0px))' }}
      >
        
        {/* SEÇÃO DE SAUDAÇÃO (O que estava faltando) */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
            
            {/* Foto de Perfil e Nome */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-md flex items-center justify-center">
                <ProfilePhoto
                  src={currentUser?.photoURL || ''}
                  alt="Foto de perfil"
                  size="lg"
                  className="w-full h-full"
                  fallbackText={currentUser?.displayName || currentUser?.email}
                />
              </div>
            </div>
            
            <div className="min-w-0">
              <h1 className={`text-xl font-bold leading-tight sm:text-2xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Olá, {getFirstName()} 💪
              </h1>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{getCurrentDate()}</p>
            </div>
          </div>
          
          {/* Botão de Notificação Simples */}
          <div className="flex-shrink-0 self-auto">
            <SimpleNotificationButton isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* 3. Today's Workout Section - Carrossel */}
        <div className="mb-4 -mx-4 sm:-mx-6">
          <div className="mb-3 px-4 sm:px-6">
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Treinos para hoje</h2>
          </div>
          
          {loading ? (
            <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-blue-500'} rounded-xl shadow-lg p-6 text-center mx-4 sm:mx-6`}>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Carregando seus treinos...</p>
            </div>
          ) : (() => {
            const comeceAquiVideo = getFirstVideoFromComeceAqui();
            const activeModules = memoizedActiveModules;
            const carouselItems = [];
            
            // Adicionar "Comece por aqui" se não estiver nos módulos ativos
            const hasComeceAquiInActive = activeModules.some(module => module.isComeceAqui);
            if (comeceAquiVideo && !hasComeceAquiInActive) {
              carouselItems.push(comeceAquiVideo);
            }
            
            // Adicionar todos os módulos ativos
            carouselItems.push(...activeModules);
            
            // APLICAR ORDENAÇÃO FINAL em toda a lista - comportamento "continue assistindo"
            carouselItems.sort((a, b) => {
              const aVideos = a.completedVideos || 0;
              const bVideos = b.completedVideos || 0;
              
              // PRIORIDADE 1: SEMPRE priorizar data de último acesso (mais recente primeiro)
              if (a.lastAccessDate && b.lastAccessDate) {
                if (a.lastAccessDate.getTime() !== b.lastAccessDate.getTime()) {
                  return b.lastAccessDate - a.lastAccessDate;
                }
              }
              
              // PRIORIDADE 2: Se datas são iguais, usar vídeos concluídos como desempate
              if (aVideos !== bVideos) {
                return bVideos - aVideos;
              }
              
              // PRIORIDADE 3: Se um dos itens não tem lastAccessDate, priorizar o que tem
              if (a.lastAccessDate && !b.lastAccessDate) {
                return -1;
              }
              if (!a.lastAccessDate && b.lastAccessDate) {
                return 1;
              }
              
              return 0;
            });
            
            if (carouselItems.length > 0) {
              // Função para calcular progresso do módulo
              const getModuleProgress = (item) => {
                if (!trainingsData?.sections || !userProgress) return 0;
                
                const context = buildProgressContext(userProgress);
                let totalVideos = 0;
                let completedVideos = 0;
                
                trainingsData.sections.forEach((section) => {
                  section.trainings?.forEach((training) => {
                    if (training.id === item.trainingId) {
                      const videos = extractTrainingVideos(training);
                      totalVideos = videos.length;
                      completedVideos = videos.reduce((count, video) => {
                        return hasCompletedVideo(context, training.id, video.moduleId, video.videoId) ? count + 1 : count;
                      }, 0);
                    }
                  });
                });
                
                return totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;
              };

              return (
                <div 
                  className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
                  style={{ 
                    scrollBehavior: 'smooth',
                    WebkitOverflowScrolling: 'touch'
                  }}
                >
                  <div className="flex pb-4" style={{ width: 'max-content' }}>
                    {carouselItems.map((item, index) => {
                      const moduleProgress = getModuleProgress(item);
                      const completedCount = item.completedVideos || 0;
                      
                      return (
                        <div
                          key={`${item.trainingId}-${index}`}
                          className="flex-shrink-0 snap-center snap-always"
                          style={{
                            width: 'min(calc(100vw - 2rem), 28rem)',
                            maxWidth: '28rem',
                            marginLeft: index === 0 ? '1rem' : '0.75rem',
                            marginRight: index === carouselItems.length - 1 ? '1rem' : '0.75rem'
                          }}
                        >
                          {/* Card do Treino */}
                          <div
                            className={`relative rounded-2xl overflow-hidden cursor-pointer mb-2 shadow-lg border sm:mb-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
                            style={{ height: 'clamp(11.75rem, 52vw, 14rem)' }}
                            onClick={() => navigateToTrainingEntry(item, 'card')}
                          >
                        {/* Banner Background */}
                        <div className="relative h-full">
                          <img
                            src={item.imageUrl ? encodeImageUrl(item.imageUrl) : encodeURI("/IMAGES/CAPAS TEAM HIIT/capa TH.png")}
                            alt={item.trainingTitle}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = encodeURI("/IMAGES/CAPAS TEAM HIIT/capa TH.png");
                            }}
                          />
                          
                          {/* Informações sobrepostas */}
                          <div className="absolute inset-0 p-6 pb-4 flex flex-col justify-end">
                            {/* Badge no topo */}
                            <div className="absolute top-6 left-6">
                              <span className="bg-blue-500/90 text-white px-3 py-1 rounded-full text-sm font-medium inline-block w-fit">
                                {item.isComeceAqui ? "Primeiro Passo" : 
                                 item.nextVideo ? item.nextVideo.moduleTitle : 
                                 "Continue Assistindo"}
                              </span>
                            </div>
                          </div>
                        </div>
                          </div>

                          {/* Widgets abaixo do card */}
                          <div className="flex gap-2 sm:gap-3">
                            {/* Widget 1: Progresso do Módulo */}
                            <div className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-50'} rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <p className={`mb-2 text-center text-[11px] font-bold sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Progresso do Módulo
                              </p>
                              <div className="relative w-16 h-16">
                                <svg className="w-16 h-16 transform -rotate-90">
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke={isDarkMode ? '#374151' : '#dbeafe'}
                                    strokeWidth="6"
                                    fill="none"
                                  />
                                  <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    stroke="#3b82f6"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 28}`}
                                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - moduleProgress / 100)}`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className={`text-sm font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {Math.round(moduleProgress)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Widget 2: Tempo do Treino */}
                            <div className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center`}>
                              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white sm:h-10 sm:w-10">
                                <Clock className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />
                              </div>
                              <p className={`mb-1 text-base font-extrabold sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.duration}
                              </p>
                              <p className={`text-center text-[11px] font-bold sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Tempo do Treino
                              </p>
                            </div>

                            {/* Widget 3: Calorias do Treino */}
                            <div className={`flex-1 ${isDarkMode ? 'bg-gray-800' : 'bg-blue-100'} rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center`}>
                              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white sm:h-10 sm:w-10">
                                <Flame className="h-4 w-4 text-blue-500 sm:h-5 sm:w-5" />
                              </div>
                              <p className={`mb-1 text-base font-extrabold sm:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {item.calories ? item.calories.replace(' kcal', '') : '300-500'}
                              </p>
                              <p className={`text-center text-[11px] font-bold sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Calorias do Treino
                              </p>
                            </div>
                          </div>

                          {/* Botão Iniciar Treino */}
                          <button
                            onClick={() => navigateToTrainingEntry(item, 'cta')}
                            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 transition-all duration-300 hover:opacity-90 active:scale-95 sm:mt-6 sm:py-4 ${isDarkMode ? 'bg-blue-700' : 'bg-blue-500'}`}
                          >
                            <span className="text-sm font-bold text-white sm:text-base">
                              Iniciar treino
                            </span>
                            <span className="text-base font-bold text-white sm:text-lg">
                              →
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Widget "Ofensiva de treinos" */}
        <div className="mb-4">
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Ofensiva de treinos</h3>
          <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg p-4 sm:p-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
          
          {/* Nomes dos Dias */}
          <div className="grid grid-cols-7 gap-2 mb-4 sm:gap-4 md:gap-6">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, index) => (
              <div key={index} className="flex justify-center">
                <span className={`text-[10px] font-medium sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {dayName}
                </span>
              </div>
            ))}
          </div>

          {/* Círculos de Fogo - Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 md:gap-6">
            {(() => {
              // Só renderizar se userProgress estiver carregado
              if (!userProgress) {
                return Array.from({ length: 7 }, (_, index) => (
                  <div key={index} className="flex justify-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
                  </div>
                ));
              }
              
              const today = new Date();
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
              
              return Array.from({ length: 7 }, (_, index) => {
                const currentDate = new Date(startOfWeek);
                currentDate.setDate(startOfWeek.getDate() + index);
                const dayNumber = currentDate.getDate();
                const isCurrentDay = currentDate.toDateString() === today.toDateString();
                const hasWorkout = hasWorkoutOnDate(currentDate);
                
                return (
                  <div key={index} className="flex justify-center">
                    <FireCircle 
                      dayNumber={dayNumber}
                      isActive={isCurrentDay}
                      hasWorkout={hasWorkout}
                    />
                  </div>
                );
              });
            })()}
          </div>
          </div>
        </div>

        {/* Meu Progresso - Carrossel de Métricas */}
        <div className="mb-4 -mx-4 sm:-mx-6">
          <div className="mb-4 px-4 sm:px-6">
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Meu Progresso</h2>
          </div>
          
        {/* Carrossel de Métricas */}
        <div 
          className="overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="flex pb-4" style={{ width: 'max-content' }}>
            {/* Métrica 1: Calorias Queimadas */}
            <div 
              className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 flex-shrink-0 snap-center snap-always border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}
              style={{
                width: 'min(calc(100vw - 2rem), 28rem)',
                maxWidth: '28rem',
                marginLeft: '1rem',
                marginRight: '0.75rem'
              }}
            >
              {/* Header com Total */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Calorias Queimadas</h3>
                </div>
                <div className={`text-3xl font-bold sm:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {weeklyCaloriesTotal.toLocaleString()}
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(() => {
                    if (!userProgress) {
                      return 'Meta: 3.000 · 0%';
                    }
                    
                    // Calcular total e porcentagem baseado na soma das barras diárias
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
                    
                    // Usar dados já carregados
                    const totalFromBars = weeklyCaloriesTotal;
                    
                    const percentage = Math.min(Math.round((totalFromBars / 3000) * 100), 100);
                    return `Meta: ${(3000).toLocaleString()} · ${percentage}%`;
                  })()}
                </p>
              </div>


              {/* Gráfico de Barras - 7 dias da semana */}
              <div className="flex items-end justify-between gap-1.5 h-24 mb-2 sm:gap-2">
                {(() => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
                  
                  
                  return Array.from({ length: 7 }, (_, index) => {
                    const currentDate = new Date(startOfWeek);
                    currentDate.setDate(startOfWeek.getDate() + index);
                    const isToday = currentDate.toDateString() === today.toDateString();
                    
                    // Obter calorias reais do histórico
                    const dateString = getLocalDateString(currentDate);
                    const dayCalories = weeklyCaloriesData[dateString] || 0;
                    
                    // Escala de 0 a 800 kcal - barra de progresso responsiva
                    const maxCalories = 800;
                    const heightPercent = Math.min((dayCalories / maxCalories) * 100, 100);
                    
                    
                    return (
                      <div 
                        key={index} 
                        className="flex flex-col items-center flex-1 group relative cursor-pointer"
                        onClick={() => setSelectedDay(selectedDay === index ? null : index)}
                      >
                        {/* Container com fundo cinza (fundo da barra) */}
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-t-lg relative overflow-hidden">
                          {/* Barra de progresso (preenchimento) - só aparece se houver calorias */}
                          {dayCalories > 0 && (
                            <div 
                              className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                                isToday 
                                  ? 'bg-gradient-to-t from-orange-500 to-orange-400' 
                                  : isDarkMode ? 'bg-gradient-to-t from-orange-600/80 to-orange-500/60' : 'bg-gradient-to-t from-orange-400/90 to-orange-300/70'
                              } ${isToday ? 'shadow-lg' : ''}`}
                              style={{ height: `${heightPercent}%` }}
                            >
                              {isToday && (
                                <div className="w-full h-3 bg-white/30 rounded-full mt-1"></div>
                              )}
                            </div>
                          )}
                          
                          {/* Indicador de meta (ponto branco no topo) - sempre visível */}
                          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-30"></div>
                        </div>
                        
                        {/* Balão com ícone de fogo e calorias - só aparece no dia selecionado */}
                        {selectedDay === index && (
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 z-20">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                                <Flame className="w-2.5 h-2.5 text-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {dayCalories} kcal
                              </span>
                            </div>
                            {/* Seta do balão */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Labels dos dias */}
              <div className="flex justify-between">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const currentDate = new Date(startOfWeek);
                  currentDate.setDate(startOfWeek.getDate() + index);
                  const isToday = currentDate.toDateString() === today.toDateString();
                  
                  return (
                    <div key={index} className="flex-1 text-center">
                      <span className={`text-xs font-medium ${
                        isToday 
                          ? 'text-orange-500' 
                          : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Métrica 2: Tempo de Treino */}
            <div 
              className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 flex-shrink-0 snap-center snap-always border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}
              style={{
                width: 'min(calc(100vw - 2rem), 28rem)',
                maxWidth: '28rem',
                marginLeft: '0.75rem',
                marginRight: '1rem'
              }}
            >
              {/* Header com Total */}
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tempo de Treino</h3>
                </div>
                <div className={`text-3xl font-bold sm:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {(() => {
                    if (!userProgress) {
                      return '0min';
                    }
                    
                    // Usar dados já carregados
                    const totalFromBars = weeklyTimeTotal;
                    const hours = Math.floor(totalFromBars / 60);
                    const remainingMinutes = Math.round(totalFromBars % 60);
                    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${Math.round(totalFromBars)}min`;
                  })()}
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {(() => {
                    if (!userProgress) {
                      return 'Meta: 5h · 0%';
                    }
                    // Usar dados já carregados
                    const totalFromBars = weeklyTimeTotal;
                    
                    const percentage = Math.min(Math.round((totalFromBars / 300) * 100), 100);
                    return `Meta: 5h · ${percentage}%`;
                  })()}
                </p>
              </div>

              {/* Gráfico de Barras - 7 dias da semana */}
              <div className="flex items-end justify-between gap-1.5 h-24 mb-2 sm:gap-2">
                {(() => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay()); // Domingo
                  
                  return Array.from({ length: 7 }, (_, index) => {
                    const currentDate = new Date(startOfWeek);
                    currentDate.setDate(startOfWeek.getDate() + index);
                    const isToday = currentDate.toDateString() === today.toDateString();
                    // Obter tempo real de treino para o dia
                    const dateString = getLocalDateString(currentDate);
                    const dayMinutes = weeklyTimeData[dateString] || 0;
                    const maxMinutes = 60;
                    const heightPercent = Math.max((dayMinutes / maxMinutes) * 100, 5);
                    
                    return (
                      <div 
                        key={index} 
                        className="flex flex-col items-center flex-1 group relative cursor-pointer"
                        onClick={() => setSelectedWorkoutTimeDay(selectedWorkoutTimeDay === index ? null : index)}
                      >
                        {/* Container com fundo cinza (fundo da barra) */}
                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-t-lg relative overflow-hidden">
                          {/* Barra de progresso (preenchimento) - só aparece se houver tempo */}
                          {dayMinutes > 0 && (
                            <div 
                              className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-500 ${
                                isToday 
                                  ? 'bg-gradient-to-t from-blue-500 to-blue-400' 
                                  : isDarkMode ? 'bg-gradient-to-t from-blue-600/80 to-blue-500/60' : 'bg-gradient-to-t from-blue-400/90 to-blue-300/70'
                              } ${isToday ? 'shadow-lg' : ''}`}
                              style={{ height: `${heightPercent}%` }}
                            >
                              {isToday && (
                                <div className="w-full h-3 bg-white/30 rounded-full mt-1"></div>
                              )}
                            </div>
                          )}
                          
                          {/* Indicador de meta (ponto branco no topo) - sempre visível */}
                          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-30"></div>
                        </div>
                        
                        {/* Balão com ícone de relógio e tempo - só aparece no dia selecionado */}
                        {selectedWorkoutTimeDay === index && (
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2 z-20">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                <Clock className="w-2.5 h-2.5 text-white" />
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {dayMinutes > 0 ? `${dayMinutes}min` : '0min'}
                              </span>
                            </div>
                            {/* Seta do balão */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white dark:border-t-gray-800"></div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Labels dos dias */}
              <div className="flex justify-between">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                  const today = new Date();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - today.getDay());
                  const currentDate = new Date(startOfWeek);
                  currentDate.setDate(startOfWeek.getDate() + index);
                  const isToday = currentDate.toDateString() === today.toDateString();
                  
                  return (
                    <div key={index} className="flex-1 text-center">
                      <span className={`text-xs font-medium ${
                        isToday 
                          ? 'text-blue-500' 
                          : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        </div>

        <HabitTrackerSection currentUser={currentUser} isDarkMode={isDarkMode} addToast={addToast} />

        {/* Container de Suporte */}
        <div className="mt-6 mb-6 -mx-4 sm:-mx-6">
          <div 
            className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}
            style={{
              width: 'min(calc(100vw - 2rem), 28rem)',
              maxWidth: '28rem',
              marginLeft: '1rem',
              marginRight: '1rem'
            }}
          >
            <div className="flex items-start gap-4">
              {/* Ícone de Fone de Ouvido */}
              <div className={`w-16 h-16 ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Headphones className={`w-8 h-8 ${isDarkMode ? 'text-orange-500' : 'text-orange-600'}`} />
              </div>

              {/* Texto e Link */}
              <div className="min-w-0 flex-1 pt-1">
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mb-2`}>
                  <span className="font-bold">Precisa de ajuda?</span> Estamos sempre
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} mb-3`}>
                  aqui para ajudar.
                </p>
                <a
                  href="https://wa.me/5511994252678"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1 text-sm font-medium ${isDarkMode ? 'text-orange-500 hover:text-orange-400' : 'text-orange-600 hover:text-orange-700'} transition-colors`}
                >
                  Falar com suporte →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

function findTrainingMatches(trainingId, trainingsData) {
  if (!trainingsData?.sections) {
    return [];
  }

  const matches = [];

  trainingsData.sections.forEach((section) => {
    section.trainings?.forEach((training) => {
      if (training?.id === trainingId) {
        matches.push({ training, sectionId: section.id });
      }
    });
  });

  return matches;
}

function buildProgressContext(progressOverride) {
  const progress = progressOverride || {};
  const completedVideos = Array.isArray(progress.completedVideos) ? progress.completedVideos : [];

  const completedSet = new Set();
  completedVideos.forEach((videoKey) => {
    if (typeof videoKey === 'string' && videoKey.trim().length > 0) {
      completedSet.add(videoKey);
    }
  });

  return {
    progress,
    completedSet,
  };
}

function extractTrainingVideos(training) {
  if (!training?.modules || !Array.isArray(training.modules)) {
    return [];
  }

  const allVideos = training.modules.flatMap((module) => collectModuleVideos(training, module));
  
  // Filtrar vídeos de apresentação (que contêm "Apresentação" no título)
  return allVideos.filter(video => {
    const isPresentation = video.videoTitle && video.videoTitle.toLowerCase().includes('apresentação');
    return !isPresentation;
  });
}

function collectModuleVideos(training, module) {
  if (!module) {
    return [];
  }

  const moduleId = normalizeModuleId(module);
  const moduleTitle = module.title || training.title;
  const videos = [];

  if (Array.isArray(module.videos) && module.videos.length > 0) {
    module.videos.forEach((video) => {
      const videoId =
        video?.youtubeId ||
        video?.videoId ||
        video?.id ||
        (video?.videoUrl ? getYouTubeVideoId(video.videoUrl) : null) ||
        (video?.url ? getYouTubeVideoId(video.url) : null);

      if (!videoId) {
        return;
      }

      const duration = safeDuration(video?.duration || module?.duration, videoId);
      const calories = safeCalories(video?.calories || module?.calories, duration, videoId);

      videos.push({
        trainingId: training.id,
        trainingTitle: training.title,
        moduleId,
        moduleTitle,
        videoId,
        videoTitle: video?.title || moduleTitle,
        duration,
        calories,
        imageUrl: pickImageSource(training, module, video),
      });
    });

    return videos;
  }

  const singleVideoId =
    module?.youtubeId ||
    module?.videoId ||
    (module?.videoUrl ? getYouTubeVideoId(module.videoUrl) : null) ||
    (module?.url ? getYouTubeVideoId(module.url) : null);

  if (!singleVideoId) {
    return videos;
  }

  const duration = safeDuration(module?.duration, singleVideoId);
  const calories = safeCalories(module?.calories, duration, singleVideoId);

  videos.push({
    trainingId: training.id,
    trainingTitle: training.title,
    moduleId,
    moduleTitle,
    videoId: singleVideoId,
    videoTitle: module?.title || training.title,
    duration,
    calories,
    imageUrl: pickImageSource(training, module),
  });

  return videos;
}

function normalizeModuleId(module) {
  return (
    module?.id ||
    module?.moduleId ||
    module?.slug ||
    module?.identifier ||
    module?.key ||
    'default'
  );
}

function hasCompletedVideo(context, trainingId, moduleId, videoId) {
  if (!context || !trainingId || !videoId) {
    return false;
  }

  const directKey = buildVideoKey(trainingId, moduleId, videoId);
  if (directKey && context.completedSet.has(directKey)) {
    return true;
  }

  const fallbackKeys = [
    buildVideoKey(trainingId, 'default', videoId),
    buildVideoKey(trainingId, moduleId, 'undefined'),
    `${trainingId}-undefined-${videoId}`,
  ];

  return fallbackKeys.some((key) => key && context.completedSet.has(key));
}

function buildVideoKey(trainingId, moduleId, videoId) {
  if (!trainingId || !videoId) {
    return null;
  }

  const normalizedModule = moduleId || 'default';
  return `${trainingId}-${normalizedModule}-${videoId}`;
}

function safeDuration(duration, videoId) {
  if (typeof duration === 'string' && duration.trim().length > 0) {
    return duration;
  }

  if (videoId) {
    const calculated = getVideoDuration(videoId);
    if (calculated) {
      return calculated;
    }
  }

  return '30 min';
}

function safeCalories(calories, duration, videoId) {
  if (typeof calories === 'number' && !Number.isNaN(calories)) {
    return `${calories} kcal`;
  }

  if (videoId) {
    const fixedCalories = getVideoCalories(videoId);
    if (fixedCalories) {
      return `${fixedCalories} kcal`;
    }
  }

  if (duration) {
    const estimatedCalories = getCaloriesByDuration(duration);
    if (estimatedCalories) {
      return `${estimatedCalories} kcal`;
    }
  }

  return null;
}

function pickImageSource(training, module, video) {
  // Para listagem no Dashboard (carrossel "Treinos para hoje") usamos bannerImageUrl quando existir
  const forDashboard = !module && !video;
  if (forDashboard && training?.bannerImageUrl) {
    return training.bannerImageUrl;
  }
  return (
    video?.thumbnail ||
    video?.coverImage ||
    module?.coverImage ||
    module?.thumbnail ||
    training?.coverImage ||
    training?.bannerImage ||
    training?.thumbnail ||
    training?.imageUrl ||
    null
  );
}

export default Dashboard;
