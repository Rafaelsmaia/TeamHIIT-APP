import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Instagram, User, Dumbbell, Camera, X, Utensils } from 'lucide-react';
import { PlatformConfig } from '../../config/platform.js';
import { openCameraInput } from '../../utils/fileInput.js';

function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  
  // Estados para o modal de opções
  const [capturedImage, setCapturedImage] = useState(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);

  const isActive = (path) => {
    if (!path) return false;
    
    // Normalizar pathname removendo trailing slashes
    const currentPath = location.pathname.replace(/\/$/, '') || '/';
    const targetPath = path.replace(/\/$/, '') || '/';
    
    // Dashboard pode ser acessado por '/' ou '/dashboard'
    if (targetPath === '/dashboard' && (currentPath === '/' || currentPath === '/dashboard')) {
      return true;
    }
    
    return currentPath === targetPath;
  };

  // Função para comprimir imagem antes de salvar
  const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      let objectUrl = null;
      try {
        if (!window.Image) {
          console.warn('Image constructor não disponível, usando arquivo original');
          resolve(file);
          return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new window.Image();
        
        img.onload = () => {
          try {
            let { width, height } = img;
            
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob(
              (blob) => {
                // Limpar objectURL
                if (objectUrl) {
                  URL.revokeObjectURL(objectUrl);
                }
                
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now()
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } catch (error) {
            if (objectUrl) {
              URL.revokeObjectURL(objectUrl);
            }
            console.warn('Erro na compressão, usando arquivo original:', error);
            resolve(file);
          }
        };

        img.onerror = () => {
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
          }
          console.warn('Erro ao carregar imagem, usando arquivo original');
          resolve(file);
        };

        objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;
      } catch (error) {
        if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
        }
        console.warn('Erro na compressão, usando arquivo original:', error);
        resolve(file);
      }
    });
  };

  // Handler para captura de foto
  const handleCameraCapture = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Comprimir imagem antes de mostrar preview
      try {
        const compressedFile = await compressImage(file);
        const imageUrl = URL.createObjectURL(compressedFile);
        setCapturedImage({ file: compressedFile, url: imageUrl });
        setShowOptionsModal(true);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        // Fallback: usar arquivo original
        const imageUrl = URL.createObjectURL(file);
        setCapturedImage({ file, url: imageUrl });
        setShowOptionsModal(true);
      }
    }
    // Limpar input para permitir nova captura
    e.target.value = '';
  };

  // Fechar modal e limpar imagem
  const closeModal = () => {
    if (capturedImage?.url) {
      URL.revokeObjectURL(capturedImage.url);
    }
    setCapturedImage(null);
    setShowOptionsModal(false);
  };

  // Navegar para InstaHIIT com a imagem
  const goToInstaHIIT = async () => {
    // Salvar a imagem no sessionStorage para usar na Community
    if (capturedImage?.file) {
      try {
        // Comprimir ainda mais se necessário (garantir que seja pequena para sessionStorage)
        let finalFile = capturedImage.file;
        
        // Se o arquivo for maior que 2MB, comprimir mais
        if (finalFile.size > 2 * 1024 * 1024) {
          finalFile = await compressImage(capturedImage.file, 800, 0.6);
          // Se ainda for grande, comprimir ainda mais
          if (finalFile.size > 2 * 1024 * 1024) {
            finalFile = await compressImage(capturedImage.file, 600, 0.5);
          }
        }

        // Verificar se ainda é muito grande após compressão
        if (finalFile.size > 4 * 1024 * 1024) {
          alert('A imagem é muito grande. Por favor, tire outra foto ou escolha uma imagem menor.');
          return;
        }

        // Converter para base64 e salvar
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const base64 = reader.result;
            // Verificar tamanho do base64 (é ~33% maior que o arquivo original)
            if (base64.length > 5 * 1024 * 1024) {
              alert('A imagem é muito grande mesmo após compressão. Por favor, tire outra foto.');
              return;
            }
            
            sessionStorage.setItem('pendingPostImage', base64);
            sessionStorage.setItem('pendingPostImageName', finalFile.name);
            sessionStorage.setItem('pendingPostImageType', finalFile.type);
            closeModal();
            navigate('/community');
          } catch (error) {
            console.error('Erro ao salvar imagem no sessionStorage:', error);
            alert('Erro ao processar imagem. Tente novamente.');
          }
        };
        reader.onerror = () => {
          console.error('Erro ao ler arquivo');
          alert('Erro ao processar imagem. Tente novamente.');
        };
        reader.readAsDataURL(finalFile);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        alert('Erro ao processar imagem. Tente novamente.');
      }
    }
  };

  // Navegar para Calculadora de Calorias com a imagem
  const goToCalorieCalculator = async () => {
    if (capturedImage?.file) {
      try {
        // Comprimir ainda mais se necessário (garantir que seja pequena para sessionStorage)
        let finalFile = capturedImage.file;
        
        // Se o arquivo for maior que 2MB, comprimir mais
        if (finalFile.size > 2 * 1024 * 1024) {
          finalFile = await compressImage(capturedImage.file, 800, 0.6);
          // Se ainda for grande, comprimir ainda mais
          if (finalFile.size > 2 * 1024 * 1024) {
            finalFile = await compressImage(capturedImage.file, 600, 0.5);
          }
        }

        // Verificar se ainda é muito grande após compressão
        if (finalFile.size > 4 * 1024 * 1024) {
          alert('A imagem é muito grande. Por favor, tire outra foto ou escolha uma imagem menor.');
          return;
        }

        // Converter para base64 e salvar
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const base64 = reader.result;
            // Verificar tamanho do base64 (é ~33% maior que o arquivo original)
            if (base64.length > 5 * 1024 * 1024) {
              alert('A imagem é muito grande mesmo após compressão. Por favor, tire outra foto.');
              return;
            }
            
            sessionStorage.setItem('pendingCalorieImage', base64);
            sessionStorage.setItem('pendingCalorieImageName', finalFile.name);
            sessionStorage.setItem('pendingCalorieImageType', finalFile.type);
            closeModal();
            navigate('/nutrition');
          } catch (error) {
            console.error('Erro ao salvar imagem no sessionStorage:', error);
            alert('Erro ao processar imagem. Tente novamente.');
          }
        };
        reader.onerror = () => {
          console.error('Erro ao ler arquivo');
          alert('Erro ao processar imagem. Tente novamente.');
        };
        reader.readAsDataURL(finalFile);
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        alert('Erro ao processar imagem. Tente novamente.');
      }
    }
  };

  const openCameraPicker = () => {
    openCameraInput(cameraInputRef.current, galleryInputRef.current);
  };

  // Ocultar o menu inferior na página de apresentação do vídeo (VideoPlayer) e no player dedicado
  const shouldHideNavigation = location.pathname.startsWith('/video/') || location.pathname.startsWith('/player/');

  // Se deve ocultar, não renderizar nada
  if (shouldHideNavigation) {
    return null;
  }

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Início',
      icon: Home,
      path: '/dashboard'
    },
    {
      id: 'teamhiit',
      label: 'TeamHIIT',
      icon: Dumbbell,
      path: '/teamhiit'
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      path: '/profile'
    }
  ];

  if (PlatformConfig.isCommunityEnabled) {
    menuItems.splice(
      2,
      0,
      {
        id: 'camera',
        label: '',
        icon: null,
        path: null,
        isCamera: true
      },
      {
        id: 'instahiit',
        label: 'InstaHIIT',
        icon: Instagram,
        path: '/community'
      }
    );
  }

  return (
    <>
      {/* Input oculto para câmera */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleCameraCapture}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      {/* Modal de opções após captura */}
      {showOptionsModal && capturedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Preview da imagem */}
            <div className="relative">
              <img
                src={capturedImage.url}
                alt="Foto capturada"
                className="w-full aspect-square object-cover"
              />
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Opções */}
            <div className="p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                O que deseja fazer?
              </h3>

              {/* Botão InstaHIIT */}
              <button
                onClick={goToInstaHIIT}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Instagram className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-lg">Postar no InstaHIIT</span>
                  <p className="text-sm text-white/80">Compartilhe com a comunidade</p>
                </div>
              </button>

              {/* Botão Calculadora */}
              <button
                onClick={goToCalorieCalculator}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
              >
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Utensils className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-lg">Calcular Calorias</span>
                  <p className="text-sm text-white/80">Analise os nutrientes da refeição</p>
                </div>
              </button>

              {/* Botão Cancelar */}
              <button
                onClick={closeModal}
                className="w-full p-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation - Visível em todos os dispositivos */}
      <div className="bottom-navigation fixed bottom-0 left-0 right-0 w-full z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="relative px-2 pb-2 mx-auto" style={{ maxWidth: '640px' }}>
        <div
            className="backdrop-blur-sm border border-gray-200 rounded-3xl shadow-2xl relative mx-auto"
          style={{
            backgroundColor: '#E8EDFF'
          }}
        >
          <div className="flex justify-evenly items-center py-2 px-3 relative">
            {menuItems.map((item) => {
                // Botão central da câmera
                if (item.isCamera) {
                  return (
                    <button
                      key={item.id}
                      onClick={openCameraPicker}
                      className="relative -mt-8 flex flex-col items-center justify-center"
                      aria-label="Câmera"
                    >
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 border-4 border-white hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 active:scale-95">
                        <Camera size={28} className="text-white" />
                      </div>
                    </button>
                  );
                }

              const IconComponent = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.path) {
                      navigate(item.path);
                    }
                  }}
                  className="flex flex-col items-center justify-center py-1 px-2 transition-colors relative rounded-xl"
                  aria-label={item.label}
                  data-active={active ? 'true' : 'false'}
                  data-path={item.path}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      active ? 'bg-blue-500' : 'bg-white border border-gray-200'
                    }`}
                  >
                    <IconComponent size={20} className={active ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <span
                    className={`text-xs font-medium transition-all duration-300 ${
                      active ? 'text-blue-600 opacity-100' : 'text-gray-700 opacity-0'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default BottomNavigation;
