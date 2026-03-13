import { useState, useEffect, useMemo } from 'react';

const InstantImage = ({ 
  src, 
  alt, 
  className = '', 
  style = {},
  darkMode = false,
  onLoad,
  onError,
  fallback = null,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');
  const [triedFallback, setTriedFallback] = useState(false);

  // Função para processar URL com encoding completo (espaços e caracteres especiais)
  const processImageUrl = (url) => {
    if (!url) return '';
    // URLs absolutas (Firebase Storage, etc.) já vêm codificadas — não aplicar encodeURI para não quebrar
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    try {
      return encodeURI(url);
    } catch (error) {
      console.error('Erro ao codificar URL:', url, error);
      return url.replace(/ /g, '%20');
    }
  };

  const normalizeImagePath = (url) => {
    if (!url) return '';

    // Não alterar URLs absolutas (Firebase Storage, CDN) nem blob (preview de arquivo selecionado)
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }

    let normalized = url.startsWith('/') ? url : `/${url}`;

    normalized = normalized.replace(/^\/CAPAS TEAM HIIT/, '/IMAGES/CAPAS TEAM HIIT');
    normalized = normalized.replace(/^\/CAPAS HORIZONTAIS/, '/IMAGES/CAPAS HORIZONTAIS');
    normalized = normalized.replace(/^\/LOGOS/, '/IMAGES/LOGOS');
    normalized = normalized.replace(/^\/IMAGES\/IMAGES\//, '/IMAGES/');

    return normalized;
  };

  const fallbackSrc = useMemo(() => fallback || '/IMAGES/CAPAS TEAM HIIT/capa TH.png', [fallback]);
  const normalizedSrc = useMemo(() => normalizeImagePath(src || fallbackSrc), [fallbackSrc, src]);
  const processedSrc = useMemo(() => processImageUrl(normalizedSrc), [normalizedSrc]);

  const computeIsTrainingImage = (url) => {
    if (!url) return false;
    return (
      url.includes('IMAGES/CAPAS TEAM HIIT') ||
      url.includes('IMAGES/CAPAS HORIZONTAIS') ||
      url.includes('BANNER PRINCIPAL')
    );
  };

  const isTrainingImage = useMemo(() => computeIsTrainingImage(processedSrc), [processedSrc]);

  useEffect(() => {
    if (!processedSrc) {
      console.warn('🖼️ [InstantImage] URL vazia:', { src, processedSrc });
      return;
    }


    // Verificar se a imagem está no cache global
    if (window.imageCache && window.imageCache.has(processedSrc)) {
      // Imagem já está carregada no cache - mostrar instantaneamente
      setIsLoaded(true);
      setHasError(false);
      setCurrentSrc(processedSrc);
      if (onLoad) onLoad();
      return;
    }

    // Se não está no cache, carregar IMEDIATAMENTE
    const img = new Image();
    
    // Configurar para carregamento otimizado
    img.loading = 'eager'; // Eager loading para imagens visíveis
    img.fetchPriority = 'high'; // Prioridade alta para capas
    img.crossOrigin = 'anonymous';
    img.decoding = 'async'; // Decodificação assíncrona
    
    // Timeout para evitar loading infinito
    const timeout = setTimeout(() => {
      console.warn('⏰ [InstantImage] Timeout ao carregar imagem:', processedSrc);
      setHasError(true);
      setIsLoaded(false);
    }, 10000); // 10 segundos timeout
    
    // Função para lidar com o carregamento
    const handleLoad = () => {
      clearTimeout(timeout);
      
      // Adicionar ao cache global IMEDIATAMENTE
      if (window.imageCache) {
        window.imageCache.set(processedSrc, img);
      }
      setIsLoaded(true);
      setHasError(false);
      setCurrentSrc(processedSrc);
      if (onLoad) onLoad();
    };
    
    const handleError = (e) => {
      clearTimeout(timeout);
      console.error('❌ [InstantImage] Erro ao carregar imagem:', processedSrc, e);
      
      // Se há fallback e ainda não tentou, tentar carregar o fallback
      if (fallback && !triedFallback) {
        setTriedFallback(true);
        const normalizedFallback = normalizeImagePath(fallback);
        const processedFallback = processImageUrl(normalizedFallback);
        
        // Verificar se o fallback está no cache
        if (window.imageCache && window.imageCache.has(processedFallback)) {
          setCurrentSrc(processedFallback);
          setIsLoaded(true);
          setHasError(false);
          if (onLoad) onLoad();
          return;
        }
        
        // Tentar carregar o fallback
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = 'anonymous';
        
        const fallbackTimeout = setTimeout(() => {
          console.warn('⏰ [InstantImage] Timeout ao carregar fallback:', processedFallback);
          setHasError(true);
          setIsLoaded(false);
        }, 10000);
        
        fallbackImg.onload = () => {
          clearTimeout(fallbackTimeout);
          if (window.imageCache) {
            window.imageCache.set(processedFallback, fallbackImg);
          }
          setCurrentSrc(processedFallback);
          setIsLoaded(true);
          setHasError(false);
          if (onLoad) onLoad();
        };
        
        fallbackImg.onerror = () => {
          clearTimeout(fallbackTimeout);
          setHasError(true);
          setIsLoaded(false);
          if (onError) onError(e);
        };
        
        fallbackImg.src = processedFallback;
        return;
      }
      
      // Tentar fallback para imagem padrão se for imagem de treino
      const trainingPlaceholder = computeIsTrainingImage(processedSrc);
      if (trainingPlaceholder && !processedSrc.includes('COMECE AQUI')) {
        const defaultFallback = encodeURI('/IMAGES/CAPAS TEAM HIIT/capa TH.png');
        if (window.imageCache && window.imageCache.has(defaultFallback)) {
          setCurrentSrc(defaultFallback);
          setIsLoaded(true);
          setHasError(false);
          return;
        }
      }
      
      setHasError(true);
      setIsLoaded(false);
      if (onError) onError(e);
    };
    
    img.onload = handleLoad;
    img.onerror = handleError;
    
    // Carregar IMEDIATAMENTE
    img.src = processedSrc;
    
    return () => {
      clearTimeout(timeout);
      img.onload = null;
      img.onerror = null;
    };
  }, [processedSrc, onLoad, onError, src]);

  // Reset states quando src muda - MAS manter se estiver no cache
  useEffect(() => {
    // Se a nova src está no cache, não resetar
    if (window.imageCache && window.imageCache.has(processedSrc)) {
      setIsLoaded(true);
      setHasError(false);
      setCurrentSrc(processedSrc);
      setTriedFallback(false);
      return;
    }
    
    setIsLoaded(false);
    setHasError(false);
    setCurrentSrc('');
    setTriedFallback(false);
  }, [src, processedSrc]);

  // Placeholder para erro
  const ErrorPlaceholder = () => (
    <div 
      className={`flex items-center justify-center bg-gray-100 ${darkMode ? 'bg-gray-800' : ''} ${className}`}
      style={style}
    >
      <div className="text-center text-gray-400">
        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
        <p className="text-xs">Imagem não encontrada</p>
      </div>
    </div>
  );

  // Placeholder de loading (só aparece se não estiver no cache)
  const LoadingPlaceholder = () => (
    <div 
      className={`flex items-center justify-center bg-gray-200 ${darkMode ? 'bg-gray-700' : ''} ${className} animate-pulse`}
      style={style}
    >
      <div className="text-center text-gray-400">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs">Carregando...</p>
      </div>
    </div>
  );

  // Placeholder específico para imagens de treino
  const TrainingImagePlaceholder = () => (
    <div 
      className={`w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center ${className}`}
      style={style}
    >
      <div className="text-white text-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm font-medium">Carregando capa...</p>
      </div>
    </div>
  );

  // Verificar se a imagem está no cache para evitar mostrar loading
  const isInCache = window.imageCache && window.imageCache.has(processedSrc);
  
  return (
    <div className={className} style={style}>
      {/* Mostrar imagem se estiver carregada */}
      {isLoaded && !hasError && (
        <img
          src={currentSrc}
          alt={alt}
          className="w-full h-full"
          style={{ 
            objectFit: style?.objectFit || 'cover',
            objectPosition: style?.objectPosition || 'center',
            display: 'block'
          }}
          loading="eager"
          {...props}
        />
      )}
      
      {/* Mostrar placeholder de erro se houver erro e não houver fallback */}
      {hasError && !fallback && <ErrorPlaceholder />}
      
      {/* Mostrar placeholder de loading APENAS se não for imagem de treino, não estiver carregada, não estiver no cache E não houver erro */}
      {!isLoaded && !hasError && !isInCache && !isTrainingImage && <LoadingPlaceholder />}
      
      {/* Para imagens de treino, mostrar placeholder específico se não estiver carregada */}
      {!isLoaded && !hasError && !isInCache && isTrainingImage && <TrainingImagePlaceholder />}
    </div>
  );
};

export default InstantImage;

