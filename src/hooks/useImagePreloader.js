import { useEffect, useState } from 'react';

// Hook para pré-carregar imagens específicas
export const useImagePreloader = (imageUrls = []) => {
  const [loadedImages, setLoadedImages] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageUrls.length) return;

    setIsLoading(true);
    const loadPromises = imageUrls.map(url => {
      return new Promise((resolve) => {
        // Verificar se já está no cache global
        if (window.imageCache && window.imageCache.has(url)) {
          setLoadedImages(prev => new Set([...prev, url]));
          resolve({ url, success: true, cached: true });
          return;
        }

        const img = new Image();
        img.onload = () => {
          // Adicionar ao cache global
          if (window.imageCache) {
            window.imageCache.set(url, img);
          }
          setLoadedImages(prev => new Set([...prev, url]));
          resolve({ url, success: true });
        };
        img.onerror = () => {
          resolve({ url, success: false });
        };
        img.src = url;
      });
    });

    Promise.all(loadPromises).then(() => {
      setIsLoading(false);
    });
  }, [imageUrls]);

  return { loadedImages, isLoading };
};

// Hook para pré-carregar imagens dos treinos
export const useTrainingImagesPreloader = () => {
  const [trainingImages, setTrainingImages] = useState([]);
  const [allImagesLoaded, setAllImagesLoaded] = useState(false);

  useEffect(() => {
    const extractTrainingImages = () => {
      const images = [];
      
      if (window.trainingsData && window.trainingsData.sections) {
        window.trainingsData.sections.forEach(section => {
          section.trainings.forEach(training => {
            if (training.imageUrl) {
              images.push(`/${training.imageUrl}`);
            }
            if (training.modules) {
              training.modules.forEach(module => {
                if (module.thumbnail) {
                  images.push(`/${module.thumbnail}`);
                }
              });
            }
          });
        });
      }
      
      return images;
    };

    const preloadImages = async (images) => {
      if (images.length === 0) return;

      const loadPromises = images.map(url => {
        return new Promise((resolve) => {
          // Verificar se já está no cache
          if (window.imageCache && window.imageCache.has(url)) {
            resolve({ url, success: true, cached: true });
            return;
          }

          const img = new Image();
          img.onload = () => {
            // Adicionar ao cache global
            if (window.imageCache) {
              window.imageCache.set(url, img);
            }
            resolve({ url, success: true });
          };
          img.onerror = () => {
            resolve({ url, success: false });
          };
          img.src = url;
        });
      });

      await Promise.all(loadPromises);
      setAllImagesLoaded(true);
    };

    // Tentar extrair imagens imediatamente
    const images = extractTrainingImages();
    if (images.length > 0) {
      setTrainingImages(images);
      preloadImages(images);
      return;
    }

    // Se não conseguiu, aguardar trainingsData carregar
    const checkInterval = setInterval(() => {
      const newImages = extractTrainingImages();
      if (newImages.length > 0) {
        setTrainingImages(newImages);
        preloadImages(newImages);
        clearInterval(checkInterval);
      }
    }, 100);

    // Timeout de segurança
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 5000);

    return () => clearInterval(checkInterval);
  }, []);

  return { 
    loadedImages: new Set(trainingImages), 
    isLoading: !allImagesLoaded && trainingImages.length > 0 
  };
};
