import { useState, useEffect } from 'react';

// Cache global para os dados dos treinos
let trainingsDataCache = null;
let isLoading = false;
let loadingPromise = null;

export const useTrainingsData = () => {
  const [data, setData] = useState(trainingsDataCache);
  const [loading, setLoading] = useState(!trainingsDataCache);

  useEffect(() => {
    // Se os dados já estão em cache, usar imediatamente
    if (trainingsDataCache) {
      setData(trainingsDataCache);
      setLoading(false);
      return;
    }

    // Se já está carregando, aguardar a promise existente
    if (isLoading && loadingPromise) {
      loadingPromise.then((result) => {
        setData(result);
        setLoading(false);
      });
      return;
    }

    // Iniciar carregamento apenas se não há dados em cache
    if (!trainingsDataCache) {
      isLoading = true;
      setLoading(true);

      const loadTrainingsData = () => {
        return new Promise((resolve, reject) => {
          // Verificar se os dados já estão disponíveis globalmente
          if (window.trainingsData && window.trainingsData.sections) {
            // Validar estrutura dos dados
            validateTrainingsData(window.trainingsData);
            trainingsDataCache = window.trainingsData;
            isLoading = false;
            resolve(window.trainingsData);
            return;
          }

          // Se não estão disponíveis, aguardar o carregamento do script
          const checkInterval = setInterval(() => {
            if (window.trainingsData && window.trainingsData.sections) {
              clearInterval(checkInterval);
              console.log('✅ useTrainingsData - Dados carregados via script');
              // Validar estrutura dos dados
              validateTrainingsData(window.trainingsData);
              trainingsDataCache = window.trainingsData;
              isLoading = false;
              resolve(window.trainingsData);
            }
          }, 25); // Reduzido de 50ms para 25ms para verificação mais frequente

          // Timeout de segurança
          setTimeout(() => {
            clearInterval(checkInterval);
            isLoading = false;
            console.error('❌ useTrainingsData - Timeout ao carregar dados dos treinos');
            console.log('🔍 useTrainingsData - Estado atual:', {
              windowTrainingsData: !!window.trainingsData,
              windowSections: !!window.trainingsData?.sections,
              sectionsCount: window.trainingsData?.sections?.length || 0
            });
            reject(new Error('Timeout ao carregar dados dos treinos'));
          }, 20000); // Aumentado para 20 segundos
        });
      };

      loadingPromise = loadTrainingsData();
      
      loadingPromise
        .then((result) => {
          setData(result);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Erro ao carregar dados dos treinos:', error);
          // Em caso de erro, tentar usar dados em cache ou definir como vazio
          setData(trainingsDataCache || { sections: [] });
          setLoading(false);
        });
    }
  }, []);

  return { data, loading };
};

// Função para pré-carregar os dados (pode ser chamada no App.jsx)
export const preloadTrainingsData = () => {
  if (trainingsDataCache || isLoading) {
    return Promise.resolve(trainingsDataCache);
  }

  isLoading = true;
  
  return new Promise((resolve, reject) => {
    if (window.trainingsData && window.trainingsData.sections) {
      trainingsDataCache = window.trainingsData;
      isLoading = false;
      resolve(window.trainingsData);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.trainingsData && window.trainingsData.sections) {
        clearInterval(checkInterval);
        trainingsDataCache = window.trainingsData;
        isLoading = false;
        resolve(window.trainingsData);
      }
    }, 25); // Reduzido de 50ms para 25ms para verificação mais frequente

    setTimeout(() => {
      clearInterval(checkInterval);
      isLoading = false;
      reject(new Error('Timeout ao pré-carregar dados dos treinos'));
    }, 10000);
  });
};

// Função para limpar o cache dos treinos
export const clearTrainingsCache = () => {
  trainingsDataCache = null;
  isLoading = false;
  loadingPromise = null;
  console.log('🧹 Cache dos treinos limpo');
};

// Função para verificar o estado do cache
export const getTrainingsCacheStatus = () => {
  return {
    hasData: !!trainingsDataCache,
    isLoading: isLoading,
    hasPromise: !!loadingPromise,
    windowData: !!window.trainingsData
  };
};

// Função para validar estrutura dos dados dos treinos
export const validateTrainingsData = (data) => {
  if (!data) {
    console.error('❌ validateTrainingsData - Dados não fornecidos');
    return false;
  }
  
  if (!data.sections || !Array.isArray(data.sections)) {
    console.error('❌ validateTrainingsData - Seções não encontradas ou inválidas');
    return false;
  }
  
  
  // Validar cada seção
  data.sections.forEach((section, sectionIndex) => {
    if (!section.id || !section.title) {
      console.error(`❌ validateTrainingsData - Seção ${sectionIndex} inválida:`, section);
    }
    
    if (section.trainings && Array.isArray(section.trainings)) {
      section.trainings.forEach((training, trainingIndex) => {
        if (!training.id || !training.title) {
          console.error(`❌ validateTrainingsData - Treino ${trainingIndex} da seção ${section.title} inválido:`, training);
        }
        
        // Validar módulos se existirem
        if (training.modules && Array.isArray(training.modules)) {
          training.modules.forEach((module, moduleIndex) => {
            if (!module.title) {
              console.error(`❌ validateTrainingsData - Módulo ${moduleIndex} do treino ${training.title} sem título`);
            }
            if (!module.videoUrl && !module.youtubeId) {
              console.error(`❌ validateTrainingsData - Módulo ${moduleIndex} do treino ${training.title} sem URL de vídeo`);
            }
          });
        }
      });
    }
  });
  
  return true;
};
