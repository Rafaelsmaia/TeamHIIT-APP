import { useEffect, useRef, useState } from 'react';

const SplashScreen = () => {
  const splashRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  
  // Garantir que o fallback do HTML seja removido quando este componente montar
  useEffect(() => {
    // Remover fallback imediatamente para evitar piscar
    const loadingFallback = document.getElementById('loading-fallback');
    if (loadingFallback) {
      // Remover imediatamente sem transição para evitar piscar
      if (loadingFallback.parentNode) {
        loadingFallback.remove();
      }
    }
    
    // Garantir que o componente seja visível
    setIsVisible(true);
    
    return () => {
      // Cleanup - garantir remoção do fallback se ainda existir
      const remainingFallback = document.getElementById('loading-fallback');
      if (remainingFallback && remainingFallback.parentNode) {
        remainingFallback.remove();
      }
    };
  }, []);
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div 
      ref={splashRef}
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999] overflow-hidden"
      style={{
        willChange: 'opacity',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <img 
        src="/IMAGES/SPLASH SCREEN.jpg" 
        alt="Team HIIT Splash Screen" 
        className="w-full h-full object-cover"
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          willChange: 'opacity',
          backfaceVisibility: 'hidden'
        }}
      />
    </div>
  );
};

export default SplashScreen;

