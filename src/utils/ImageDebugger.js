// Utilitário para debug de imagens
export const debugImageLoading = (imageUrls) => {
  console.log('🔍 [ImageDebugger] Verificando URLs de imagens:', imageUrls);
  
  imageUrls.forEach((url, index) => {
    const img = new Image();
    
    img.onload = () => {
      console.log(`✅ [ImageDebugger] Imagem ${index + 1} carregada:`, url);
    };
    
    img.onerror = () => {
      console.error(`❌ [ImageDebugger] Imagem ${index + 1} falhou:`, url);
      
      // Tentar verificar se o arquivo existe
      fetch(url, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log(`📁 [ImageDebugger] Arquivo existe mas não carregou:`, url);
          } else {
            console.error(`🚫 [ImageDebugger] Arquivo não existe (${response.status}):`, url);
          }
        })
        .catch(error => {
          console.error(`🌐 [ImageDebugger] Erro de rede:`, url, error);
        });
    };
    
    img.src = url;
  });
};

// Função para verificar cache de imagens
export const debugImageCache = () => {
  if (window.imageCache) {
    console.log('🖼️ [ImageDebugger] Cache de imagens:');
    console.log('📊 Total de imagens em cache:', window.imageCache.size);
    
    window.imageCache.forEach((value, key) => {
      console.log('💾 Imagem em cache:', key);
    });
  } else {
    console.warn('⚠️ [ImageDebugger] Cache de imagens não inicializado');
  }
};

// Função para pre-carregar imagens essenciais
export const preloadEssentialImages = async () => {
  const essentialImages = [
    '/IMAGES/CAPAS TEAM HIIT/capa TH.png',
    '/IMAGES/CAPAS TEAM HIIT/COMECE AQUI 2.png',
    '/IMAGES/LOGOS/ICONE-TH.png'
  ];
  
  console.log('🚀 [ImageDebugger] Pré-carregando imagens essenciais...');
  
  const loadPromises = essentialImages.map(url => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (window.imageCache) {
          window.imageCache.set(url, img);
        }
        console.log('✅ [ImageDebugger] Imagem essencial carregada:', url);
        resolve({ url, success: true });
      };
      img.onerror = () => {
        console.error('❌ [ImageDebugger] Falha ao carregar imagem essencial:', url);
        resolve({ url, success: false });
      };
      img.src = url;
    });
  });
  
  const results = await Promise.all(loadPromises);
  const successCount = results.filter(r => r.success).length;
  
  console.log(`📊 [ImageDebugger] Pré-carregamento concluído: ${successCount}/${essentialImages.length} imagens`);
  
  return results;
};
