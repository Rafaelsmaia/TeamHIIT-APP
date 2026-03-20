import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, User, Send, MessageCircle, Lock, Crown, MoreHorizontal, Play } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { reportContent, blockUser, loadBlockedUserIds } from '../services/ModerationService';
import Header from '../components/ui/Header.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import useVideoCompletion from '../hooks/useVideoCompletion.js';
import { usePWAAuth } from '../hooks/UsePWAAuth.js';
import progressManager from '../utils/ProgressManager.js';
import { getVideoDuration } from '../utils/VideoDurations.js';
import InstantImage from '../components/InstantImage.jsx';
import NativeVideoLaunchCard from '../components/NativeVideoLaunchCard.jsx';
import {
  buildYouTubeEmbedUrl,
  openYouTubeInPreferredExperience,
  shouldUseNativeVideoExperience,
} from '../utils/mediaHelpers.js';

// Helper function to get YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp = /^.*(?:youtu.be\/|v\/|e\/|embed\/|watch\?v=|youtube.com\/user\/[^\/]+\/|youtube.com\/\?v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[1].length === 11) ? match[1] : null;
};

// Função para obter duração usando o novo sistema
const getVideoDurationFromUrl = (videoUrl) => {
  if (!videoUrl) {
    return '30 min';
  }

  let youtubeId = getYouTubeVideoId(videoUrl);
  if (!youtubeId && videoUrl.length === 11 && !videoUrl.includes('/')) {
    youtubeId = videoUrl;
  }

  if (!youtubeId) {
    return '30 min';
  }

  return getVideoDuration(youtubeId);
};

function TrainingOverview() {
  const { moduleId, videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [videoData, setVideoData] = useState(null);
  const [training, setTraining] = useState(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const { isSubscriber } = usePWAAuth();
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [blockedUserIds, setBlockedUserIds] = useState(new Set());
  const [openMenuForComment, setOpenMenuForComment] = useState({});
  const [shouldShowPresentation, setShouldShowPresentation] = useState(true);
  const contentTopInsetStyle = {
    paddingTop: 'calc(4.75rem + env(safe-area-inset-top, 0px))'
  };
  
  const auth = getAuth();
  const db = getFirestore();

  // Hook para gerenciar conclusão de vídeos
  useVideoCompletion(
    videoId,
    location.state?.trainingId || 'comece-aqui',
    moduleId || 'intro',
    (completionData) => {
      console.log('🎉 Vídeo concluído:', completionData);
      
      // Disparar evento para notificar Dashboard
      const videoCompletedEvent = new CustomEvent('videoCompleted', {
        detail: {
          trainingId: location.state?.trainingId || 'comece-aqui',
          videoId,
          videoKey: `${location.state?.trainingId || 'comece-aqui'}-${moduleId || 'intro'}-${videoId}`,
          title: videoData?.title,
          progress: JSON.parse(localStorage.getItem('teamhiit_user_progress'))
        }
      });
      window.dispatchEvent(videoCompletedEvent);
      console.log('📡 [VideoPlayer] Evento videoCompleted disparado');
    }
  );

  useEffect(() => {
    // Monitor authentication state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Carregar bloqueios se usuário estiver logado
      if (currentUser) {
        try {
          const ids = await loadBlockedUserIds(currentUser.uid);
          setBlockedUserIds(ids);
        } catch (error) {
          console.error('Erro ao carregar usuários bloqueados:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [auth]);

  const normalizeTrainingImageUrl = (url) => {
    const fallback = '/IMAGES/CAPAS TEAM HIIT/capa TH.png';

    if (!url || typeof url !== 'string') {
      return fallback;
    }

    let normalized = url.trim();
    if (!normalized) {
      return fallback;
    }

    if (!normalized.startsWith('/')) {
      normalized = `/${normalized}`;
    }

    normalized = normalized.replace(/^\/CAPAS TEAM HIIT/, '/IMAGES/CAPAS TEAM HIIT');
    normalized = normalized.replace(/^\/CAPAS HORIZONTAIS/, '/IMAGES/CAPAS HORIZONTAIS');
    normalized = normalized.replace(/^\/LOGOS/, '/IMAGES/LOGOS');
    normalized = normalized.replace(/^\/IMAGES\/IMAGES\//, '/IMAGES/');

    const base = import.meta.env.BASE_URL || '/';
    const baseWithoutTrailingSlash = base.endsWith('/') ? base.slice(0, -1) : base;
    const pathWithLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;

    const builtUrl = `${baseWithoutTrailingSlash}${pathWithLeadingSlash}`;
    return builtUrl;
  };

  useEffect(() => {
    const fetchTrainingData = () => {
      console.log('🔍 VideoPlayer - Iniciando busca de dados do treino');
      
      // Buscar dados do programa baseado no ID da URL
      const pathParts = location.pathname.split('/');
      const trainingId = pathParts[2]; // /player/training-id/video-id ou /video/training-id/module-id
      const specificVideoId = pathParts[3]; // ID do vídeo específico se fornecido
      
      console.log('📋 VideoPlayer - Parâmetros da URL:', { pathParts, trainingId, specificVideoId });

      if (window.trainingsData && window.trainingsData.sections) {
        console.log('✅ VideoPlayer - Dados dos treinos carregados globalmente');
        console.log('📊 VideoPlayer - Total de seções:', window.trainingsData.sections.length);
        
        let foundTraining = null;
        let foundSection = null;

        // Buscar o treino em todas as seções
        for (const section of window.trainingsData.sections) {
          console.log(`🔍 VideoPlayer - Procurando em seção: ${section.title} (${section.id})`);
          console.log(`📝 VideoPlayer - Treinos nesta seção:`, section.trainings.map(t => ({ id: t.id, title: t.title })));
          
          foundTraining = section.trainings.find(t => t.id === trainingId);
          if (foundTraining) {
            foundSection = section;
            console.log('✅ VideoPlayer - Treino encontrado:', { 
              id: foundTraining.id, 
              title: foundTraining.title,
              section: section.title,
              hasModules: !!foundTraining.modules,
              modulesCount: foundTraining.modules?.length || 0
            });
            break;
          }
        }
        
        if (!foundTraining) {
          console.error('❌ VideoPlayer - Treino não encontrado:', trainingId);
          console.log('📋 VideoPlayer - Treinos disponíveis:', 
            window.trainingsData.sections.flatMap(s => s.trainings.map(t => ({ id: t.id, title: t.title })))
          );
        }

        if (foundTraining) {
          console.log('📊 VideoPlayer - Estrutura do treino encontrado:', {
            hasModules: !!foundTraining.modules,
            modulesCount: foundTraining.modules?.length || 0,
            modules: foundTraining.modules?.map(m => ({ title: m.title, hasVideoUrl: !!m.videoUrl })) || []
          });
          
          // Verificar se tem módulos válidos
          if (foundTraining.modules && foundTraining.modules.length > 0) {
            console.log('✅ VideoPlayer - Treino tem módulos válidos');
            
            // Verificar se é a primeira vez que o usuário acessa este treino
            const isFirstTimeAccess = progressManager.isFirstTimeAccessingTraining(trainingId);
            console.log('👤 VideoPlayer - Primeira vez acessando?', isFirstTimeAccess);
            // Se é a primeira vez, mostrar apresentação; senão, ir para onde parou
            setShouldShowPresentation(isFirstTimeAccess);
            
            // Processar módulos do treino
            const processedVideos = foundTraining.modules.map((module, index) => {
            const youtubeId = module.videoUrl ? getYouTubeVideoId(module.videoUrl) : module.youtubeId;
            
            // Aplicar sistema de duração real
            const realDuration = getVideoDurationFromUrl(module.videoUrl || youtubeId);
            
            return {
              id: `modulo-${index + 1}`,
              title: module.title,
              description: `${foundTraining.title} - ${module.title}`,
              videoUrl: module.videoUrl || (module.youtubeId ? `https://youtu.be/${module.youtubeId}` : null),
              youtubeId: youtubeId,
              duration: realDuration, // Usando duração real EXPANDIDA
              type: "Treino",
              moduleIndex: index // Adicionar índice para facilitar navegação
            };
          }).filter(video => video.youtubeId); // Filtrar apenas vídeos válidos

          setAllVideos(processedVideos);

          // LÓGICA DE NAVEGAÇÃO: Primeira vez vs. Retomar onde parou
          let currentIndex = 0;
          
          // PRIORIDADE 1: Se há um vídeo específico na URL (/player/trainingId/videoId)
          if (specificVideoId) {
            console.log('🎯 Vídeo específico solicitado na URL:', specificVideoId);
            const indexByYouTubeId = processedVideos.findIndex(v => v.youtubeId === specificVideoId);
            if (indexByYouTubeId !== -1) {
              currentIndex = indexByYouTubeId;
              setShouldShowPresentation(false); // Ir direto para o vídeo
              console.log('✅ Vídeo específico encontrado, indo direto para ele');
            } else {
              console.log('❌ Vídeo específico não encontrado, usando lógica padrão');
            }
          } else if (isFirstTimeAccess) {
            // Primeira vez: sempre começar no primeiro vídeo (apresentação)
            currentIndex = 0;
            console.log('🎬 Primeira vez acessando o treino - mostrando apresentação');
          } else {
            // Não é a primeira vez: ir para onde parou
            const lastAccessed = progressManager.getLastAccessedVideo(trainingId);
            if (lastAccessed) {
              // Buscar o vídeo onde parou
              const indexByModuleId = processedVideos.findIndex(v => v.id === lastAccessed.moduleId);
              if (indexByModuleId !== -1) {
                currentIndex = indexByModuleId;
                console.log('📍 Retomando onde parou:', lastAccessed);
              }
            }
          }
          
          // Se há parâmetros na URL, usar eles (sobrescreve a lógica acima)
          if (moduleId && videoId) {
            // Prioridade 1: Buscar por YouTube ID (mais específico)
            const indexByYouTubeId = processedVideos.findIndex(v => v.youtubeId === videoId);
            if (indexByYouTubeId !== -1) {
              currentIndex = indexByYouTubeId;
            } else {
              // Prioridade 2: Buscar por ID do módulo
              const indexByModuleId = processedVideos.findIndex(v => v.id === moduleId);
              if (indexByModuleId !== -1) {
                currentIndex = indexByModuleId;
              } else {
                // Prioridade 3: Buscar por índice numérico
                const moduleNumber = parseInt(moduleId.replace('modulo-', ''));
                if (!isNaN(moduleNumber) && moduleNumber > 0 && moduleNumber <= processedVideos.length) {
                  currentIndex = moduleNumber - 1;
                }
              }
            }
          } else if (moduleId) {
            // Apenas moduleId fornecido
            const indexByModuleId = processedVideos.findIndex(v => v.id === moduleId);
            if (indexByModuleId !== -1) {
              currentIndex = indexByModuleId;
            }
          }
          
          setCurrentVideoIndex(currentIndex);

          // Definir dados do vídeo atual
          const currentVideo = processedVideos[currentIndex];
          console.log('🎬 VideoPlayer - Definindo videoData:', { 
            currentIndex, 
            currentVideo: currentVideo ? { title: currentVideo.title, youtubeId: currentVideo.youtubeId } : null,
            shouldShowPresentation 
          });
          
          if (currentVideo) {
            console.log('🎬 VideoPlayer - Definindo videoData para vídeo específico:', {
              title: currentVideo.title,
              youtubeId: currentVideo.youtubeId,
              shouldShowPresentation
            });
            setVideoData({
              title: currentVideo.title,
              youtubeId: currentVideo.youtubeId,
              description: currentVideo.description,
              duration: currentVideo.duration, // Usando duração real EXPANDIDA
              level: foundTraining.level || 'Todos os níveis',
              instructor: 'Team HIIT',
              category: foundTraining.categories?.[0] || 'Treino'
            });
          } else {
            console.log('❌ VideoPlayer - currentVideo não encontrado');
            setVideoData(null);
          }

            setTraining({
              ...foundTraining,
              sectionTitle: foundSection?.title || 'Treinos',
              bannerImage: normalizeTrainingImageUrl(foundTraining.bannerImage || foundTraining.imageUrl || null)
            });
          } else {
            console.error('❌ VideoPlayer - Treino não tem módulos válidos:', {
              trainingId,
              hasModules: !!foundTraining.modules,
              modulesCount: foundTraining.modules?.length || 0
            });
            setTraining(null);
            setVideoData(null);
          }
        } else {
          console.error('❌ VideoPlayer - Treino não encontrado ou inválido:', trainingId);
          setTraining(null);
          setVideoData(null);
        }
      }
      
      setLoading(false);
    };

    // Verificar se os dados já estão carregados
    if (!window.trainingsData) {
      const script = document.createElement('script');
      script.src = '/trainings.js';
      script.onload = () => {
        fetchTrainingData();
      };
      script.onerror = () => {
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      fetchTrainingData();
    }
  }, [moduleId, videoId, location.pathname]);

  useEffect(() => {
    // Load comments for this video (apenas se for assinante)
    if (!videoData?.youtubeId || !isSubscriber) {
      setComments([]);
      return undefined;
    }

    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const videoComments = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(comment => comment.videoId === videoData.youtubeId);
      
      setComments(videoComments);
    });

    return () => unsubscribe();
  }, [videoData?.youtubeId, db, isSubscriber]);

  // CORREÇÃO: Função handleVideoSelect melhorada - MANTENDO LAYOUT ORIGINAL
  const handleVideoSelect = (video, index) => {
    if (!isSubscriber) {
      const shouldUpgrade = window.confirm(
        'Este conteúdo é exclusivo para assinantes do Team HIIT.\n\nGostaria de se tornar um assinante para acessar todo o conteúdo?'
      );
      
      if (shouldUpgrade) {
        window.open('https://wa.me/5511999999999?text=Olá! Gostaria de me tornar assinante do Team HIIT', '_blank');
      }
      return;
    }

    // Encontrar o índice real do vídeo na lista completa
    const realIndex = allVideos.findIndex(v => v.id === video.id);
    
    // Marcar vídeo como acessado para rastrear onde parou
    if (training?.id) {
      progressManager.markVideoAccessed(training.id, video.id, video.youtubeId);
    }
    
    // Atualizar estado imediatamente
    setCurrentVideoIndex(realIndex);
    setVideoData({
      title: video.title,
      youtubeId: video.youtubeId,
      description: video.description,
      duration: video.duration, // Usando duração real EXPANDIDA
      level: training?.level || 'Todos os níveis',
      instructor: 'Team HIIT',
      category: training?.categories?.[0] || 'Treino'
    });

    // Atualizar URL sem recarregar
    const newUrl = `/video/${training.id}/${video.id}/${video.youtubeId}`;
    
    // Usar pushState para atualizar URL sem recarregar
    window.history.pushState(null, '', newUrl);
  };

  // Verifica se o programa tem estrutura de semanas
  const hasWeekStructure = () => {
    if (!allVideos || allVideos.length === 0) return false;
    return allVideos.some(video => video.title && video.title.includes('Semana'));
  };

  // Obtém todas as semanas disponíveis
  const getAvailableWeeks = () => {
    if (!hasWeekStructure()) return [];
    const weeks = new Set();
    allVideos.forEach(video => {
      const match = video.title.match(/Semana (\d+)/);
      if (match) {
        weeks.add(parseInt(match[1]));
      }
    });
    return Array.from(weeks).sort((a, b) => a - b);
  };

  // Obtém vídeos da semana atual
  const getVideosToShow = () => {
    if (!allVideos || allVideos.length === 0) return [];
    
    if (hasWeekStructure()) {
      return allVideos.filter(video => 
        video.title.includes(`Semana ${currentWeek}`)
      );
    }
    
    return allVideos;
  };

  // Navegação entre semanas
  const navigateToWeek = (weekNumber) => {
    setCurrentWeek(weekNumber);
    // Resetar o índice do vídeo atual para o primeiro da nova semana
    setCurrentVideoIndex(0);
  };

  const navigateToPreviousWeek = () => {
    const availableWeeks = getAvailableWeeks();
    const currentIndex = availableWeeks.indexOf(currentWeek);
    if (currentIndex > 0) {
      setCurrentWeek(availableWeeks[currentIndex - 1]);
      setCurrentVideoIndex(0);
    }
  };

  const navigateToNextWeek = () => {
    const availableWeeks = getAvailableWeeks();
    const currentIndex = availableWeeks.indexOf(currentWeek);
    if (currentIndex < availableWeeks.length - 1) {
      setCurrentWeek(availableWeeks[currentIndex + 1]);
      setCurrentVideoIndex(0);
    }
  };

  // Navegação entre vídeos
  const navigateToNextVideo = () => {
    if (currentVideoIndex < allVideos.length - 1) {
      const nextVideo = allVideos[currentVideoIndex + 1];
      handleVideoSelect(nextVideo, currentVideoIndex + 1);
    }
  };

  const navigateToPreviousVideo = () => {
    if (currentVideoIndex > 0) {
      const previousVideo = allVideos[currentVideoIndex - 1];
      handleVideoSelect(previousVideo, currentVideoIndex - 1);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Você precisa estar logado para comentar');
      return;
    }

    if (!isSubscriber) {
      alert('Apenas assinantes podem comentar');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setSubmittingComment(true);

    try {
      await addDoc(collection(db, 'comments'), {
        videoId: videoData.youtubeId,
        text: newComment.trim(),
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || null,
        createdAt: serverTimestamp()
      });

      setNewComment('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      alert('Erro ao adicionar comentário. Tente novamente.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Agora';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const handleSubscriptionUpgrade = () => {
    window.open('https://wa.me/5511999999999?text=Olá! Gostaria de me tornar assinante do Team HIIT', '_blank');
  };

  // Filtrar apresentação e pegar o primeiro treino real para o botão "COMEÇAR PROJETO"
  const firstTrainingVideo = allVideos.find(video => {
    const isPresentation = video.title && video.title.toLowerCase().includes('apresentação');
    return !isPresentation;
  });
  const currentYouTubeId = videoData?.youtubeId || getYouTubeVideoId(videoData?.videoUrl);
  const shouldUseNativePlayerExperience = shouldUseNativeVideoExperience(currentYouTubeId);
  const youtubeEmbedUrl = buildYouTubeEmbedUrl(currentYouTubeId);
  const visibleComments = comments.filter(comment => !blockedUserIds.has(comment.userId));

  const handleOpenCurrentVideo = () => {
    if (!currentYouTubeId) {
      return;
    }

    void openYouTubeInPreferredExperience(currentYouTubeId);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center px-4" style={contentTopInsetStyle}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Carregando vídeo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!videoData || !training) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        <Header />
        <div className="container mx-auto max-w-full px-4 py-8" style={contentTopInsetStyle}>
          <div className="text-center">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Vídeo não encontrado</h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Não foi possível carregar os dados do vídeo. Verifique se o link está correto.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-black via-blue-900/20 to-blue-800/30 text-gray-100' : 'bg-white text-gray-900'} overflow-x-hidden`}>
      {/* Header Personalizado do Projeto */}
      <div
        className={`${isDarkMode ? 'bg-gradient-to-br from-black via-blue-900/20 to-blue-800/30 border-b border-gray-800' : 'bg-white border-b border-gray-200'} flex items-center justify-between px-4 pb-3`}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className={`${isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'} p-2 rounded-lg transition-colors`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className={`text-lg font-semibold text-center flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {training?.title || 'Treino'}
        </h1>
        <div className="w-10"></div> {/* Espaçador para centralizar */}
      </div>
      
      {/* Banner do Programa - Corrigido para mobile */}
      <div className="w-full relative overflow-hidden" style={{ height: '50vh' }}>
        <InstantImage
          src={training.bannerImage || '/IMAGES/CAPAS TEAM HIIT/capa TH.png'}
          alt={training.title}
          className="absolute inset-0"
          style={{ objectFit: 'cover', objectPosition: 'center' }}
          fallback="/IMAGES/CAPAS TEAM HIIT/capa TH.png"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-center p-4 max-w-full">
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold mb-2 px-2">{training.title}</h1>
            <p className="text-base md:text-lg lg:text-xl opacity-90 max-w-3xl mx-auto px-4">
              {training.description || `Programa completo de ${training.title}`}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 px-2">
              <span className="bg-orange-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm flex items-center">
                <User className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                Team HIIT
              </span>
              <span className="bg-gray-700 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm flex items-center">
                <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                {training.duration}
              </span>
              <span className="bg-blue-500 text-white px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm">
                {training.sectionTitle}
              </span>
              {isSubscriber && (
                <span className="bg-yellow-500 text-black px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm flex items-center">
                  <Crown className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  Assinante
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-full overflow-x-hidden">
        <div className="container mx-auto px-4 py-8 max-w-full">


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-full">
            
            {/* Video Section */}
            <div className="lg:col-span-2 max-w-full overflow-hidden">
              <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg overflow-hidden border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                <div className={`p-4 md:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {shouldShowPresentation ? 'Apresentação' : videoData?.title || 'Treino'}
                  </h3>
                </div>
                <div className="p-4 md:p-6">
                  {shouldUseNativePlayerExperience ? (
                    <NativeVideoLaunchCard
                      videoId={currentYouTubeId}
                      title="Assistir treino"
                      description="O vídeo abre em uma janela integrada ao app para uma reprodução mais estável no iPhone."
                      buttonLabel="Abrir treino"
                      isDarkMode={isDarkMode}
                      onOpen={handleOpenCurrentVideo}
                    />
                  ) : (
                    <div className="relative w-full overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        className="absolute top-0 left-0 h-full w-full rounded-lg"
                        src={youtubeEmbedUrl}
                        title={videoData.title}
                        frameBorder="0"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  )}
                  
                  {/* Botão para marcar vídeo como concluído (para testes) */}
                </div>
              </div>

              {/* Botão COMEÇAR PROJETO / ENTRAR PRO TIME */}
              {firstTrainingVideo && (
                <div
                  className={`mt-6 rounded-2xl border p-3 shadow-xl backdrop-blur sm:p-4 ${
                    isDarkMode ? 'border-gray-800 bg-black/45' : 'border-gray-200 bg-white/95'
                  }`}
                  style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
                >
                  <div className="flex justify-center">
                  {isSubscriber ? (
                    <button
                      onClick={() => {
                        console.log('Botão COMEÇAR PROJETO clicado');
                        console.log('firstTrainingVideo:', firstTrainingVideo);
                        
                        if (firstTrainingVideo && firstTrainingVideo.youtubeId) {
                          const url = `/player/${training.id}/${firstTrainingVideo.youtubeId}`;
                          console.log('Navegando para:', url);
                          navigate(url);
                        } else {
                          console.log('Erro: firstTrainingVideo ou youtubeId não encontrado');
                        }
                      }}
                      className="min-h-[56px] w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:from-orange-600 hover:to-red-600 sm:w-auto sm:min-w-[280px] sm:px-8 sm:text-lg"
                    >
                      COMEÇAR PROJETO
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        window.open('https://teamhiit.com.br', '_blank');
                      }}
                      className="min-h-[56px] w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:from-orange-600 hover:to-red-600 sm:w-auto sm:min-w-[280px] sm:px-8 sm:text-lg"
                    >
                      ENTRAR PRO TIME
                    </button>
                  )}
                  </div>
                </div>
              )}


              {/* Comments Section - Apenas para assinantes */}
              {isSubscriber && visibleComments.length > 0 && (
                <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-lg mt-6 max-w-full overflow-hidden border ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className={`p-4 md:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <MessageCircle className={`w-5 h-5 md:w-6 md:h-6 mr-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <h3 className={`text-lg md:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Comentários ({visibleComments.length})</h3>
                    </div>
                  </div>

                  {/* Add Comment Form */}
                  {user ? (
                    <div className={`p-4 md:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <form onSubmit={handleSubmitComment} className="flex space-x-4">
                        <div className="flex-shrink-0">
                          <img
                            src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=f97316&color=fff`}
                            alt={user.displayName || user.email}
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Adicione um comentário..."
                            className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm md:text-base ${
                              isDarkMode 
                                ? 'border-gray-600 bg-gray-700 text-white' 
                                : 'border-gray-300 bg-gray-50 text-gray-900'
                            }`}
                            rows="3"
                          />
                          <div className="flex justify-end mt-3">
                            <button
                              type="submit"
                              disabled={!newComment.trim() || submittingComment}
                              className="flex items-center bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm md:text-base"
                            >
                              <Send className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                              {submittingComment ? 'Enviando...' : 'Comentar'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className={`p-4 md:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
                      <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Faça login para comentar</p>
                      <button
                        onClick={() => navigate('/form')}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                      >
                        Fazer Login
                      </button>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="p-4 md:p-6">
                    <div className="space-y-6">
                      {visibleComments.map((comment) => (
                        <div key={comment.id} className="flex space-x-4">
                          <div className="flex-shrink-0">
                            <img
                              src={comment.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.userName)}&background=f97316&color=fff`}
                              alt={comment.userName}
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                              <span className={`font-semibold text-sm md:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{comment.userName}</span>
                              <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatDate(comment.createdAt)}</span>
                              </div>
                              <div className="relative">
                                <button className="p-1 rounded hover:bg-gray-700" onClick={() => setOpenMenuForComment(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}>
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {openMenuForComment[comment.id] && (
                                  <div className={`absolute right-0 mt-2 w-44 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg shadow-lg z-10`}>
                                    <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={async () => {
                                      await reportContent({ reporterId: user.uid, targetId: `${videoData.youtubeId}:${comment.id}`, targetAuthorId: comment.userId, type: 'video_comment', reason: 'inappropriate', context: { videoId: videoData.youtubeId } });
                                      setOpenMenuForComment(prev => ({ ...prev, [comment.id]: false }));
                                      alert('Comentário reportado.');
                                    }}>Reportar</button>
                                    <button className="w-full text-left px-3 py-2 hover:bg-gray-100" onClick={async () => {
                                      await blockUser({ userId: user.uid, blockedUserId: comment.userId });
                                      const ids = new Set(blockedUserIds); ids.add(comment.userId); setBlockedUserIds(ids);
                                      setOpenMenuForComment(prev => ({ ...prev, [comment.id]: false }));
                                      alert('Usuário bloqueado.');
                                    }}>Bloquear usuário</button>
                                  </div>
                                )}
                              </div>
                            </div>
                            <p className={`leading-relaxed text-sm md:text-base break-words ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 max-w-full overflow-hidden">
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainingOverview;

