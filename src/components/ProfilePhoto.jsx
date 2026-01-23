import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';

const ProfilePhoto = ({ 
  src, 
  alt = "Foto de perfil", 
  className = "", 
  fallbackIcon = true, 
  fallbackText = null,
  size = "md" 
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);
  const timeoutRef = useRef(null);
  const imgRef = useRef(null);

  // Resetar estados quando src mudar
  useEffect(() => {
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (src) {
      setHasError(false);
      setIsLoading(true);
      
      // Timeout de segurança - se não carregar em 5s, mostra fallback
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        // Se ainda não carregou, considerar como erro
        if (imgRef.current && !imgRef.current.complete) {
          setHasError(true);
        }
      }, 5000);
    } else {
      setHasError(false);
      setIsLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [src]);

  // Verificar se a imagem já está em cache (carregou instantaneamente)
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && src) {
      setIsLoading(false);
    }
  }, [src]);

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8", 
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-32 h-32"
  };

  const iconSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    "2xl": 48
  };

  const handleError = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setHasError(false);
    setIsLoading(false);
  };

  // Verificar se é uma URL de blob (local) - não deve usar crossOrigin
  const isBlobUrl = src && src.startsWith('blob:');

  // Se não há src ou houve erro, mostrar fallback
  if (!src || hasError || src === '') {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white`}>
        {fallbackText ? (
          <span className="font-semibold">
            {fallbackText.charAt(0).toUpperCase()}
          </span>
        ) : fallbackIcon ? (
          <User size={iconSizes[size]} />
        ) : (
          <span className="font-semibold">U</span>
        )}
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden relative`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 ios-image-fix`}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        decoding="async"
        {...(!isBlobUrl && { crossOrigin: "anonymous" })}
        referrerPolicy="no-referrer"
        style={{
          WebkitTransform: 'translateZ(0)',
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          backfaceVisibility: 'hidden'
        }}
      />
    </div>
  );
};

export default ProfilePhoto;
