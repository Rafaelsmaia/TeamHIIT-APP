import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  Clock,
  Play,
  Search
} from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import InstantImage from '../components/InstantImage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { useTrainingsData } from '../hooks/useTrainingsData.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import progressManager from '../utils/ProgressManager.js';
import BottomNavigation from '../components/ui/BottomNavigation.jsx';
import Header from '../components/ui/Header.jsx';
import { getYouTubeVideoId } from '../utils/mediaHelpers.js';

const TeamHIIT = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();
  
  // Estados principais
  const [user, setUser] = useState(null);
  
  // Usar o hook personalizado para carregar dados dos treinos
  const { data: trainingsData, loading: trainingsLoading } = useTrainingsData();
  
  // Usar o hook de tema
  const { isDarkMode } = useTheme();

  // Scroll para o topo quando a página é carregada
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Carregar dados do usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserData(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, [auth]);

  // Simplificar lógica de loading - apenas aguardar dados dos treinos
  const loading = !user || trainingsLoading;

  const sectionsToDisplay = trainingsData?.sections?.filter(
    (section) => section.title !== "CANAIS DE SUPORTE" && section.title !== "CRONOGRAMAS SEMANAIS"
  ).map(section => ({
    ...section,
    trainings: section.trainings?.filter(
      (training) => training.id !== "canais-suporte-card" && 
                   training.title !== "SUPORTE" && 
                   training.title !== "CANAIS DE SUPORTE"
    ) || []
  })) || [];

  // Carregar dados do usuário
  const loadUserData = async (userId) => {
    try {
      const userDoc = doc(db, 'users', userId);
      const userData = await getDoc(userDoc);
      if (userData.exists()) {
        const data = userData.data();
        // Dados básicos do usuário se necessário no futuro
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  // Função auxiliar para normalizar moduleId
  const normalizeModuleId = (module) => {
    return (
      module?.id ||
      module?.moduleId ||
      module?.slug ||
      module?.identifier ||
      module?.key ||
      'default'
    );
  };

  // Função auxiliar para construir a chave do vídeo
  const buildVideoKey = (trainingId, moduleId, videoId) => {
    if (!trainingId || !videoId) {
      return null;
    }
    const normalizedModule = moduleId || 'default';
    return `${trainingId}-${normalizedModule}-${videoId}`;
  };

  // Função auxiliar para construir contexto de progresso
  const buildProgressContext = (progress) => {
    const completedVideos = Array.isArray(progress?.completedVideos) ? progress.completedVideos : [];
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
  };

  // Função auxiliar para verificar se vídeo foi concluído
  const hasCompletedVideo = (context, trainingId, moduleId, videoId) => {
    if (!context || !trainingId || !videoId) {
      return false;
    }

    const directKey = buildVideoKey(trainingId, moduleId, videoId);
    if (directKey && context.completedSet.has(directKey)) {
      return true;
    }

    // Fallback: tentar outras variações da chave
    const fallbackKeys = [
      buildVideoKey(trainingId, 'default', videoId),
      buildVideoKey(trainingId, moduleId, 'undefined'),
      `${trainingId}-undefined-${videoId}`,
    ];

    return fallbackKeys.some((key) => key && context.completedSet.has(key));
  };

  // Função auxiliar para coletar vídeos de um módulo
  const collectModuleVideos = (training, module) => {
    if (!module) {
      return [];
    }

    const moduleId = normalizeModuleId(module);
    const moduleTitle = module.title || training.title;
    const videos = [];

    // Se o módulo tem um array de vídeos
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

        videos.push({
          trainingId: training.id,
          moduleId,
          moduleTitle,
          videoId,
          videoTitle: video?.title || moduleTitle,
        });
      });

      return videos;
    }

    // Se o módulo tem um único vídeo (videoUrl direto no módulo)
    const singleVideoId =
      module?.youtubeId ||
      module?.videoId ||
      (module?.videoUrl ? getYouTubeVideoId(module.videoUrl) : null) ||
      (module?.url ? getYouTubeVideoId(module.url) : null);

    if (!singleVideoId) {
      return videos;
    }

    videos.push({
      trainingId: training.id,
      moduleId,
      moduleTitle,
      videoId: singleVideoId,
      videoTitle: module?.title || training.title,
    });

    return videos;
  };

  // Função para extrair todos os vídeos de um treino
  const extractTrainingVideos = (training) => {
    if (!training?.modules || !Array.isArray(training.modules)) {
      return [];
    }

    const allVideos = training.modules.flatMap((module) => collectModuleVideos(training, module));
    
    // Filtrar vídeos de apresentação (que contêm "Apresentação" no título)
    return allVideos.filter(video => {
      const isPresentation = video.videoTitle && video.videoTitle.toLowerCase().includes('apresentação');
      return !isPresentation;
    });
  };

  // Função para encontrar o próximo vídeo não concluído (OTIMIZADA)
  const getNextVideoInTraining = (trainingId) => {
    const progress = progressManager.getProgress();
    if (!progress || !trainingsData?.sections) {
      return null;
    }

    // Encontrar o treino nos dados
    let foundTraining = null;
    for (const section of trainingsData.sections) {
      for (const training of section.trainings) {
        if (training.id === trainingId) {
          foundTraining = training;
          break;
        }
      }
      if (foundTraining) break;
    }

    if (!foundTraining) {
      return null;
    }

    // Construir contexto de progresso
    const context = buildProgressContext(progress);

    // Extrair todos os vídeos do treino
    const videos = extractTrainingVideos(foundTraining);
    if (!videos.length) {
      return null;
    }

    // Encontrar o primeiro vídeo não concluído
    for (const video of videos) {
      if (!hasCompletedVideo(context, trainingId, video.moduleId, video.videoId)) {
        return {
          trainingId: video.trainingId,
          videoId: video.videoId,
        };
      }
    }

    // Se todos os vídeos foram concluídos, retornar null (ou o primeiro vídeo se quiser reiniciar)
    return null;
  };

  // Função para verificar se o usuário tem progresso no treino
  const hasProgressInTraining = (trainingId) => {
    const progress = progressManager.getProgress();
    if (!progress || !progress.completedVideos) return false;
    
    // Verificar se há vídeos concluídos neste treino
    return progress.completedVideos.some(videoKey => 
      videoKey.startsWith(`${trainingId}-`)
    );
  };


  // Função para navegar para o treino (OTIMIZADA)
  const handleTrainingClick = (training) => {
    // Não permitir clique em treinos "EM BREVE"
    if (training.comingSoon) {
      return;
    }

    if (training.externalUrl) {
      window.open(training.externalUrl, '_blank');
      return;
    }

    // SEMPRE tentar encontrar o próximo vídeo não concluído primeiro
    // Isso garante que mesmo sem progresso explícito, vamos para o primeiro vídeo
      const nextVideo = getNextVideoInTraining(training.id);
    
      if (nextVideo) {
      // Ir direto para o player com o próximo vídeo não concluído
      navigate(`/player/${nextVideo.trainingId}/${nextVideo.videoId}`, { replace: true });
        return;
    }

    // Se não encontrou próximo vídeo (todos concluídos ou sem vídeos), 
    // ir para a página de overview do treino
    navigate(`/video/${training.id}`);
  };

  // Função para determinar cores das categorias
  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'força':
      case 'específico':
        return 'from-blue-500 to-blue-600';
      case 'cardio':
      case 'hiit':
      case 'desafio':
        return 'from-red-500 to-orange-500';
      case 'guia':
      case 'suporte':
        return 'from-green-500 to-teal-500';
      default:
        return 'from-purple-500 to-pink-500';
    }
  };

  if (!user) {
    return <LoadingSpinner message="Carregando..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Carregando treinos..." />;
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      {/* Header */}
      <Header />
      
      <div className="main-content pt-[4.5rem] pb-32">
        <div className="space-y-6">
          
          {/* Seções de Treinos */}
          {sectionsToDisplay.map((section, sectionIndex) => (
            <div key={section.id}>
              <div className="px-6">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {section.title}
                </h2>
                {section.description && (
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>{section.description}</p>
                )}
              </div>
              
              {section.trainings.length > 0 ? (
                <div className="overflow-x-auto md:overflow-visible scrollbar-hide">
                  <div className="flex gap-4 md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 md:gap-6 pl-6 md:pl-0">
                    {section.trainings.map((training, trainingIndex) => (
                      <div
                        key={training.id}
                        className={`relative rounded-xl shadow-lg overflow-hidden transform transition-transform duration-300 flex-shrink-0 w-48 md:w-auto aspect-[3/4] ${
                          training.comingSoon 
                            ? 'cursor-not-allowed opacity-90' 
                            : 'cursor-pointer hover:scale-105 hover:shadow-xl'
                        } ${trainingIndex === section.trainings.length - 1 ? 'pr-6 md:pr-0' : ''}`}
                        onClick={() => handleTrainingClick(training)}
                        title={training.title}
                      >
                        {/* Imagem de fundo cobrindo todo o card */}
                        <div className="absolute inset-0 w-full h-full">
                          <InstantImage
                            src={training.imageUrl ? `/${training.imageUrl}` : "/IMAGES/CAPAS TEAM HIIT/capa TH.png"}
                            alt={training.title}
                            className="w-full h-full"
                            style={{ objectFit: 'cover', objectPosition: 'center' }}
                            darkMode={isDarkMode}
                          />
                        </div>
                        
                        {/* Overlay escuro para "EM BREVE" */}
                        {training.comingSoon && (
                          <>
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 px-5 py-2.5 rounded-lg shadow-2xl transform -rotate-3 transition-all duration-300 hover:scale-110 border-2 border-white/20">
                                <span className="text-white font-bold text-sm md:text-base tracking-widest drop-shadow-lg">
                                  EM BREVE
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {/* Título invisível apenas para identificação (acessibilidade/SEO) */}
                        <h3 className="sr-only">{training.title}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800 rounded-full mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-200 mb-2">Nenhum treino encontrado</h3>
                  <p className="text-gray-400">Nenhum treino disponível nesta categoria no momento.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default TeamHIIT;
