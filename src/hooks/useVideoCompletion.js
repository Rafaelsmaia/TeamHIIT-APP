import { useEffect, useCallback } from 'react';
import progressManager from '../utils/ProgressManager.js';

/**
 * Hook para gerenciar a conclusão de vídeos
 * Monitora eventos do YouTube Player API e marca vídeos como concluídos
 */
export const useVideoCompletion = (videoId, trainingId, moduleId, onVideoCompleted) => {
  
  // Função para marcar vídeo como concluído
  const markVideoAsCompleted = useCallback(async (videoId, trainingId, moduleId) => {
    try {
      console.log('🎯 Marcando vídeo como concluído:', { videoId, trainingId, moduleId });
      
      const success = await progressManager.markVideoCompleted(trainingId, moduleId, videoId);
      
      if (success) {
        console.log('✅ Vídeo marcado como concluído com sucesso');
        
        // Notificar o componente pai
        if (onVideoCompleted) {
          onVideoCompleted({
            videoId,
            trainingId,
            moduleId,
            completedAt: new Date().toISOString()
          });
        }
        
        return true;
      } else {
        console.warn('⚠️ Falha ao marcar vídeo como concluído');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao marcar vídeo como concluído:', error);
      return false;
    }
  }, [onVideoCompleted]);

  // Função para verificar se um vídeo já foi concluído
  const isVideoCompleted = useCallback((videoId, trainingId, moduleId) => {
    return progressManager.isVideoCompleted(trainingId, moduleId, videoId);
  }, []);

  // Função para simular conclusão (para testes)
  const simulateVideoCompletion = useCallback(() => {
    if (videoId && trainingId && moduleId) {
      markVideoAsCompleted(videoId, trainingId, moduleId);
    }
  }, [videoId, trainingId, moduleId, markVideoAsCompleted]);

  // Monitorar eventos do YouTube Player API
  useEffect(() => {
    if (!videoId) return;

    // Função para detectar quando o vídeo termina
    const handleVideoEnd = () => {
      console.log('🎬 Vídeo terminou, marcando como concluído');
      markVideoAsCompleted(videoId, trainingId, moduleId);
    };

    // Função para detectar quando o vídeo é pausado próximo ao fim
    const handleVideoProgress = (event) => {
      if (event && event.data) {
        const playerState = event.data;
        
        // YouTube Player States:
        // 0 = ENDED (vídeo terminou)
        // 1 = PLAYING
        // 2 = PAUSED
        // 3 = BUFFERING
        // 5 = CUED
        
        if (playerState === 0) { // ENDED
          handleVideoEnd();
        }
      }
    };

    // Adicionar listeners para eventos do YouTube Player
    const addYouTubeListeners = () => {
      // Tentar encontrar o iframe do YouTube
      const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
      if (iframe) {
        // O YouTube Player API não está disponível diretamente no iframe
        // Vamos usar uma abordagem alternativa: monitorar o tempo de reprodução
        console.log('📺 Iframe do YouTube encontrado, configurando monitoramento');
        
        // Configurar um timer para verificar periodicamente se o vídeo terminou
        const checkInterval = setInterval(() => {
          try {
            // Tentar acessar o player do YouTube via postMessage
            iframe.contentWindow.postMessage('{"event":"command","func":"getCurrentTime"}', '*');
          } catch {
            // Ignorar erros de cross-origin
          }
        }, 5000); // Verificar a cada 5 segundos

        // Limpar o interval quando o componente for desmontado
        return () => clearInterval(checkInterval);
      }
    };

    // Adicionar listener para mensagens do YouTube Player
    const handleMessage = (event) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        if (data.event === 'video-progress') {
          handleVideoProgress(data);
        }
      } catch {
        // Ignorar erros de parsing
      }
    };

    // Adicionar listener para mensagens
    window.addEventListener('message', handleMessage);
    
    // Configurar monitoramento do YouTube
    const cleanup = addYouTubeListeners();

    return () => {
      window.removeEventListener('message', handleMessage);
      if (cleanup) cleanup();
    };
  }, [videoId, trainingId, moduleId, markVideoAsCompleted]);

  return {
    markVideoAsCompleted,
    isVideoCompleted,
    simulateVideoCompletion
  };
};

export default useVideoCompletion;


