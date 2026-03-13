import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Cache global para os dados dos treinos
let trainingsDataCache = null;
let isLoading = false;
let loadingPromise = null;

function mergeFirestoreIntoTrainingsData(baseData, firestoreTrainings) {
  if (!baseData?.sections || !Array.isArray(baseData.sections)) {
    return baseData;
  }

  const sections = baseData.sections.map((s) => ({
    ...s,
    trainings: Array.isArray(s.trainings) ? [...s.trainings] : [],
  }));

  const sectionIndexById = new Map();
  sections.forEach((s, idx) => {
    if (s?.id) sectionIndexById.set(s.id, idx);
  });

  const trainingsBySectionId = new Map();
  (firestoreTrainings || []).forEach((t) => {
    if (!t?.id || !t?.sectionId) return;
    if (!trainingsBySectionId.has(t.sectionId)) trainingsBySectionId.set(t.sectionId, []);
    trainingsBySectionId.get(t.sectionId).push(t);
  });

  trainingsBySectionId.forEach((trainingsList, sectionId) => {
    const sectionIdx = sectionIndexById.get(sectionId);
    if (sectionIdx === undefined) {
      return;
    }

    const current = sections[sectionIdx];
    const mergedTrainings = [...(current.trainings || [])];

    trainingsList.forEach((fsTraining) => {
      const existingIdx = mergedTrainings.findIndex((x) => x?.id === fsTraining.id);
      const existing = existingIdx >= 0 ? mergedTrainings[existingIdx] : null;

      // Merge campo a campo para permitir sobrescrever inclusive falsy (ex: comingSoon=false)
      const merged = { ...(existing || {}), ...(fsTraining || {}) };
      if (existingIdx >= 0) mergedTrainings[existingIdx] = merged;
      else mergedTrainings.unshift(merged);
    });

    // Ordenar treinos por campo "order" quando existir
    mergedTrainings.sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 9999;
      const orderB = typeof b.order === 'number' ? b.order : 9999;
      return orderA - orderB;
    });

    sections[sectionIdx] = { ...current, trainings: mergedTrainings };
  });

  return { ...baseData, sections };
}

async function fetchFirestoreTrainings() {
  try {
    const snap = await getDocs(collection(db, 'trainings'));
    return snap.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
  } catch (e) {
    // Se Firestore falhar, seguir só com trainings.js
    return [];
  }
}

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
            (async () => {
              const firestoreTrainings = await fetchFirestoreTrainings();
              const merged = mergeFirestoreIntoTrainingsData(window.trainingsData, firestoreTrainings);
              trainingsDataCache = merged;
              isLoading = false;
              resolve(merged);
            })();
            return;
          }

          // Se não estão disponíveis, aguardar o carregamento do script
          const checkInterval = setInterval(() => {
            if (window.trainingsData && window.trainingsData.sections) {
              clearInterval(checkInterval);
              console.log('✅ useTrainingsData - Dados carregados via script');
              // Validar estrutura dos dados
              validateTrainingsData(window.trainingsData);
              (async () => {
                const firestoreTrainings = await fetchFirestoreTrainings();
                const merged = mergeFirestoreIntoTrainingsData(window.trainingsData, firestoreTrainings);
                trainingsDataCache = merged;
                isLoading = false;
                resolve(merged);
              })();
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
      (async () => {
        const firestoreTrainings = await fetchFirestoreTrainings();
        const merged = mergeFirestoreIntoTrainingsData(window.trainingsData, firestoreTrainings);
        trainingsDataCache = merged;
        isLoading = false;
        resolve(merged);
      })();
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.trainingsData && window.trainingsData.sections) {
        clearInterval(checkInterval);
        (async () => {
          const firestoreTrainings = await fetchFirestoreTrainings();
          const merged = mergeFirestoreIntoTrainingsData(window.trainingsData, firestoreTrainings);
          trainingsDataCache = merged;
          isLoading = false;
          resolve(merged);
        })();
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
