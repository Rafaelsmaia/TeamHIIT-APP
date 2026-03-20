import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  BookOpen,
  SkipForward,
  Heart,
  MessageCircle,
  Send,
  Camera,
  Clock,
  Star,
  User,
  Share2,
  Play,
  Lock,
  Flame,
  ChevronRight,
} from 'lucide-react';
import Header from '../components/ui/Header.jsx';
import NativeVideoLaunchCard from '../components/NativeVideoLaunchCard.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import progressManager from '../utils/ProgressManager.js';
import { getVideoDuration } from '../utils/VideoDurations.js';
import { calculateCaloriesRange } from '../utils/VideoUtils.js';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  buildYouTubeEmbedUrl,
  openYouTubeInPreferredExperience,
  shouldUseNativeVideoExperience,
} from '../utils/mediaHelpers.js';

// Estilos CSS para animação do fogo
const fireAnimation = `
  @keyframes fireGlow {
    0%, 100% { 
      filter: drop-shadow(0 0 5px #ff6b35) drop-shadow(0 0 10px #ff6b35);
      transform: scale(1);
    }
    50% { 
      filter: drop-shadow(0 0 8px #ff6b35) drop-shadow(0 0 15px #ff6b35) drop-shadow(0 0 20px #ff8c42);
      transform: scale(1.05);
    }
  }
  
  @keyframes fireExtinguish {
    0% { 
      filter: drop-shadow(0 0 8px #ff6b35) drop-shadow(0 0 15px #ff6b35) drop-shadow(0 0 20px #ff8c42);
      transform: scale(1.05);
      opacity: 1;
    }
    50% { 
      filter: drop-shadow(0 0 3px #ff6b35) drop-shadow(0 0 5px #ff6b35);
      transform: scale(0.95);
      opacity: 0.7;
    }
    100% { 
      filter: none;
      transform: scale(0.9);
      opacity: 0.3;
    }
  }
  
  .fire-glow {
    animation: fireGlow 1.5s ease-in-out infinite;
  }
  
  .fire-extinguish {
    animation: fireExtinguish 1s ease-out forwards;
  }
`;

function VideoPlayerDedicated() {
  const { trainingId, videoId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [videoData, setVideoData] = useState(null);
  const [training, setTraining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [allVideos, setAllVideos] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isSubscriber, setIsSubscriber] = useState(true); // Assumindo que no player dedicado o usuário é assinante
  const [isCompleted, setIsCompleted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isLightingUp, setIsLightingUp] = useState(false);
  const [isExtinguishing, setIsExtinguishing] = useState(false);
  const [manualInteraction, setManualInteraction] = useState(false); // Controla se o usuário interagiu manualmente
  
  const videoRef = useRef(null);
  const playlistRef = useRef(null);
  const autoOpenedVideoRef = useRef(null);
  const pageContentStyle = {
    paddingTop: 'calc(4.75rem + env(safe-area-inset-top, 0px))'
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Resetar estado de conclusão quando o vídeo muda
    setIsCompleted(false);
    setVideoProgress(0);
    
    // Timeout para evitar carregamento infinito
    const timeoutId = setTimeout(() => {
      setTraining({ id: trainingId, title: `Projeto ${trainingId}` });
      setVideoData({
        title: generateVideoTitle(videoId, trainingId),
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        youtubeId: videoId,
        duration: '30:00',
        description: `Treino completo do ${trainingId}`,
        type: 'Treino'
      });
      setLoading(false);
    }, 10000); // 10 segundos de timeout
    
    const fetchVideoData = async () => {
      
      // 1) Tentar buscar treino e módulos direto do Firestore
      try {
        const q = query(collection(db, 'trainings'), where('id', '==', trainingId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          const fsTraining = { firestoreId: doc.id, ...doc.data() };

          if (Array.isArray(fsTraining.modules) && fsTraining.modules.length > 0) {
            clearTimeout(timeoutId);
            const categoryLabel = fsTraining.categories?.[0] || 'Treino';

            const processedVideos = fsTraining.modules.map((module, index) => {
              const youtubeId = module.videoUrl ? getYouTubeVideoId(module.videoUrl) : module.youtubeId;
              const realDuration = getVideoDuration(youtubeId);

              return {
                id: `modulo-${index + 1}`,
                title: module.title,
                description: `${fsTraining.title} - ${module.title}`,
                videoUrl: module.videoUrl || (module.youtubeId ? `https://youtu.be/${module.youtubeId}` : null),
                youtubeId,
                duration: realDuration,
                type: categoryLabel,
                moduleIndex: index,
              };
            });

            const filteredVideos = processedVideos.filter((video) => {
              const isPresentation = video.title && video.title.toLowerCase().includes('apresentação');
              return video.youtubeId && !isPresentation;
            });

            setTraining(fsTraining);
            setAllVideos(filteredVideos);

            let currentIndex = 0;
            if (videoId) {
              currentIndex = filteredVideos.findIndex((v) => v.youtubeId === videoId);
            }
            if (currentIndex < 0) currentIndex = 0;
            setCurrentVideoIndex(currentIndex);

            const currentVideo = filteredVideos[currentIndex];
            if (currentVideo) {
              setVideoData({
                title: currentVideo.title,
                videoUrl: currentVideo.videoUrl,
                youtubeId: currentVideo.youtubeId,
                duration: currentVideo.duration,
                description: currentVideo.description || 'Treino completo do Team HIIT',
                type: currentVideo.type || 'Treino',
              });
            }

            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('⚠️ VideoPlayerDedicated: erro ao carregar treino do Firestore, usando trainings.js como fallback', e);
      }

      // 2) Fallback: usar dados já carregados globalmente (trainings.js)
      // Se os dados já estão carregados globalmente, usar diretamente
      if (window.trainingsData && window.trainingsData.sections) {
        let foundTraining = null;
        let foundVideo = null;

        for (const section of window.trainingsData.sections) {
          
          // Busca mais flexível - por ID exato ou por título
          
          foundTraining = section.trainings.find(t => 
            t.id === trainingId || 
            t.id.toLowerCase().includes(trainingId.toLowerCase()) ||
            t.title.toLowerCase().includes(trainingId.toLowerCase())
          );
          
          if (foundTraining) {
          }
          
          if (foundTraining) {
            if (foundTraining.modules && foundTraining.modules.length > 0) {
              // Procurar por ID do YouTube ou ID do módulo
              foundVideo = foundTraining.modules.find(v => 
                v.youtubeId === videoId || 
                v.id === videoId || 
                v.title === videoId
              );
            }
            break;
          }
        }

        if (foundTraining) {
          clearTimeout(timeoutId);
          setTraining(foundTraining);
          
          // Processar todos os módulos do treino
          if (foundTraining.modules && foundTraining.modules.length > 0) {
            
            const categoryLabel = foundTraining.categories?.[0] || 'Treino';

            const processedVideos = foundTraining.modules.map((module, index) => {
              const youtubeId = module.videoUrl ? getYouTubeVideoId(module.videoUrl) : module.youtubeId;
              const realDuration = getVideoDuration(youtubeId);
              
              return {
                id: `modulo-${index + 1}`,
                title: module.title,
                description: `${foundTraining.title} - ${module.title}`,
                videoUrl: module.videoUrl || (module.youtubeId ? `https://youtu.be/${module.youtubeId}` : null),
                youtubeId: youtubeId,
                duration: realDuration,
                type: categoryLabel,
                moduleIndex: index
              };
            });
            
            
            // Filtrar vídeos: remover apresentação e manter apenas vídeos válidos
            const filteredVideos = processedVideos.filter(video => {
              // Remover vídeos de apresentação (que contêm "Apresentação" no título)
              const isPresentation = video.title && video.title.toLowerCase().includes('apresentação');
              // Manter apenas vídeos com YouTube ID válido e que não sejam apresentação
              return video.youtubeId && !isPresentation;
            });
            
            setAllVideos(filteredVideos);
            
            // Se não há videoId específico, usar o primeiro vídeo
            let currentIndex = 0;
            if (videoId) {
              currentIndex = filteredVideos.findIndex(v => v.youtubeId === videoId);
            }
            
            if (currentIndex < 0) currentIndex = 0;
            setCurrentVideoIndex(currentIndex);
            
            // Configurar dados do vídeo atual
            const currentVideo = filteredVideos[currentIndex];
            if (currentVideo) {
              setVideoData({
                title: currentVideo.title,
                videoUrl: currentVideo.videoUrl,
                youtubeId: currentVideo.youtubeId,
                duration: currentVideo.duration,
                description: currentVideo.description || 'Treino completo do Team HIIT',
                type: currentVideo.type || 'Treino'
              });
            }
          }
          
          setLoading(false);
        } else {
          
          // Fallback: usar dados mockados para teste
          clearTimeout(timeoutId);
          setTraining({ id: trainingId, title: `Projeto ${trainingId}` });
          setVideoData({
            title: generateVideoTitle(videoId, trainingId),
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            youtubeId: videoId,
            duration: '30:00',
            description: `Treino completo do ${trainingId}`,
            type: 'Treino'
          });
          setLoading(false);
        }
      } else {
        // Aguardar o carregamento global em vez de carregar o script novamente
        const checkInterval = setInterval(() => {
          if (window.trainingsData && window.trainingsData.sections) {
            clearInterval(checkInterval);
            fetchVideoData();
          }
        }, 100);

        // Timeout de segurança
        setTimeout(() => {
          if (loading) {
            console.warn('⚠️ VideoPlayerDedicated: Timeout ao aguardar dados dos treinos');
            clearInterval(checkInterval);
            setError('Erro ao carregar dados');
            setLoading(false);
          }
        }, 5000);
      }
    };

    fetchVideoData();
    
    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
    };
  }, [trainingId, videoId]);

  // Verificar se o vídeo já foi concluído quando o componente carrega
  useEffect(() => {
    if (trainingId && videoId) {
      // Usar o ProgressManager (import estático)
      const videoKey = `${trainingId}-default-${videoId}`;
      const isVideoAlreadyCompleted = progressManager.isVideoCompleted(trainingId, 'default', videoId);

      progressManager.markVideoAccessed(trainingId, 'default', videoId);

      if (isVideoAlreadyCompleted) {
        setIsCompleted(true);
        setVideoProgress(100);
      }
    }
  }, [trainingId, videoId]);

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(?:youtu.be\/|v\/|e\/|embed\/|watch\?v=|youtube.com\/user\/[^\/]+\/|youtube.com\/\?v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[1].length === 11) ? match[1] : null;
  };
  const currentYouTubeId = videoData?.youtubeId || getYouTubeVideoId(videoData?.videoUrl);
  const shouldUseNativePlayerExperience = shouldUseNativeVideoExperience(currentYouTubeId);
  const youtubeEmbedUrl = buildYouTubeEmbedUrl(currentYouTubeId);

  useEffect(() => {
    const experienceKey = `${trainingId || 'training'}:${currentYouTubeId || 'video'}`;

    if (!shouldUseNativePlayerExperience || !currentYouTubeId) {
      autoOpenedVideoRef.current = null;
      return;
    }

    if (autoOpenedVideoRef.current === experienceKey) {
      return;
    }

    autoOpenedVideoRef.current = experienceKey;
    void openYouTubeInPreferredExperience(currentYouTubeId);
  }, [currentYouTubeId, shouldUseNativePlayerExperience, trainingId]);

  // Removido: calculateCaloriesRange - agora usando VideoUtils.js

  // Removido: getVideoDuration - agora usando VideoUtils.js

  // Função para gerar título mais descritivo baseado no videoId
  const generateVideoTitle = (videoId, trainingId) => {
    // Mapear IDs conhecidos para títulos específicos
    const videoTitles = {
      'nNw3I_x5VfA': 'Treino 1',
      'dguwzqWv8J0': 'Treino 2',
      'IwDC3yAnLvE': 'Treino 3',
      '1_jzxLkuM_c': 'Treino 4',
      'h_D85tk5Xtc': 'Treino 5',
      'KmVOQI1eQJA': 'Treino 6',
      'b36K_GtmarM': 'Treino 7',
      'KFixxjv9aHA': 'Treino 8',
      'hrlFlNBBxbs': 'Treino 9',
    };

    // Se temos um título específico, usar ele
    if (videoTitles[videoId]) {
      return videoTitles[videoId];
    }

    // Caso contrário, gerar baseado no trainingId
    const trainingName = trainingId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `Treino ${videoId} - ${trainingName}`;
  };

  // Funções para o container "Próximos Treinos"
  const hasWeekStructure = () => {
    if (!allVideos || allVideos.length === 0) return false;
    return allVideos.some(video => video.title && video.title.includes('Semana'));
  };

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

  const getVideosToShow = () => {
    if (!allVideos || allVideos.length === 0) return [];
    
    if (hasWeekStructure()) {
      return allVideos.filter(video => 
        video.title.includes(`Semana ${currentWeek}`)
      );
    }
    
    return allVideos;
  };

  const navigateToWeek = (weekNumber) => {
    setCurrentWeek(weekNumber);
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

  const handleVideoSelect = (video, index) => {
    const realIndex = allVideos.findIndex(v => v.id === video.id);
    setCurrentVideoIndex(realIndex);
    setVideoData({
      title: video.title,
      videoUrl: video.videoUrl,
      youtubeId: video.youtubeId,
      duration: video.duration,
      description: video.description || 'Treino completo do Team HIIT',
      type: video.type || 'Treino'
    });
    
    // Resetar estados para o novo vídeo
    setIsCompleted(false);
    setIsLightingUp(false);
    setIsExtinguishing(false);
    setVideoProgress(0);
    setManualInteraction(false); // Resetar interação manual para o novo vídeo
    
    // Atualizar URL sem recarregar
    const newUrl = `/player/${trainingId}/${video.youtubeId}`;
    window.history.pushState(null, '', newUrl);
  };



  const handleComplete = async () => {
    setManualInteraction(true);

    if (isCompleted || !trainingId || !videoId) {
      return;
    }

    setIsLightingUp(true);

    try {
      const result = await progressManager.markVideoCompleted(trainingId, 'default', videoId);

      if (!result) {
        console.error('❌ [VideoPlayerDedicated] Falha ao marcar vídeo como concluído');
        setIsLightingUp(false);
        return;
      }

      const progressSnapshot = progressManager.getProgress();
      window.dispatchEvent(
        new CustomEvent('videoCompleted', {
          detail: {
            trainingId,
            videoId,
            videoKey: `${trainingId}-default-${videoId}`,
            title: videoData?.title,
            progress: progressSnapshot,
          },
        })
      );
    } catch (error) {
      console.error('❌ [VideoPlayerDedicated] Erro ao marcar vídeo como concluído:', error);
      setIsLightingUp(false);
      return;
    }

    setTimeout(() => {
      setIsCompleted(true);
      setIsLightingUp(false);
    }, 1000);
  };

  // Função para detectar progresso do vídeo
  const handleVideoProgress = () => {
    if (videoRef.current) {
      const iframe = videoRef.current;
      // Como é um iframe do YouTube, não podemos acessar diretamente o progresso
      // Vamos simular baseado no tempo decorrido
      // Em uma implementação real, você usaria a API do YouTube
    }
  };

  // Simular progresso do vídeo (em uma implementação real, isso viria da API do YouTube)
  useEffect(() => {
    if (videoData) {
      const progressInterval = setInterval(() => {
        setVideoProgress(prev => {
          const newProgress = prev + Math.random() * 5; // Simular progresso
          
          // Automação: acender o fogo aos 80% APENAS se o usuário não interagiu manualmente
          if (newProgress >= 80 && !isCompleted && !isLightingUp && !manualInteraction) {
            setIsLightingUp(true);
            setTimeout(() => {
              setIsCompleted(true);
              setIsLightingUp(false);
            }, 1000);
          }
          
          return Math.min(newProgress, 100);
        });
      }, 2000); // Atualizar a cada 2 segundos

      return () => clearInterval(progressInterval);
    }
  }, [videoData, isCompleted, isLightingUp, manualInteraction]);

  const handleNotebook = () => {
    // Abrir caderno de anotações
  };

  const handleNext = () => {
    
    if (!allVideos || allVideos.length === 0) {
      alert('Nenhum vídeo disponível!');
      return;
    }
    
    if (allVideos.length <= 1) {
      alert('Apenas 1 vídeo disponível!');
      return;
    }
    
    const nextIndex = currentVideoIndex + 1;
    
    let targetVideo;
    let targetIndex;
    
    if (nextIndex < allVideos.length) {
      // Há um próximo vídeo disponível
      targetVideo = allVideos[nextIndex];
      targetIndex = nextIndex;
    } else {
      // Não há mais vídeos, voltar para o primeiro
      targetVideo = allVideos[0];
      targetIndex = 0;
    }
    
    // Atualizar estados
    setCurrentVideoIndex(targetIndex);
    
    setVideoData({
      title: targetVideo.title,
      videoUrl: targetVideo.videoUrl,
      youtubeId: targetVideo.youtubeId,
      duration: targetVideo.duration,
    description: targetVideo.description || 'Treino completo do Team HIIT',
    type: targetVideo.type || 'Treino'
    });
    
    // Resetar estados para o novo vídeo
    setIsCompleted(false);
    setIsLightingUp(false);
    setIsExtinguishing(false);
    setVideoProgress(0);
    setManualInteraction(false);
    
    // Atualizar URL sem recarregar
    const newUrl = `/player/${trainingId}/${targetVideo.youtubeId}`;
    window.history.pushState(null, '', newUrl);
    
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      setComments([...comments, {
        id: Date.now(),
        user: 'Usuário',
        text: newComment,
        time: 'Agora'
      }]);
      setNewComment('');
    }
  };

  const handleOpenCurrentVideo = () => {
    if (!currentYouTubeId) {
      return;
    }

    void openYouTubeInPreferredExperience(currentYouTubeId);
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center px-4" style={pageContentStyle}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Carregando vídeo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !videoData || !training) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-gray-900'}`}>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center px-4" style={pageContentStyle}>
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{error || 'Vídeo não encontrado'}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-black via-blue-900/20 to-blue-800/30 text-white' : 'bg-white text-gray-900'}`}>
      {/* Adicionar estilos CSS */}
      <style>{fireAnimation}</style>
      
      
      {/* Header Personalizado do Projeto */}
      <div
        className={`${isDarkMode ? 'bg-black border-b border-gray-800' : 'bg-white border-b border-gray-200'} flex items-center justify-between px-4 pb-3`}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className={`${isDarkMode ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'} p-2 rounded-lg transition-colors`}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className={`text-lg font-semibold text-center flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {training?.title || 'Treino'}
        </h1>
        <div className="w-10"></div> {/* Espaçador para centralizar */}
      </div>

      {/* Video Player */}
      <div className="relative bg-black">
        {shouldUseNativePlayerExperience ? (
          <div className="p-4 sm:p-6">
            <NativeVideoLaunchCard
              videoId={currentYouTubeId}
              title="Treino em tela dedicada"
              description="No iPhone, o vídeo abre em uma janela integrada ao app para uma reprodução mais estável."
              buttonLabel="Abrir novamente"
              isDarkMode
              onOpen={handleOpenCurrentVideo}
            />
          </div>
          ) : (
          <div className="relative w-full aspect-video">
            <iframe
              ref={videoRef}
              className="h-full w-full"
              src={youtubeEmbedUrl}
              title={videoData.title}
              frameBorder="0"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          )}
      </div>

      {/* Video Information */}
      <div className="p-4">
        {/* Descrição removida por solicitação */}
        
        {/* Informações do Treino */}
        <div className="mt-4">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informações do Treino</h3>
            
            <div className="space-y-0">
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center text-gray-600">
                  <Clock className="w-4 h-4 mr-3" />
                  <span className="text-sm">Duração</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm">{videoData.duration}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-200">
                <div className="flex items-center text-gray-600">
                  <Flame className="w-4 h-4 mr-3" />
                  <span className="text-sm">Calorias</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm">{calculateCaloriesRange(videoData.duration)} kcal</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center text-gray-600">
                  <User className="w-4 h-4 mr-3" />
                  <span className="text-sm">Categoria</span>
                </div>
                <span className="font-semibold text-gray-900 text-sm">{videoData?.type || 'Treino'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className={`${isDarkMode ? 'border-y border-white/10 bg-black/55' : 'border-y border-gray-200 bg-white/95'} backdrop-blur`}
      >
        <div
          className="p-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
        <div className="flex items-center justify-between">
          <button 
            onClick={handleComplete}
            className={`flex flex-col items-center justify-center transition-all duration-500 transform ${
              isCompleted 
                ? 'text-orange-500 scale-105' 
                : isLightingUp
                  ? 'text-orange-400 scale-110'
                  : isExtinguishing
                    ? 'text-orange-300 scale-95'
                    : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Flame 
              className={`w-6 h-6 mb-1 transition-all duration-500 ${
                isCompleted 
                  ? 'text-orange-500 fire-glow' 
                  : isLightingUp
                    ? 'text-orange-400 fire-glow'
                    : isExtinguishing
                      ? 'text-orange-300 fire-extinguish'
                      : 'text-gray-600'
              }`} 
            />
            <span className={`text-xs font-medium transition-all duration-500 ${
              isCompleted || isLightingUp || isExtinguishing ? 'text-orange-500' : 'text-gray-600'
            }`}>
              {isCompleted ? 'Concluído' : 'Concluir'}
            </span>
          </button>
          
          <button 
            onClick={handleNext}
            disabled={!allVideos || allVideos.length <= 1}
            className="flex flex-col items-center justify-center text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Próximo</span>
          </button>
        </div>
        </div>
      </div>


      {/* Comments Section */}
      {comments.length > 0 && (
      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-4">Comentários</h3>
        
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-white">{comment.user}</span>
                  <span className="text-gray-400 text-sm">{comment.time}</span>
                </div>
                <p className="text-gray-300 text-sm">{comment.text}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <button className="text-gray-500 text-sm">Responder</button>
                  <button className="text-gray-500">⋯</button>
                  <button className="text-gray-500">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleComment} className="mt-4 flex items-center space-x-3">
          <button type="button" className="text-gray-500">
            <Camera className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Faça um comentário"
            className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-white placeholder-gray-400"
          />
          <button type="submit" className="text-orange-400">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
      )}

      {/* Próximos Treinos */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Próximos treinos</h3>
          </div>
          
          <div className="space-y-3">
            {allVideos.map((video, index) => {
              const isCompleted = progressManager.isVideoCompleted(
                trainingId, 'default', video.youtubeId
              );
              
              // Log temporário para debug
              if (index === 0) {
                console.log('🔍 [VideoPlayerDedicated] Primeiro vídeo na lista de próximos treinos:', {
                  trainingId,
                  videoId: video.id,
                  youtubeId: video.youtubeId,
                  videoTitle: video.title,
                  isCompleted,
                  videoKey: `${trainingId}-${video.youtubeId}-${video.youtubeId}`,
                });

                // Verificar progresso atual
                const progress = progressManager.getProgress();
                console.log('🔍 [VideoPlayerDedicated] Progresso atual ao montar próximos treinos:', progress);
              }
              
              return (
                <div 
                  key={video.id}
                  className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
                  onClick={() => {
                    // Navegar para a URL específica do vídeo
                    navigate(`/player/${trainingId}/${video.youtubeId}`);
                  }}
                >
                  {/* Capa do vídeo */}
                  <div className="w-16 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    <img 
                      src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Nome do treino */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-gray-900 font-medium truncate">{video.title}</h4>
                    <p className="text-gray-600 text-sm truncate">{video.description}</p>
                  </div>
                  
                  {/* Status de conclusão */}
                  <div className="flex-shrink-0">
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-blue-500' 
                          : 'bg-gray-300 border-2 border-gray-400'
                      }`}
                    >
                      {isCompleted && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

export default VideoPlayerDedicated;

