import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const CircularProfileCropModal = ({
  open,
  file,
  onCancel,
  onConfirm
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(null);
  // Estado interno para controlar o Dialog - inicializar como true se temos file
  const [internalOpen, setInternalOpen] = useState(!!file);
  
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const blobUrlRef = useRef(null);
  const preventCloseRef = useRef(false); // Ref para prevenir fechamento acidental
  const userRequestedCloseRef = useRef(false); // Ref para rastrear se o fechamento foi solicitado pelo usuário

  // Tamanho do círculo de crop (em pixels)
  const CROP_SIZE = 300;
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 3;

  useEffect(() => {
    // NÃO depender de 'open' aqui - apenas de 'file' para evitar limpeza acidental
    // O modal pode estar aberto mesmo se 'open' mudar temporariamente
    if (!file) {
      // Só limpar se não há arquivo
      console.log('[CircularProfileCrop] Sem arquivo - limpando blob URL');
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setImageUrl(null);
      setImageSize(null);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setImageError(null);
      return;
    }

    // Se já temos uma blob URL para este arquivo, não criar novamente
    if (blobUrlRef.current && imageUrl) {
      console.log('[CircularProfileCrop] Blob URL já existe - reutilizando');
      return;
    }

    console.log('[CircularProfileCrop] Criando blob URL para arquivo:', file.name, file.type);
    
    // Limpar blob URL anterior se existir antes de criar nova
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    
    // Criar blob URL e manter referência
    try {
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      setImageUrl(url);
      setImageError(null);
      console.log('[CircularProfileCrop] Blob URL criada com sucesso:', url.substring(0, 50));
    } catch (error) {
      console.error('[CircularProfileCrop] Erro ao criar blob URL:', error);
      setImageError('Erro ao processar o arquivo. Por favor, tente novamente.');
    }

    return () => {
      // Não revogar imediatamente aqui - deixar para quando componente desmontar completamente
      // ou quando file mudar para null
    };
  }, [file]); // APENAS depender de 'file', não de 'open'

  // Limpar blob URL quando componente desmontar
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!imageUrl) return;

    console.log('[CircularProfileCrop] Carregando imagem da URL:', imageUrl.substring(0, 50));
    
    const image = new Image();
    // Não usar crossOrigin para blob URLs
    if (!imageUrl.startsWith('blob:')) {
      image.crossOrigin = 'anonymous';
    }
    
    image.onload = () => {
      console.log('[CircularProfileCrop] Imagem carregada com sucesso:', image.naturalWidth, 'x', image.naturalHeight);
      imageRef.current = image;
      setImageSize({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
      setImageError(null);
      
      // Calcular escala inicial para preencher o círculo
      // Usar um tamanho base para cálculo inicial
      const baseSize = 300;
      const initialScale = Math.max(
        baseSize / image.naturalWidth,
        baseSize / image.naturalHeight
      ) * 1.2; // 20% maior para dar espaço para ajuste
      
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
    };
    
    image.onerror = (error) => {
      console.error('[CircularProfileCrop] Erro ao carregar a imagem:', error);
      console.error('[CircularProfileCrop] imageUrl:', imageUrl);
      console.error('[CircularProfileCrop] Blob URL ainda válida?', blobUrlRef.current === imageUrl);
      setImageError('Não foi possível carregar a imagem. Por favor, tente novamente.');
      setImageSize(null);
      imageRef.current = null;
      // Não fechar o modal automaticamente - deixar o usuário decidir
    };
    
    // Tentar carregar a imagem
    try {
      image.src = imageUrl;
    } catch (error) {
      console.error('[CircularProfileCrop] Erro ao definir src da imagem:', error);
      setImageError('Erro ao processar a imagem. Por favor, tente novamente.');
      setImageSize(null);
      imageRef.current = null;
    }
    
    return () => {
      // Não limpar imageRef aqui para evitar problemas
    };
  }, [imageUrl]);

  // Forçar redesenho quando a imagem carregar ou quando o modal abrir
  useEffect(() => {
    // Usar file ao invés de open para garantir que redesenha quando modal está aberto
    if (!file || !imageRef.current || !imageSize) return;
    
    // Disparar redesenho após a imagem carregar e modal estar aberto
    // Usar setTimeout maior para garantir que o modal esteja completamente renderizado
    const timeoutId = setTimeout(() => {
      if (canvasRef.current && containerRef.current) {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        
        if (rect.width > 0 && rect.height > 0) {
          // Forçar redimensionamento do canvas
          canvas.width = rect.width;
          canvas.height = rect.height;
          
          // Forçar redesenho imediatamente
          const ctx = canvas.getContext('2d');
          if (ctx && imageRef.current) {
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const radius = Math.min(rect.width, rect.height) / 2 - 10;
            
            // Limpar e desenhar
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.fillRect(0, 0, rect.width, rect.height);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();
            
            const img = imageRef.current;
            if (img && img.complete && img.naturalWidth > 0) {
              const scaledWidth = img.naturalWidth * scale;
              const scaledHeight = img.naturalHeight * scale;
              const imgX = centerX - scaledWidth / 2 + position.x;
              const imgY = centerY - scaledHeight / 2 + position.y;
              ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);
            }
            
            ctx.restore();
            
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
    }, 300); // Delay maior para garantir que o modal esteja totalmente renderizado

    return () => clearTimeout(timeoutId);
  }, [file, imageSize, internalOpen, scale, position]); // Usar file e internalOpen ao invés de open

  // Desenhar preview no canvas
  useEffect(() => {
    // Usar file ao invés de open - se temos file, desenhar (modal deve estar aberto)
    if (!file) return;
    
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current || !imageSize) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const container = containerRef.current;
      if (!container) return;

      // Usar tamanho do container para o canvas
      const containerRect = container.getBoundingClientRect();
      const canvasWidth = containerRect.width || 400;
      const canvasHeight = containerRect.height || 400;
      
      // Ajustar tamanho do canvas se necessário
      if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
      }

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = Math.min(canvasWidth, canvasHeight) / 2 - 10; // Margem de 10px

      // Limpar canvas com fundo escuro
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Criar máscara circular (clipping path)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Desenhar imagem com transformações
      const img = imageRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        const scaledWidth = img.naturalWidth * scale;
        const scaledHeight = img.naturalHeight * scale;

        const imgX = centerX - scaledWidth / 2 + position.x;
        const imgY = centerY - scaledHeight / 2 + position.y;

        ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);
      }

      ctx.restore();

      // Desenhar borda do círculo
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    };

    // Aguardar próximo frame para garantir que o container está renderizado
    // Usar múltiplos requestAnimationFrame para garantir que o modal está completamente renderizado
    let rafId = requestAnimationFrame(() => {
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(draw);
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [scale, position, imageUrl, file, imageSize]); // Usar file ao invés de open

  // Handlers de drag
  const handleMouseDown = (e) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left - centerX - position.x,
      y: e.clientY - rect.top - centerY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setPosition({
      x: e.clientX - rect.left - centerX - dragStart.x,
      y: e.clientY - rect.top - centerY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handlers de touch (mobile)
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1 || !containerRef.current) return;
    
    const touch = e.touches[0];
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - rect.left - centerX - position.x,
      y: touch.clientY - rect.top - centerY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1 || !containerRef.current) return;
    
    const touch = e.touches[0];
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setPosition({
      x: touch.clientX - rect.left - centerX - dragStart.x,
      y: touch.clientY - rect.top - centerY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Handlers de zoom
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, MAX_SCALE));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, MIN_SCALE));
  };

  // Confirmar crop
  const handleConfirm = async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current || isProcessing) return;

    try {
      setIsProcessing(true);

      const previewCanvas = canvasRef.current;
      const container = containerRef.current;
      
      // Obter dimensões do círculo no preview
      const canvasWidth = previewCanvas.width;
      const canvasHeight = previewCanvas.height;
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const radius = Math.min(canvasWidth, canvasHeight) / 2 - 10;
      const diameter = radius * 2;

      // Criar canvas para o resultado final (alta resolução)
      const outputSize = 512; // Tamanho final da foto de perfil
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = outputSize;
      outputCanvas.height = outputSize;

      const ctx = outputCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Contexto do canvas indisponível.');
      }

      // Criar círculo (clipping path)
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calcular transformações baseadas na imagem original
      const img = imageRef.current;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      // Escala da imagem no preview (em pixels do canvas)
      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;
      
      // Fator de escala do preview para o output (diameter do preview -> outputSize)
      const previewToOutputScale = outputSize / diameter;
      
      // Posição da imagem no preview (em pixels do canvas, relativo ao centro)
      const offsetX = position.x;
      const offsetY = position.y;
      
      // Converter offset para coordenadas do output
      const outputOffsetX = offsetX * previewToOutputScale;
      const outputOffsetY = offsetY * previewToOutputScale;
      
      // Calcular posição e tamanho no canvas de saída
      const outputImgX = (outputSize / 2) - (scaledWidth * previewToOutputScale) / 2 + outputOffsetX;
      const outputImgY = (outputSize / 2) - (scaledHeight * previewToOutputScale) / 2 + outputOffsetY;
      const outputImgWidth = scaledWidth * previewToOutputScale;
      const outputImgHeight = scaledHeight * previewToOutputScale;

      ctx.drawImage(
        img,
        0, 0, imgWidth, imgHeight, // Source rectangle (imagem completa)
        outputImgX, outputImgY, // Destination position
        outputImgWidth, // Destination width
        outputImgHeight // Destination height
      );

      // Converter para blob
      const blob = await new Promise((resolve, reject) => {
        outputCanvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Não foi possível gerar a imagem recortada.'));
          }
        }, 'image/jpeg', 0.92);
      });

      const croppedFile = new File([blob], `profile_${Date.now()}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      onConfirm(croppedFile);
    } catch (error) {
      console.error('[CircularProfileCrop] Falha ao aplicar recorte:', error);
      alert('Não foi possível aplicar o recorte. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Prevenir fechamento acidental quando o modal está abrindo
  useEffect(() => {
    if (internalOpen && file) {
      console.log('[CircularProfileCrop] Modal abrindo - ativando proteção contra fechamento');
      preventCloseRef.current = true;
      // Desabilitar prevenção após 2000ms (tempo suficiente para o modal estabilizar completamente)
      // Mas manter uma proteção permanente baseada em file: só permitir fechar se for ação explícita do usuário OU se não houver mais file
      const timer = setTimeout(() => {
        preventCloseRef.current = false;
        console.log('[CircularProfileCrop] Proteção inicial desativada (2000ms), mas fechamento ainda requer ação explícita do usuário enquanto temos file');
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!internalOpen && !file) {
      // Resetar quando fechar completamente
      console.log('[CircularProfileCrop] Modal fechado completamente - resetando flags');
      preventCloseRef.current = false;
      userRequestedCloseRef.current = false;
    }
  }, [internalOpen, file]);

  const handleOpenChange = (next) => {
    console.log('[CircularProfileCrop] onOpenChange chamado. next:', next, 'internalOpen:', internalOpen, 'isProcessing:', isProcessing, 'hasFile:', !!file, 'preventClose:', preventCloseRef.current, 'userRequested:', userRequestedCloseRef.current, 'open prop:', open);
    
    // Se está tentando abrir (next === true)
    if (next) {
      if (!file) {
        console.warn('[CircularProfileCrop] Tentando abrir modal sem arquivo - bloqueando');
        return;
      }
      // Permitir abertura se tiver arquivo
      console.log('[CircularProfileCrop] Permitindo abertura - temos arquivo');
      setInternalOpen(true);
      return;
    }
    
    // Se está tentando fechar (next === false)
    if (!next) {
      console.warn('[CircularProfileCrop] ⚠️ TENTATIVA DE FECHAR MODAL detectada!');
      console.warn('[CircularProfileCrop] Estado:', { isProcessing, preventClose: preventCloseRef.current, userRequested: userRequestedCloseRef.current, hasFile: !!file, open });
      
      // Se está processando, SEMPRE bloquear fechamento
      if (isProcessing) {
        console.warn('[CircularProfileCrop] 🚫 BLOQUEANDO fechamento - processando');
        setInternalOpen(true); // Forçar a manter aberto
        return;
      }
      
      // Se estamos prevenindo fechamento acidental (durante abertura), SEMPRE bloquear
      if (preventCloseRef.current) {
        console.warn('[CircularProfileCrop] 🚫 BLOQUEANDO fechamento - ainda em proteção');
        setInternalOpen(true); // Forçar a manter aberto
        return;
      }
      
      // PROTEÇÃO PRINCIPAL: Se temos arquivo, SEMPRE bloquear fechamento automático 
      // O modal só pode fechar se o usuário solicitar explicitamente OU se não houver mais arquivo
      if (file) {
        // Se usuário não solicitou, BLOQUEAR sempre
        if (!userRequestedCloseRef.current) {
          console.warn('[CircularProfileCrop] 🚫 BLOQUEANDO fechamento - temos arquivo e usuário NÃO solicitou fechamento');
          console.warn('[CircularProfileCrop] Estado atual:', {
            hasFile: !!file,
            userRequested: userRequestedCloseRef.current,
            isProcessing,
            preventClose: preventCloseRef.current,
            open,
            internalOpen
          });
          // Forçar a manter aberto - chamar setInternalOpen(true) em um setTimeout para garantir
          setTimeout(() => {
            if (file && !userRequestedCloseRef.current) {
              console.warn('[CircularProfileCrop] 🔒 FORÇANDO modal a permanecer aberto após tentativa de fechar');
              setInternalOpen(true);
            }
          }, 0);
          setInternalOpen(true); // Forçar imediatamente também
          return;
        }
      }
      
      // Se o fechamento foi solicitado pelo usuário explicitamente, permitir
      if (userRequestedCloseRef.current) {
        console.log('[CircularProfileCrop] ✅ Fechamento solicitado pelo usuário - permitindo');
        userRequestedCloseRef.current = false;
        setInternalOpen(false);
        onCancel();
        return;
      }
      
      // Se não há arquivo, pode ser fechamento legítimo
      if (!file) {
        console.log('[CircularProfileCrop] Fechando modal - sem arquivo');
        setInternalOpen(false);
        onCancel();
        return;
      }
      
      // Para qualquer outro caso, SEMPRE bloquear o fechamento automático
      console.warn('[CircularProfileCrop] 🚫 BLOQUEANDO fechamento automático não autorizado! Forçando a manter aberto.');
      setInternalOpen(true); // Forçar a manter aberto
      return;
    }
  };

  // Controlar estado interno: SEMPRE manter aberto se temos file (independente de open)
  useEffect(() => {
    console.log('[CircularProfileCrop] useEffect controle - open:', open, 'file:', !!file, 'internalOpen:', internalOpen, 'userRequested:', userRequestedCloseRef.current);

    // REGRA PRINCIPAL: Se temos file e usuário não solicitou fechar, SEMPRE manter aberto
    if (file && !userRequestedCloseRef.current) {
      if (!internalOpen) {
        console.log('[CircularProfileCrop] 🔒 FORÇANDO a abrir modal - temos file e usuário não solicitou fechar');
        setInternalOpen(true);
      } else {
        // Já está aberto - garantir que permaneça aberto (pode ter sido fechado por algum motivo)
        console.log('[CircularProfileCrop] ✅ Modal está aberto - garantindo que permaneça aberto');
        // Forçar novamente para garantir (pode ter sido fechado entre renders)
        if (!internalOpen) {
          setInternalOpen(true);
        }
      }
    }
    // Só fechar se não há file E usuário solicitou explicitamente OU open é false E não há file
    else if (!file || (!open && !file)) {
      if (userRequestedCloseRef.current || (!file && !open)) {
        if (internalOpen) {
          console.log('[CircularProfileCrop] Fechando modal - sem file e usuário solicitou ou open é false');
          setInternalOpen(false);
          userRequestedCloseRef.current = false;
        }
      }
    }
  }, [open, file, internalOpen]);
  
  // PROTEÇÃO FINAL: Monitor constante que força o modal a permanecer aberto quando necessário
  useEffect(() => {
    console.log('[CircularProfileCrop] internalOpen mudou:', internalOpen, 'open prop:', open, 'file:', !!file, 'isProcessing:', isProcessing);
    
    // Se temos file E o modal deveria estar aberto, SEMPRE garantir que está aberto
    if (file && !userRequestedCloseRef.current) {
      if (!internalOpen) {
        console.warn('[CircularProfileCrop] 🚨 PROTEÇÃO FINAL ATIVADA! internalOpen é false mas temos file - FORÇANDO a reabrir IMEDIATAMENTE');
        // Usar requestAnimationFrame para garantir que acontece no próximo frame de renderização
        requestAnimationFrame(() => {
          if (file && !userRequestedCloseRef.current) {
            console.warn('[CircularProfileCrop] 🔒 FORÇANDO modal a reabrir via requestAnimationFrame');
            setInternalOpen(true);
          }
        });
      } else {
        // Se já está aberto mas pode ser que esteja tentando fechar, manter aberto
        console.log('[CircularProfileCrop] ✅ Modal está aberto e protegido - mantendo');
      }
    }
  }, [internalOpen, file, userRequestedCloseRef.current]);
  
  // PROTEÇÃO CONTÍNUA: Verificar periodicamente se o modal deveria estar aberto
  useEffect(() => {
    if (!file || userRequestedCloseRef.current) return;
    
    // Verificar a cada 100ms se o modal está aberto quando deveria estar
    const intervalId = setInterval(() => {
      if (file && !userRequestedCloseRef.current && !internalOpen) {
        console.warn('[CircularProfileCrop] 🚨 PROTEÇÃO CONTÍNUA: Modal fechado indevidamente - FORÇANDO a reabrir');
        setInternalOpen(true);
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [file, internalOpen]);
  
  // REGRA DEFINITIVA: Se temos file e usuário não solicitou fechar, SEMPRE true
  // Caso contrário, usar internalOpen (que é controlado internamente)
  const forcedOpen = file && !userRequestedCloseRef.current ? true : internalOpen;
  
  // PROTEÇÃO ULTRA: Garantir que internalOpen seja true quando forcedOpen é true
  // Isso evita que o Radix Dialog feche o modal por algum motivo interno
  useEffect(() => {
    if (forcedOpen && !internalOpen) {
      console.warn('[CircularProfileCrop] 🚨 PROTEÇÃO ULTRA: forcedOpen é true mas internalOpen é false - FORÇANDO a sincronizar');
      setInternalOpen(true);
    }
  }, [forcedOpen, internalOpen]);
  
  console.log('[CircularProfileCrop] Render - forcedOpen:', forcedOpen, 'file:', !!file, 'internalOpen:', internalOpen, 'open:', open, 'userRequested:', userRequestedCloseRef.current);
  
  return (
    <Dialog.Root 
      open={forcedOpen} 
      onOpenChange={(next) => {
        console.log('[CircularProfileCrop] 🔔 onOpenChange chamado no Dialog.Root. next:', next, 'file:', !!file, 'userRequested:', userRequestedCloseRef.current, 'forcedOpen:', forcedOpen);
        
        // PROTEÇÃO ABSOLUTA: Se temos file e usuário não solicitou, SEMPRE bloquear fechamento
        if (!next && file && !userRequestedCloseRef.current) {
          console.warn('[CircularProfileCrop] 🚫 BLOQUEANDO COMPLETAMENTE onOpenChange - temos file e usuário não solicitou');
          console.warn('[CircularProfileCrop] Estado:', { file: !!file, userRequested: userRequestedCloseRef.current, forcedOpen, internalOpen, open });
          // NÃO FAZER NADA - forçar o modal a permanecer aberto
          // O forcedOpen vai forçar a reabertura no próximo render
          // Forçar internalOpen para true imediatamente
          setInternalOpen(true);
          return;
        }
        
        // Permitir fechamento apenas se usuário solicitou explicitamente ou não há file
        if (next === false && (userRequestedCloseRef.current || !file)) {
          console.log('[CircularProfileCrop] ✅ Permitindo fechamento - usuário solicitou ou sem file');
          handleOpenChange(false);
        } else if (next === true) {
          // Permitir abertura (sempre que tiver file ou for solicitado)
          console.log('[CircularProfileCrop] ✅ Permitindo abertura');
          handleOpenChange(true);
        } else {
          // Qualquer outro caso, bloquear
          console.warn('[CircularProfileCrop] 🚫 BLOQUEANDO - caso não esperado. next:', next);
          if (file && !userRequestedCloseRef.current) {
            setInternalOpen(true);
          }
        }
      }} 
      modal={true}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[10000]" />
        <Dialog.Content 
          className="fixed inset-0 flex flex-col items-center justify-center z-[10001] p-4"
          onEscapeKeyDown={(e) => {
            console.log('[CircularProfileCrop] ESC pressionado');
            if (isProcessing || preventCloseRef.current) {
              console.log('[CircularProfileCrop] Bloqueando ESC - processando ou protegido');
              e.preventDefault();
            } else {
              // Marcar que o usuário solicitou o fechamento
              console.log('[CircularProfileCrop] Permitindo fechamento via ESC');
              userRequestedCloseRef.current = true;
              handleOpenChange(false);
            }
          }}
          onPointerDownOutside={(e) => {
            console.log('[CircularProfileCrop] Clique fora do modal detectado');
            if (isProcessing || preventCloseRef.current) {
              console.log('[CircularProfileCrop] Bloqueando clique fora - processando ou protegido');
              e.preventDefault();
            } else {
              // Marcar que o usuário solicitou o fechamento
              console.log('[CircularProfileCrop] Permitindo fechamento via clique fora');
              userRequestedCloseRef.current = true;
              handleOpenChange(false);
            }
          }}
          onInteractOutside={(e) => {
            console.log('[CircularProfileCrop] Interação fora do modal detectada');
            if (isProcessing || preventCloseRef.current) {
              console.log('[CircularProfileCrop] Bloqueando interação fora - processando ou protegido');
              e.preventDefault();
            }
          }}
        >
          <div className="w-full max-w-md flex flex-col h-full max-h-[90vh]">
            {/* Título */}
            <div className="text-center mb-4">
              <Dialog.Title className="text-lg font-semibold text-white mb-1">
                Mover e redimensionar
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Ajuste a posição e o zoom da foto movendo e usando os controles de zoom abaixo
              </Dialog.Description>
            </div>

            {/* Área de preview */}
            <div 
              ref={containerRef}
              className="flex-1 relative flex items-center justify-center mb-4 min-h-[400px] w-full"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {imageError ? (
                <div className="text-center p-4">
                  <p className="text-red-400 mb-2">{imageError}</p>
                  <button
                    onClick={onCancel}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                  >
                    Fechar
                  </button>
                </div>
              ) : imageUrl && imageRef.current && imageSize ? (
                <canvas
                  ref={canvasRef}
                  className="w-full h-full max-w-[90vw] max-h-[60vh] aspect-square"
                  style={{ touchAction: 'none', display: 'block' }}
                />
              ) : (
                <div className="text-white">Carregando imagem...</div>
              )}
            </div>

            {/* Controles de zoom */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={handleZoomOut}
                disabled={scale <= MIN_SCALE || isProcessing}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
              
              <div className="text-white text-sm font-medium min-w-[60px] text-center">
                {Math.round(scale * 100)}%
              </div>
              
              <button
                onClick={handleZoomIn}
                disabled={scale >= MAX_SCALE || isProcessing}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
              </button>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  userRequestedCloseRef.current = true;
                  onCancel();
                }}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processando...' : 'Escolher'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default CircularProfileCropModal;
