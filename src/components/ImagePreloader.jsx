import { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen.jsx';

// Cache global para imagens pré-carregadas
window.imageCache = new Map();

const ImagePreloader = ({ children, onLoadComplete, showSplash = true }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Extrair TODAS as imagens que precisam ser carregadas
  const getAllImageUrls = () => {
    const imageUrls = new Set();
    
    // FASE 1: TODAS as imagens dos treinos (PRIORIDADE MÁXIMA)
    if (window.trainingsData && window.trainingsData.sections) {
      window.trainingsData.sections.forEach(section => {
        section.trainings.forEach(training => {
          if (training.imageUrl) {
            // Codificar URL para funcionar no PWA
            imageUrls.add(encodeURI(`/${training.imageUrl}`));
          }
          // Também carregar thumbnails dos vídeos se existirem
          if (training.modules) {
            training.modules.forEach(module => {
              if (module.thumbnail) {
                // Codificar URL para funcionar no PWA
                imageUrls.add(encodeURI(`/${module.thumbnail}`));
              }
            });
          }
        });
      });
    }
    
    // FASE 2: Imagens críticas conhecidas
    const criticalImages = [
      '/BANNER PRINCIPAL/TREINOS-GRATIS.png',
      '/BANNER PRINCIPAL/TREINOS-GRATIS-vertical.png',
      '/BANNER PRINCIPAL/Indique-um-amigo.png',
      '/BANNER PRINCIPAL/Indique-um-amigo-vertical.png',
      '/fina.png',
      '/team-hiit-icon.png',
      '/iconePWA.png'
    ];
    
    criticalImages.forEach(url => imageUrls.add(url));
    
    return Array.from(imageUrls);
  };

  // Preload com cache global
  const preloadImages = async () => {
    const imageUrls = getAllImageUrls();

    let loaded = 0;
    const maxConcurrent = 12; // Aumentado para carregar mais rápido
    
    // Separar imagens dos treinos das outras para dar prioridade
    const trainingImages = [];
    const otherImages = [];
    
    if (window.trainingsData && window.trainingsData.sections) {
      window.trainingsData.sections.forEach(section => {
        section.trainings.forEach(training => {
          if (training.imageUrl) {
            // Codificar URL para funcionar no PWA
            const encodedUrl = encodeURI(`/${training.imageUrl}`);
            trainingImages.push(encodedUrl);
          }
          if (training.modules) {
            training.modules.forEach(module => {
              if (module.thumbnail) {
                // Codificar URL para funcionar no PWA
                const encodedUrl = encodeURI(`/${module.thumbnail}`);
                trainingImages.push(encodedUrl);
              }
            });
          }
        });
      });
    }
    
    // Adicionar outras imagens
    const criticalImages = [
      '/BANNER PRINCIPAL/TREINOS-GRATIS.png',
      '/BANNER PRINCIPAL/TREINOS-GRATIS-vertical.png',
      '/BANNER PRINCIPAL/Indique-um-amigo.png',
      '/BANNER PRINCIPAL/Indique-um-amigo-vertical.png',
      '/fina.png',
      '/team-hiit-icon.png',
      '/iconePWA.png'
    ];
    otherImages.push(...criticalImages);
    
    // Função para carregar uma imagem com cache
    const loadImage = (url) => {
      return new Promise((resolve) => {
        // Verificar se já está no cache
        if (window.imageCache.has(url)) {
          loaded++;
          resolve({ url, success: true, cached: true });
          return;
        }

        const img = new Image();
        let timeoutId;
        
        const handleComplete = (success = true) => {
          if (timeoutId) clearTimeout(timeoutId);
          
          // Adicionar ao cache global
          if (success) {
            window.imageCache.set(url, img);
          }
          
          loaded++;
          
          resolve({ url, success });
        };
        
        // Timeout de 8 segundos por imagem
        timeoutId = setTimeout(() => {
          handleComplete(false);
        }, 8000);
        
        img.onload = () => handleComplete(true);
        img.onerror = () => {
          handleComplete(false);
        };
        
        img.src = url;
      });
    };
    
    try {
      // Carregar PRIMEIRO as imagens dos treinos com prioridade máxima
      // Carregar imagens dos treinos em lotes menores para máxima velocidade
      const trainingBatches = [];
      for (let i = 0; i < trainingImages.length; i += 6) { // Lotes menores para treinos
        trainingBatches.push(trainingImages.slice(i, i + 6));
      }
      
      for (const batch of trainingBatches) {
        await Promise.all(batch.map(loadImage));
      }
      
      // Depois carregar outras imagens
      const otherBatches = [];
      for (let i = 0; i < otherImages.length; i += maxConcurrent) {
        otherBatches.push(otherImages.slice(i, i + maxConcurrent));
      }
      
      for (const batch of otherBatches) {
        await Promise.all(batch.map(loadImage));
      }
      
      console.log('✅ Preload de imagens concluído em background');
      
    } catch (error) {
      console.warn('⚠️ Erro no preload de imagens (background):', error);
      // Não faz nada - imagens já estavam liberadas
    }
  };

  useEffect(() => {
    // Aguardar trainings.js carregar com timeout de 2 segundos (REDUZIDO)
    let attempts = 0;
    const maxAttempts = 20; // 2 segundos máximo (20 tentativas × 100ms)
    
    // Timeout de segurança REDUZIDO para não bloquear o acesso
    const maxTimeout = setTimeout(() => {
      console.warn('⏱️ Timeout de 2 segundos atingido - liberando acesso (imagens carregarão em background)');
      setIsLoading(false);
      if (onLoadComplete) {
        onLoadComplete();
      }
    }, 2000); // REDUZIDO de 5000 para 2000ms
    
    const checkTrainingsData = () => {
      attempts++;
      
      if (window.trainingsData) {
        clearTimeout(maxTimeout);
        // Liberar acesso IMEDIATAMENTE e carregar imagens em background
        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete();
        }
        // Carregar imagens em background (não bloqueia mais)
        preloadImages().catch(err => {
          console.warn('⚠️ Erro ao preload de imagens (background):', err);
        });
      } else if (attempts < maxAttempts) {
        setTimeout(checkTrainingsData, 100);
      } else {
        // Se não conseguir carregar os dados, continuar sem preload
        clearTimeout(maxTimeout);
        console.warn('⏱️ Timeout ao aguardar trainings.js - liberando acesso');
        setIsLoading(false);
        if (onLoadComplete) {
          onLoadComplete();
        }
      }
    };
    
    checkTrainingsData();
    
    // Cleanup
    return () => {
      clearTimeout(maxTimeout);
    };
  }, []);

  // Mostrar splash screen apenas se estiver carregando E não estiver no modo de erro
  if (isLoading) {
    return (
      showSplash ? (
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
          <SplashScreen />
        </div>
      ) : null
    );
  }

  return children;
};

export default ImagePreloader;

