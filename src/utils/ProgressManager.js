// Sistema de Gerenciamento de Progresso do Usuário
import firebaseSyncService from '../services/FirebaseSync.js';
import { getLocalDateString } from './dateUtils.js';

class ProgressManager {
  constructor() {
    this.storageKey = 'teamhiit_user_progress';
    this.firebaseSync = firebaseSyncService;
    // Migração automática de chaves legadas no carregamento da instância
    try {
      this._migrateLegacyCompletedVideoKeys();
    } catch (e) {
      // Evitar quebrar a inicialização por causa de migração
      console.warn('ProgressManager: falha ao migrar chaves legadas:', e);
    }
    
    // Expor função de limpeza globalmente para debug
    if (typeof window !== 'undefined') {
      window.cleanTeamHIITData = () => this.cleanCorruptedData();
      window.forceAddVideo = (trainingId, moduleId, videoId) => this.forceAddVideo(trainingId, moduleId, videoId);
      window.testMarkVideo = (trainingId, moduleId, videoId) => {
        console.log('🧪 [TEST] Testando marcação de vídeo:', { trainingId, moduleId, videoId });
        const result = this.forceAddVideo(trainingId, moduleId, videoId);
        console.log('🧪 [TEST] Resultado:', result);
        const progress = this.getProgress();
        console.log('🧪 [TEST] Progresso após:', progress);
        return result;
      };
      
      // Função para testar se Firebase está sobrescrevendo dados
      window.testFirebaseConflict = async () => {
        console.log('🧪 [TEST] Testando conflito com Firebase...');
        
        // 1. Salvar dados localmente
        const testVideo = 'projeto-verao-default-teste123';
        const testProgress = {
          completedVideos: [testVideo],
          workoutDates: { '2025-10-08': 1 },
          lastUpdated: new Date().toISOString()
        };
        
        console.log('🧪 [TEST] Salvando dados de teste localmente:', testProgress);
        localStorage.setItem(this.storageKey, JSON.stringify(testProgress));
        
        // 2. Verificar se foram salvos
        const saved = localStorage.getItem(this.storageKey);
        console.log('🧪 [TEST] Dados salvos:', JSON.parse(saved));
        
        // 3. Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 4. Verificar se Firebase sobrescreveu
        const afterFirebase = localStorage.getItem(this.storageKey);
        console.log('🧪 [TEST] Dados após Firebase:', JSON.parse(afterFirebase));
        
        return JSON.parse(saved).completedVideos.includes(testVideo);
      };
      
      // Função para limpar e adicionar vídeo DIRETAMENTE no localStorage
      window.forceCleanAndAdd = (trainingId, moduleId, videoId) => {
        console.log('🧪 [FORCE] Limpando e adicionando vídeo DIRETAMENTE:', { trainingId, moduleId, videoId });
        
        // 1. Buscar dados atuais
        const currentData = localStorage.getItem('teamhiit_user_progress');
        let progress = currentData ? JSON.parse(currentData) : {};
        
        console.log('🧪 [FORCE] Dados atuais:', progress);
        
        // 2. Limpar TUDO que é corrompido
        const videoKey = `${trainingId}-${moduleId}-${videoId}`;
        let cleanVideos = [];
        
        if (progress.completedVideos && Array.isArray(progress.completedVideos)) {
          cleanVideos = progress.completedVideos.filter(key => {
            const isCorrupted = key.endsWith('-default-default') || 
                               key === 'undefined' || 
                               key === 'null' || 
                               key === '' || 
                               /^\d+$/.test(key);
            if (isCorrupted) {
              console.log('🧪 [FORCE] REMOVENDO corrompido:', key);
              return false;
            }
            return true;
          });
        }
        
        // 3. Adicionar novo vídeo
        if (!cleanVideos.includes(videoKey)) {
          cleanVideos.push(videoKey);
          console.log('🧪 [FORCE] ADICIONANDO vídeo:', videoKey);
        }
        
        // 4. Criar progresso limpo
        const today = getLocalDateString();
        const cleanProgress = {
          completedVideos: cleanVideos,
          workoutDates: {
            ...progress.workoutDates,
            [today]: (progress.workoutDates?.[today] || 0) + 1
          },
          lastWorkoutDate: today,
          lastUpdated: new Date().toISOString()
        };
        
        console.log('🧪 [FORCE] Progresso limpo criado:', cleanProgress);
        
        // 5. Salvar DIRETAMENTE
        localStorage.setItem('teamhiit_user_progress', JSON.stringify(cleanProgress));
        console.log('🧪 [FORCE] SALVO DIRETAMENTE no localStorage');
        
        // 6. Verificar
        const verify = JSON.parse(localStorage.getItem('teamhiit_user_progress'));
        console.log('🧪 [FORCE] VERIFICAÇÃO:', verify);
        console.log('🧪 [FORCE] completedVideos:', verify.completedVideos);
        
        return verify.completedVideos.includes(videoKey);
      };
      
      // Função simples para testar se o vídeo foi adicionado
      window.checkProgress = () => {
        const data = localStorage.getItem('teamhiit_user_progress');
        const progress = JSON.parse(data);
        console.log('📊 [CHECK] Progresso atual:', progress);
        console.log('📊 [CHECK] completedVideos:', progress?.completedVideos);
        return progress;
      };
      
      // Função para desabilitar temporariamente a sincronização em background
      window.disableBackgroundSync = () => {
        console.log('🚫 [SYNC] Desabilitando sincronização em background...');
        window.disableSync = true;
        console.log('🚫 [SYNC] Sincronização em background DESABILITADA');
      };
      
      // Função para reabilitar a sincronização em background
      window.enableBackgroundSync = () => {
        console.log('✅ [SYNC] Reabilitando sincronização em background...');
        window.disableSync = false;
        console.log('✅ [SYNC] Sincronização em background REABILITADA');
      };
      
      // Função para testar se um vídeo está marcado como concluído
      window.testVideoCompleted = (trainingId, moduleId, videoId) => {
        console.log('🧪 [TEST] Testando se vídeo está concluído:', { trainingId, moduleId, videoId });
        
        const progress = this.getProgress();
        console.log('🧪 [TEST] Progresso atual:', progress);
        console.log('🧪 [TEST] completedVideos:', progress?.completedVideos);
        
        const videoKey = `${trainingId}-${moduleId}-${videoId}`;
        console.log('🧪 [TEST] Chave procurada:', videoKey);
        
        const isCompleted = progress?.completedVideos?.includes(videoKey);
        console.log('🧪 [TEST] Está concluído?', isCompleted);
        
        // Testar também as chaves de compatibilidade
        const legacyA = `${trainingId}-${moduleId}-undefined`;
        const legacyB = `${trainingId}-undefined-${videoId}`;
        console.log('🧪 [TEST] Chaves de compatibilidade:', { legacyA, legacyB });
        console.log('🧪 [TEST] Compatibilidade A:', progress?.completedVideos?.includes(legacyA));
        console.log('🧪 [TEST] Compatibilidade B:', progress?.completedVideos?.includes(legacyB));
        
        return isCompleted;
      };
      
      // Função para FORÇAR a correção definitiva dos dados
      window.forceFixProgress = async (trainingId, moduleId, videoId) => {
        console.log('🔧 [FORCE FIX] Iniciando correção definitiva...');
        
        // 1. Desabilitar sincronização temporariamente
        window.disableSync = true;
        console.log('🔧 [FORCE FIX] Sincronização desabilitada');
        
        // 2. Buscar dados atuais
        const currentData = localStorage.getItem('teamhiit_user_progress');
        let progress = currentData ? JSON.parse(currentData) : {};
        
        console.log('🔧 [FORCE FIX] Dados atuais:', progress);
        
        // 3. LIMPAR TUDO que é corrompido
        const videoKey = `${trainingId}-${moduleId}-${videoId}`;
        let cleanVideos = [];
        
        if (progress.completedVideos && Array.isArray(progress.completedVideos)) {
          cleanVideos = progress.completedVideos.filter(key => {
            const isCorrupted = key.endsWith('-default-default') || 
                               key === 'undefined' || 
                               key === 'null' || 
                               key === '' || 
                               /^\d+$/.test(key);
            if (isCorrupted) {
              console.log('🔧 [FORCE FIX] REMOVENDO corrompido:', key);
              return false;
            }
            return true;
          });
        }
        
        // 4. Adicionar vídeo correto
        if (!cleanVideos.includes(videoKey)) {
          cleanVideos.push(videoKey);
          console.log('🔧 [FORCE FIX] ADICIONANDO vídeo correto:', videoKey);
        }
        
        // 5. Criar progresso limpo e correto
        const today = getLocalDateString();
        const fixedProgress = {
          completedVideos: cleanVideos,
          workoutDates: {
            ...progress.workoutDates,
            [today]: (progress.workoutDates?.[today] || 0) + 1
          },
          lastWorkoutDate: today,
          lastUpdated: new Date().toISOString()
        };
        
        console.log('🔧 [FORCE FIX] Progresso corrigido:', fixedProgress);
        
        // 6. Salvar DIRETAMENTE no localStorage
        localStorage.setItem('teamhiit_user_progress', JSON.stringify(fixedProgress));
        console.log('🔧 [FORCE FIX] SALVO no localStorage');
        
        // 7. SALVAR NO FIREBASE IMEDIATAMENTE
        try {
          await this.saveProgress(fixedProgress);
          console.log('🔧 [FORCE FIX] SALVO no Firebase');
        } catch (error) {
          console.error('❌ [FORCE FIX] Erro ao salvar no Firebase:', error);
        }
        
        // 8. Reabilitar sincronização
        window.disableSync = false;
        console.log('🔧 [FORCE FIX] Sincronização reabilitada');
        
        // 9. Verificar
        const verify = JSON.parse(localStorage.getItem('teamhiit_user_progress'));
        console.log('🔧 [FORCE FIX] VERIFICAÇÃO FINAL:', verify.completedVideos);
        
        return verify.completedVideos.includes(videoKey);
      };
    }
  }

  // Salvar progresso do usuário (com sincronização Firebase)
  async saveProgress(progressData) {
    try {
      console.log('💾 [ProgressManager] Iniciando saveProgress (Firebase-first):', progressData);
      
      const currentProgress = this.getProgress() || {};
      console.log('💾 [ProgressManager] Progresso atual:', currentProgress);
      
      const updatedProgress = {
        ...currentProgress,
        lastUpdated: new Date().toISOString(),
        ...progressData
      };
      
      console.log('💾 [ProgressManager] Progresso atualizado:', updatedProgress);
      
      // PRIORIDADE: Salvar no Firebase primeiro (fonte da verdade)
      try {
        // Garantir que o usuário está definido no FirebaseSync
        if (!this.firebaseSync.userId) {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          
          if (auth.currentUser) {
            this.firebaseSync.setUser(auth.currentUser.uid);
            console.log('✅ [ProgressManager] Usuário definido para saveProgress:', auth.currentUser.uid);
          } else {
            throw new Error('Usuário não autenticado');
          }
        }
        
        const firebaseResult = await this.firebaseSync.saveProgress(updatedProgress);
        if (firebaseResult) {
          console.log('☁️ [ProgressManager] Dados salvos no Firebase com sucesso');
          
          // Cache local para performance (não bloqueia)
          try {
            localStorage.setItem(this.storageKey, JSON.stringify(updatedProgress));
            console.log('💾 [ProgressManager] Dados cacheados localmente');
          } catch (cacheError) {
            console.warn('⚠️ [ProgressManager] Erro ao cachear dados:', cacheError);
          }
          
          return true;
        }
      } catch (firebaseError) {
        console.warn('⚠️ [ProgressManager] Erro ao salvar no Firebase, usando cache local:', firebaseError);
      }
      
      // Fallback: salvar localmente se Firebase falhou
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(updatedProgress));
        console.log('📦 [ProgressManager] Dados salvos localmente (Firebase indisponível)');
        
        // Tentar sincronizar em background
        this.scheduleBackgroundSync(updatedProgress);
        
        return true;
      } catch (localError) {
        console.error('❌ [ProgressManager] Erro ao salvar localmente:', localError);
        return false;
      }
    } catch (error) {
      console.error('❌ [ProgressManager] Erro ao salvar progresso:', error);
      return false;
    }
  }

  // Carregar progresso (FIREBASE-FIRST para apps nas lojas)
  async loadProgress() {
    try {
      // PRIORIDADE: Firebase primeiro (dados mais atualizados e seguros)
      let firebaseData = null;
      try {
        // Garantir que o usuário está definido no FirebaseSync
        if (!this.firebaseSync.userId) {
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();

          if (auth.currentUser) {
            this.firebaseSync.setUser(auth.currentUser.uid);
          } else {
            throw new Error('Usuário não autenticado');
          }
        }

        // Limpar dados corrompidos do Firebase primeiro
        await this.firebaseSync.cleanCorruptedFirebaseData();

        // Tentar carregar do Firebase (fonte da verdade)
        firebaseData = await this.firebaseSync.loadProgress();
      } catch (firebaseError) {
        console.warn('⚠️ [ProgressManager] Erro ao carregar do Firebase:', firebaseError);
      }

      // Cache local como fallback
      const localData = this.getProgress();

      // Se Firebase funcionou, usar Firebase como fonte da verdade
      if (firebaseData) {
        // Cache local para performance (não bloqueia)
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(firebaseData));
        } catch (cacheError) {
          console.warn('⚠️ [ProgressManager] Erro ao cachear dados:', cacheError);
        }

        return firebaseData;
      }

      // Fallback: usar cache local se Firebase falhou
      if (localData) {
        // Tentar sincronizar em background (não bloqueia)
        this.scheduleBackgroundSync(localData);

        return localData;
      }
    } catch (error) {
      console.error('❌ [ProgressManager] Erro ao carregar progresso:', error);
      // Fallback para localStorage
      return this.getProgress();
    }
  }

  // Sincronizar dados em background (não bloqueia a UI)
  scheduleBackgroundSync(localData) {
    // Verificar se a sincronização está desabilitada
    if (typeof window !== 'undefined' && window.disableSync) {
      console.log('🚫 [ProgressManager] Sincronização em background DESABILITADA - pulando...');
      return;
    }
    
    // Aguardar um pouco para não interferir na UI
    setTimeout(async () => {
      try {
        // Verificar novamente se foi desabilitada durante o timeout
        if (typeof window !== 'undefined' && window.disableSync) {
          console.log('🚫 [ProgressManager] Sincronização desabilitada durante timeout - cancelando...');
          return;
        }
        
        console.log('🔄 [ProgressManager] Sincronizando dados em background...');
        
        // Verificar se o usuário está definido no FirebaseSync
        if (!this.firebaseSync.userId) {
          console.log('🔄 [ProgressManager] Definindo usuário para sincronização...');
          
          // Tentar obter o usuário atual do Firebase Auth
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          
          if (auth.currentUser) {
            this.firebaseSync.setUser(auth.currentUser.uid);
            console.log('✅ [ProgressManager] Usuário definido para sincronização:', auth.currentUser.uid);
          } else {
            console.warn('⚠️ [ProgressManager] Nenhum usuário autenticado, pulando sincronização');
            return;
          }
        }
        
        await this.firebaseSync.syncProgress(localData);
        console.log('✅ [ProgressManager] Sincronização em background concluída');
      } catch (error) {
        console.warn('⚠️ [ProgressManager] Falha na sincronização em background:', error);
      }
    }, 2000); // 2 segundos de delay
  }

  // Buscar progresso atual
  getProgress() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      
      if (!parsed) {
        return null;
      }

      // Garantir que dados carregados estejam normalizados
      const normalized = this._normalizeCompletedVideoKeys(parsed);
      if (normalized.changed) {
        localStorage.setItem(this.storageKey, JSON.stringify(normalized.progress));
        return normalized.progress;
      }
      
      // Garantir que completedVideos seja sempre um array
      if (parsed && !Array.isArray(parsed.completedVideos)) {
        parsed.completedVideos = [];
      }
      
      return parsed;
    } catch (error) {
      console.error('❌ [ProgressManager] Erro ao buscar progresso:', error);
      return null;
    }
  }

  // Atualizar progresso de vídeo
  updateVideoProgress(trainingId, moduleId, videoId, videoData) {
    const progressData = {
      trainingId,
      moduleId,
      videoId,
      trainingTitle: videoData.trainingTitle,
      moduleTitle: videoData.moduleTitle,
      videoTitle: videoData.videoTitle,
      thumbnail: videoData.thumbnail,
      currentVideo: videoData.currentVideo,
      totalVideos: videoData.totalVideos,
      completedVideos: videoData.completedVideos,
      timeRemaining: videoData.timeRemaining,
      nextVideos: videoData.nextVideos || []
    };

    return this.saveProgress(progressData);
  }

  // Marcar vídeo como concluído
  async markVideoCompleted(trainingId, moduleId, videoId) {
    console.log('🎯 [ProgressManager] markVideoCompleted chamado com:', { trainingId, moduleId, videoId });
    
    // PRIMEIRO: Limpar dados corrompidos
    console.log('🧹 [ProgressManager] Limpando dados corrompidos antes de marcar como concluído...');
    const cleanupResult = this.cleanCorruptedData();
    console.log('🧹 [ProgressManager] Resultado da limpeza:', cleanupResult);
    
    // AGORA: Buscar progresso atual (já limpo)
    const currentProgress = this.getProgress() || {};
    console.log('🎯 [ProgressManager] Progresso atual encontrado (após limpeza):', currentProgress);
    
    const completedVideos = currentProgress.completedVideos || [];
    const videoKey = `${trainingId}-${moduleId}-${videoId}`;
    
    console.log('🎯 [ProgressManager] Verificando se vídeo já foi concluído:', {
      videoKey,
      isAlreadyCompleted: completedVideos.includes(videoKey),
      allCompletedVideos: completedVideos,
      hasSimilarKey: completedVideos.some(key => key.includes(trainingId) && key.includes('default'))
    });
    
    // FORÇAR: Limpar dados corrompidos e adicionar o vídeo
    console.log('🔨 [ProgressManager] Forçando limpeza e adição do vídeo...');
    
    // Filtrar dados corrompidos
    const cleanVideos = completedVideos.filter(key => {
      if (key.endsWith('-default-default')) {
        console.log('🔨 [ProgressManager] Removendo entrada corrompida:', key);
        return false;
      }
      if (/^\d+$/.test(key)) {
        console.log('🔨 [ProgressManager] Removendo chave numérica:', key);
        return false;
      }
      return true;
    });
    
    // Adicionar o novo vídeo se não estiver presente
    if (!cleanVideos.includes(videoKey)) {
      console.log('🔨 [ProgressManager] Adicionando novo vídeo:', videoKey);
      cleanVideos.push(videoKey);
    } else {
      console.log('🔨 [ProgressManager] Vídeo já estava presente:', videoKey);
    }
    
    // Armazenar a data do treino concluído
    const today = getLocalDateString(); // YYYY-MM-DD
    const workoutDates = currentProgress.workoutDates || {};
    workoutDates[today] = (workoutDates[today] || 0) + 1; // Contar treinos por dia
    
    // Atualizar lastAccessedVideos para este treino específico
    const lastAccessedVideos = currentProgress.lastAccessedVideos || {};
    lastAccessedVideos[trainingId] = {
      accessedAt: new Date().toISOString(), // Data/hora exata atual
      videoId: videoId,
      moduleId: moduleId
    };

    // Adicionar ao histórico do Firebase
    try {
      const { getVideoCalories, getVideoDuration } = await import('../utils/VideoDurations.js');
      const calories = getVideoCalories(videoId);
      const durationStr = getVideoDuration(videoId);
      // Converter string "27 min" para número 27
      const durationMinutes = parseInt(durationStr.replace(' min', ''), 10) || 0;
      
      await this.firebaseSync.addWorkoutToHistory(
        trainingId, 
        moduleId, 
        videoId, 
        calories, 
        durationMinutes
      );
    } catch (error) {
      console.warn('⚠️ [ProgressManager] Erro ao adicionar treino ao histórico do Firebase:', error);
    }
    
    console.log('📅 [ProgressManager] Data do treino:', {
      today,
      workoutDates,
      totalWorkoutsToday: workoutDates[today],
      lastAccessedVideos: lastAccessedVideos[trainingId]
    });
    
    console.log('🔥 [ProgressManager] Salvando progresso final:', {
      videoKey,
      today,
      totalCompleted: cleanVideos.length,
      allCompletedVideos: cleanVideos,
      removedCorrupted: completedVideos.length - cleanVideos.length
    });
    
    const result = await this.saveProgress({
      ...currentProgress,
      completedVideos: cleanVideos,
      workoutDates,
      lastWorkoutDate: today,
      lastAccessedVideos
    });
    
    console.log('🎯 [ProgressManager] Resultado do saveProgress:', result);
    return result;
  }

  // Verificar se vídeo foi concluído
  isVideoCompleted(trainingId, moduleId, videoId) {
    console.log('🔍 [isVideoCompleted] Verificando se vídeo está concluído:', { trainingId, moduleId, videoId });
    
    const progress = this.getProgress();
    console.log('🔍 [isVideoCompleted] Progresso atual:', progress);
    
    if (!progress || !progress.completedVideos) {
      console.log('🔍 [isVideoCompleted] Sem progresso ou completedVideos, retornando false');
      return false;
    }
    
    const videoKey = `${trainingId}-${moduleId}-${videoId}`;
    console.log('🔍 [isVideoCompleted] Chave procurada:', videoKey);
    console.log('🔍 [isVideoCompleted] completedVideos disponíveis:', progress.completedVideos);
    
    if (progress.completedVideos.includes(videoKey)) {
      console.log('✅ [isVideoCompleted] Vídeo encontrado como concluído!');
      return true;
    }

    // Retrocompatibilidade: aceitar chaves antigas até completa migração
    const legacyA = `${trainingId}-${moduleId}-undefined`;
    const legacyB = `${trainingId}-undefined-${videoId}`;
    console.log('🔍 [isVideoCompleted] Testando compatibilidade:', { legacyA, legacyB });
    
    const legacyResult = progress.completedVideos.includes(legacyA) || progress.completedVideos.includes(legacyB);
    console.log('🔍 [isVideoCompleted] Resultado da compatibilidade:', legacyResult);
    
    if (legacyResult) {
      console.log('✅ [isVideoCompleted] Vídeo encontrado via compatibilidade!');
    } else {
      console.log('❌ [isVideoCompleted] Vídeo NÃO encontrado');
    }
    
    return legacyResult;
  }

  // Calcular progresso do módulo
  calculateModuleProgress(trainingId, moduleId, totalVideos) {
    const progress = this.getProgress();
    if (!progress || !progress.completedVideos) return 0;

    const completedInModule = progress.completedVideos.filter(videoKey => 
      videoKey.startsWith(`${trainingId}-${moduleId}-`)
    ).length;

    return Math.round((completedInModule / totalVideos) * 100);
  }

  // Buscar próximo vídeo para assistir
  getNextVideo(trainingData, currentTrainingId, currentModuleId, currentVideoId) {
    try {
      const training = trainingData.find(t => t.id === currentTrainingId);
      if (!training) return null;

      const module = training.modules.find(m => m.id === currentModuleId);
      if (!module) return null;

      const currentVideoIndex = module.videos.findIndex(v => v.id === currentVideoId);
      
      // Próximo vídeo no mesmo módulo
      if (currentVideoIndex < module.videos.length - 1) {
        return {
          trainingId: currentTrainingId,
          moduleId: currentModuleId,
          videoId: module.videos[currentVideoIndex + 1].id,
          video: module.videos[currentVideoIndex + 1]
        };
      }

      // Próximo módulo
      const currentModuleIndex = training.modules.findIndex(m => m.id === currentModuleId);
      if (currentModuleIndex < training.modules.length - 1) {
        const nextModule = training.modules[currentModuleIndex + 1];
        return {
          trainingId: currentTrainingId,
          moduleId: nextModule.id,
          videoId: nextModule.videos[0].id,
          video: nextModule.videos[0]
        };
      }

      return null; // Fim do treino
    } catch (error) {
      console.error('Erro ao buscar próximo vídeo:', error);
      return null;
    }
  }

  // Limpar progresso
  clearProgress() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Erro ao limpar progresso:', error);
      return false;
    }
  }

  // Exportar progresso (para backup)
  exportProgress() {
    return this.getProgress();
  }

  // Importar progresso (de backup)
  importProgress(progressData) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(progressData));
      return true;
    } catch (error) {
      console.error('Erro ao importar progresso:', error);
      return false;
    }
  }

  // Função para forçar adição de vídeo (para debug) - VERSÃO AGRESSIVA
  forceAddVideo(trainingId, moduleId, videoId) {
    try {
      console.log('🚀 [ProgressManager] FORÇANDO adição de vídeo (VERSÃO AGRESSIVA):', { trainingId, moduleId, videoId });
      
      // Buscar dados diretamente do localStorage
      const saved = localStorage.getItem(this.storageKey);
      console.log('🚀 [ProgressManager] Dados brutos do localStorage:', saved);
      
      let progress;
      if (!saved) {
        console.log('🚀 [ProgressManager] Criando novo progresso...');
        progress = {
          completedVideos: [],
          workoutDates: {},
          lastUpdated: new Date().toISOString()
        };
      } else {
        progress = JSON.parse(saved);
        console.log('🚀 [ProgressManager] Progresso parseado:', progress);
      }
      
      const videoKey = `${trainingId}-${moduleId}-${videoId}`;
      console.log('🚀 [ProgressManager] Chave do vídeo a ser adicionada:', videoKey);
      
      // LIMPEZA AGRESSIVA: Remover TODOS os dados corrompidos
      let cleanVideos = [];
      if (progress.completedVideos && Array.isArray(progress.completedVideos)) {
        cleanVideos = progress.completedVideos.filter(key => {
          if (key.endsWith('-default-default')) {
            console.log('🚀 [ProgressManager] REMOVENDO corrompido:', key);
            return false;
          }
          if (/^\d+$/.test(key)) {
            console.log('🚀 [ProgressManager] REMOVENDO numérico:', key);
            return false;
          }
          if (key === 'undefined' || key === 'null' || key === '') {
            console.log('🚀 [ProgressManager] REMOVENDO inválido:', key);
            return false;
          }
          return true;
        });
      }
      
      console.log('🚀 [ProgressManager] Vídeos após limpeza:', cleanVideos);
      
      // Adicionar novo vídeo se não estiver presente
      if (!cleanVideos.includes(videoKey)) {
        cleanVideos.push(videoKey);
        console.log('🚀 [ProgressManager] ADICIONANDO vídeo:', videoKey);
      } else {
        console.log('🚀 [ProgressManager] Vídeo já estava presente:', videoKey);
      }
      
      console.log('🚀 [ProgressManager] Vídeos finais:', cleanVideos);
      
      // Salvar AGRESSIVAMENTE
      const today = getLocalDateString();
      const newProgress = {
        ...progress,
        completedVideos: cleanVideos,
        workoutDates: {
          ...progress.workoutDates,
          [today]: (progress.workoutDates?.[today] || 0) + 1
        },
        lastWorkoutDate: today,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('🚀 [ProgressManager] Novo progresso a ser salvo:', newProgress);
      
      // Salvar DIRETAMENTE no localStorage (sem Firebase)
      localStorage.setItem(this.storageKey, JSON.stringify(newProgress));
      console.log('🚀 [ProgressManager] SALVO DIRETAMENTE no localStorage');
      
      // Verificar se foi salvo corretamente
      const verifySaved = localStorage.getItem(this.storageKey);
      const verifyParsed = JSON.parse(verifySaved);
      console.log('🚀 [ProgressManager] VERIFICAÇÃO - Dados salvos:', verifyParsed);
      console.log('🚀 [ProgressManager] VERIFICAÇÃO - completedVideos:', verifyParsed.completedVideos);
      
      return true;
    } catch (error) {
      console.error('❌ [ProgressManager] Erro ao forçar adição:', error);
      return false;
    }
  }

  // Função para limpar dados corrompidos do progresso
  cleanCorruptedData() {
    try {
      console.log('🧹 [ProgressManager] Iniciando limpeza de dados corrompidos...');
      
      // Buscar dados diretamente do localStorage
      const saved = localStorage.getItem(this.storageKey);
      if (!saved) {
        console.log('🧹 [ProgressManager] Nenhum dado encontrado para limpar');
        return false;
      }
      
      const progress = JSON.parse(saved);
      let cleanedVideos = progress.completedVideos || [];
      const originalLength = cleanedVideos.length;
      
      console.log('🧹 [ProgressManager] Dados encontrados:', {
        originalLength,
        completedVideos: cleanedVideos
      });
      
      // Remover entradas corrompidas
      cleanedVideos = cleanedVideos.filter(key => {
        // Remover chaves que terminam com "-default-default" (formato incorreto)
        if (key.endsWith('-default-default')) {
          console.log('🧹 [ProgressManager] Removendo chave corrompida:', key);
          return false;
        }
        
        // Remover chaves que são apenas números (dados antigos)
        if (/^\d+$/.test(key)) {
          console.log('🧹 [ProgressManager] Removendo chave numérica antiga:', key);
          return false;
        }
        
        return true;
      });
      
      const cleanedCount = originalLength - cleanedVideos.length;
      
      if (cleanedCount > 0) {
        console.log('🧹 [ProgressManager] Dados limpos:', {
          antes: originalLength,
          depois: cleanedVideos.length,
          removidos: cleanedCount
        });
        
        // Salvar dados limpos diretamente no localStorage
        const cleanedProgress = {
          ...progress,
          completedVideos: cleanedVideos,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(cleanedProgress));
        console.log('🧹 [ProgressManager] Dados limpos salvos no localStorage');
        
        return true;
      }
      
      console.log('🧹 [ProgressManager] Nenhum dado corrompido encontrado');
      return false;
    } catch (error) {
      console.error('❌ [ProgressManager] Erro ao limpar dados corrompidos:', error);
      return false;
    }
  }

  // Verificar se é a primeira vez que o usuário acessa um treino
  isFirstTimeAccessingTraining(trainingId) {
    const progress = this.getProgress();
    if (!progress || !progress.completedVideos) return true;
    
    // Verificar se há algum vídeo concluído deste treino
    const hasCompletedVideos = progress.completedVideos.some(videoKey => 
      videoKey.startsWith(`${trainingId}-`)
    );
    
    console.log('🔍 [ProgressManager] Verificando primeira vez no treino:', {
      trainingId,
      hasCompletedVideos,
      completedVideos: progress.completedVideos.filter(v => v.startsWith(`${trainingId}-`))
    });
    
    return !hasCompletedVideos;
  }

  // Obter o último vídeo acessado em um treino
  getLastAccessedVideo(trainingId) {
    const progress = this.getProgress();
    if (!progress || !progress.lastAccessedVideos) return null;
    
    return progress.lastAccessedVideos[trainingId] || null;
  }

  // Marcar vídeo como acessado (para rastrear onde parou)
  markVideoAccessed(trainingId, moduleId, videoId) {
    const currentProgress = this.getProgress() || {};
    const lastAccessedVideos = currentProgress.lastAccessedVideos || {};
    
    lastAccessedVideos[trainingId] = {
      moduleId,
      videoId,
      accessedAt: new Date().toISOString()
    };
    
    return this.saveProgress({
      ...currentProgress,
      lastAccessedVideos
    });
  }

  // Estatísticas do usuário
  getUserStats() {
    const progress = this.getProgress();
    if (!progress) {
      return {
        totalVideosWatched: 0,
        totalTimeSpent: 0,
        currentStreak: 0,
        lastActivity: null
      };
    }

    return {
      totalVideosWatched: progress.completedVideos?.length || 0,
      totalTimeSpent: progress.totalTimeSpent || 0,
      currentStreak: progress.currentStreak || 0,
      lastActivity: progress.lastUpdated
    };
  }

  // ----------------------
  // Migração e Normalização
  // ----------------------
  _migrateLegacyCompletedVideoKeys() {
    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const { changed, progress } = this._normalizeCompletedVideoKeys(parsed);
      if (changed) {
        localStorage.setItem(this.storageKey, JSON.stringify(progress));
        console.log('✅ ProgressManager: chaves legadas migradas para formato unificado');
      }
    } catch (e) {
      console.warn('ProgressManager: erro ao analisar progresso para migração:', e);
    }
  }

  _normalizeCompletedVideoKeys(progress) {
    if (!progress) {
      return { changed: false, progress: null };
    }

    // Garantir que completedVideos seja um array
    if (!Array.isArray(progress.completedVideos)) {
      // Convertendo completedVideos para array
      if (typeof progress.completedVideos === 'object' && progress.completedVideos !== null) {
        // É um objeto, converter para array
        progress.completedVideos = Object.keys(progress.completedVideos);
      } else {
        // Tipo inesperado ou null, inicializar como array vazio
        progress.completedVideos = [];
      }
      return { changed: true, progress };
    }

    let changed = false;
    const cleanedSet = new Set();

    for (const key of progress.completedVideos) {
      const str = String(key);
      
      // IMPORTANTE: Limpar apenas chaves corrompidas, NÃO normalizar chaves válidas
      // Chaves corrompidas: -default-default, apenas números, undefined, null, vazias
      if (str.endsWith('-default-default') || 
          /^\d+$/.test(str) || 
          str === 'undefined' || 
          str === 'null' || 
          str === '' ||
          str.includes('undefined')) {
        console.log('🧹 [_normalizeCompletedVideoKeys] REMOVENDO chave corrompida:', str);
        changed = true;
        continue; // Pular esta chave corrompida
      }
      
      // Manter a chave como está (sem normalização)
      cleanedSet.add(str);
    }

    if (changed) {
      console.log('🧹 [_normalizeCompletedVideoKeys] Limpeza concluída:', {
        antes: progress.completedVideos.length,
        depois: cleanedSet.size
      });
      return {
        changed: true,
        progress: {
          ...progress,
          completedVideos: Array.from(cleanedSet)
        }
      };
    }
    return { changed: false, progress };
  }
}

// Instância singleton
const progressManager = new ProgressManager();

export default progressManager;

