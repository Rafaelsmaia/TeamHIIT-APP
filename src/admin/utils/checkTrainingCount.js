/**
 * Script para verificar se os treinos do módulo "Superiores com halteres" 
 * estão sendo contabilizados corretamente
 */

import { getVideoDuration, getVideoCalories } from '../../utils/VideoDurations.js';
import { getYouTubeVideoId } from '../../utils/mediaHelpers.js';

// Vídeos do módulo "TREINOS PARA SUPERIORES" (treino-superiores)
const SUPERIORES_VIDEOS = [
  { title: "Apresentação Treinos para Superiores", videoUrl: "https://youtu.be/YwfID-z9fAU" },
  { title: "Treino 1", videoUrl: "https://youtu.be/vuFEz7VsQ_I" },
  { title: "Treino 2", videoUrl: "https://youtu.be/rvDigTmuqVs" },
  { title: "Treino 3", videoUrl: "https://youtu.be/5Ca3miEvOjo" },
  { title: "Treino 4", videoUrl: "https://youtu.be/EJjaCCo1zYY" },
  { title: "Treino 5", videoUrl: "https://youtu.be/HMun_-BJrjg" },
  { title: "Treino 6", videoUrl: "https://youtu.be/2K_jHsr9jkQ" },
  { title: "Treino 7", videoUrl: "https://youtu.be/r57d1vi7Pho" },
  { title: "Treino 8", videoUrl: "https://youtu.be/c75yHYXecVk" },
  { title: "Treino 9", videoUrl: "https://youtu.be/qKTPp2-9rbc" },
  { title: "Treino 10", videoUrl: "https://youtu.be/UW7gNCZWIFA" },
  { title: "Treino 11", videoUrl: "https://youtu.be/UsLu9MvUMzA" },
  { title: "Treino 12", videoUrl: "https://youtu.be/pAVqw8mpV3E" },
  { title: "Treino 13", videoUrl: "https://youtu.be/ndsT0Zb8iEA" }
];

export function checkSuperioresTrainingCount(userProgress) {
  if (!userProgress) {
    return {
      isValid: false,
      message: 'Nenhum progresso encontrado',
      details: {}
    };
  }

  const trainingId = 'treino-superiores';
  const moduleId = 'default'; // O sistema usa 'default' como moduleId padrão
  
  const results = {
    trainingId,
    moduleId,
    totalVideos: SUPERIORES_VIDEOS.length,
    videosWithDuration: 0,
    videosWithCalories: 0,
    completedVideos: [],
    missingDurations: [],
    missingCalories: [],
    totalDuration: 0,
    totalCalories: 0,
    lastAccessInfo: null
  };

  // Verificar se há acesso registrado para este treino
  if (userProgress.lastAccessedVideos && userProgress.lastAccessedVideos[trainingId]) {
    results.lastAccessInfo = userProgress.lastAccessedVideos[trainingId];
  }

  // Verificar cada vídeo
  SUPERIORES_VIDEOS.forEach((video, index) => {
    const youtubeId = getYouTubeVideoId(video.videoUrl);
    const videoKey = `${trainingId}-${moduleId}-${youtubeId}`;
    
    // Verificar se está completo
    const isCompleted = userProgress.completedVideos?.includes(videoKey) || false;
    
    // Verificar duração
    const duration = getVideoDuration(youtubeId);
    const hasDuration = duration && duration !== 'N/A' && duration !== '0 min';
    
    // Verificar calorias
    const calories = getVideoCalories(youtubeId);
    const hasCalories = calories && calories > 0;
    
    if (isCompleted) {
      results.completedVideos.push({
        index: index + 1,
        title: video.title,
        youtubeId,
        videoKey,
        duration,
        calories,
        hasDuration,
        hasCalories
      });
      
      if (hasDuration) {
        results.videosWithDuration++;
        const minutes = parseInt(duration.replace(' min', ''), 10) || 0;
        results.totalDuration += minutes;
      }
      
      if (hasCalories) {
        results.videosWithCalories++;
        results.totalCalories += calories;
      }
      
      if (!hasDuration) {
        results.missingDurations.push({ title: video.title, youtubeId });
      }
      
      if (!hasCalories) {
        results.missingCalories.push({ title: video.title, youtubeId });
      }
    }
  });

  // Verificar se está sendo contabilizado no lastAccessedVideos
  const isInLastAccessed = !!results.lastAccessInfo;
  const lastAccessVideoId = results.lastAccessInfo?.videoId;
  
  // Verificar se o vídeo do lastAccess está na lista
  const lastAccessVideo = SUPERIORES_VIDEOS.find(v => {
    const id = getYouTubeVideoId(v.videoUrl);
    return id === lastAccessVideoId;
  });

  return {
    isValid: results.completedVideos.length > 0,
    message: results.completedVideos.length > 0 
      ? `✅ ${results.completedVideos.length} treinos completados encontrados`
      : '⚠️ Nenhum treino deste módulo foi completado ainda',
    details: {
      ...results,
      isInLastAccessed,
      lastAccessVideo: lastAccessVideo ? lastAccessVideo.title : null,
      summary: {
        completed: results.completedVideos.length,
        total: results.totalVideos,
        totalDurationMinutes: results.totalDuration,
        totalCalories: results.totalCalories,
        hasLastAccess: isInLastAccessed,
        missingDurationsCount: results.missingDurations.length,
        missingCaloriesCount: results.missingCalories.length
      }
    }
  };
}
