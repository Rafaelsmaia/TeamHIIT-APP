import { useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ASPECT_PRESETS, generateCroppedFileName } from '../../utils/imageAspect.js';

const SLIDER_STEPS = 1000;

const ImageCropperModal = ({
  open,
  file,
  request,
  onCancel,
  onConfirm
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(ASPECT_PRESETS[0].id);
  const [sliderValue, setSliderValue] = useState(SLIDER_STEPS / 2);
  const [isProcessing, setIsProcessing] = useState(false);
  const imageRef = useRef(null);
  const previewCanvasRef = useRef(null);

  useEffect(() => {
    if (request?.defaultPresetId) {
      setSelectedPresetId(request.defaultPresetId);
    } else {
      setSelectedPresetId(ASPECT_PRESETS[0].id);
    }
    setSliderValue(SLIDER_STEPS / 2);
  }, [request]);

  useEffect(() => {
    if (!file || !open) {
      setImageUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setImageUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, open]);

  useEffect(() => {
    if (!imageUrl) return;

    const image = new Image();
    image.onload = () => {
      imageRef.current = image;
      setImageSize({
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };
    image.onerror = () => {
      console.error('[ImageCropper] Não foi possível carregar a imagem para edição.');
      onCancel();
    };
    image.src = imageUrl;

    return () => {
      imageRef.current = null;
    };
  }, [imageUrl, onCancel]);

  const selectedPreset = useMemo(() => {
    return ASPECT_PRESETS.find((preset) => preset.id === selectedPresetId) || ASPECT_PRESETS[0];
  }, [selectedPresetId]);

  const cropInfo = useMemo(() => {
    if (!imageSize || !selectedPreset) {
      return null;
    }

    const ratio = selectedPreset.ratio;
    const { width, height } = imageSize;
    const imageRatio = width / height;
    let cropWidth = width;
    let cropHeight = height;
    let offsetX = 0;
    let offsetY = 0;
    let sliderOrientation = 'none';

    if (Math.abs(imageRatio - ratio) < 0.0001) {
      // Mesma proporção, sem necessidade de ajuste
      return {
        ratio,
        cropWidth,
        cropHeight,
        offsetX,
        offsetY,
        sliderOrientation,
        sliderDisabled: true
      };
    }

    if (imageRatio > ratio) {
      // Imagem mais larga que o necessário
      cropHeight = height;
      cropWidth = height * ratio;
      const maxOffset = width - cropWidth;
      sliderOrientation = 'horizontal';
      offsetX = maxOffset * (sliderValue / SLIDER_STEPS);
      offsetY = 0;

      return {
        ratio,
        cropWidth,
        cropHeight,
        offsetX,
        offsetY,
        sliderOrientation,
        sliderDisabled: maxOffset <= 1,
        maxOffset
      };
    }

    // Imagem mais alta do que o necessário
    cropWidth = width;
    cropHeight = width / ratio;
    const maxOffset = height - cropHeight;
    sliderOrientation = 'vertical';
    offsetY = maxOffset * (sliderValue / SLIDER_STEPS);
    offsetX = 0;

    return {
      ratio,
      cropWidth,
      cropHeight,
      offsetX,
      offsetY,
      sliderOrientation,
      sliderDisabled: maxOffset <= 1,
      maxOffset
    };
  }, [imageSize, selectedPreset, sliderValue]);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !imageRef.current || !cropInfo) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const previewWidth = 420;
    const previewHeight = Math.round(previewWidth / cropInfo.ratio);

    canvas.width = previewWidth;
    canvas.height = previewHeight;

    context.clearRect(0, 0, previewWidth, previewHeight);
    context.drawImage(
      imageRef.current,
      cropInfo.offsetX,
      cropInfo.offsetY,
      cropInfo.cropWidth,
      cropInfo.cropHeight,
      0,
      0,
      previewWidth,
      previewHeight
    );
  }, [cropInfo, sliderValue, selectedPreset]);

  const handleConfirm = async () => {
    if (!imageRef.current || !cropInfo || isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);

      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = cropInfo.cropWidth;
      outputCanvas.height = cropInfo.cropHeight;

      const ctx = outputCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Contexto do canvas indisponível.');
      }

      ctx.drawImage(
        imageRef.current,
        cropInfo.offsetX,
        cropInfo.offsetY,
        cropInfo.cropWidth,
        cropInfo.cropHeight,
        0,
        0,
        cropInfo.cropWidth,
        cropInfo.cropHeight
      );

      const outputType = file?.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const encoderQuality = outputType === 'image/jpeg' ? 0.92 : undefined;
      const blob = await new Promise((resolve, reject) => {
        outputCanvas.toBlob((result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Não foi possível gerar a imagem recortada.'));
          }
        }, outputType, encoderQuality);
      });

      const extension = outputType === 'image/png' ? 'png' : 'jpg';
      const croppedFile = new File([blob], generateCroppedFileName(file?.name, selectedPreset.id, extension), {
        type: outputType,
        lastModified: Date.now()
      });

      onConfirm(croppedFile);
    } catch (error) {
      console.error('[ImageCropper] Falha ao aplicar recorte:', error);
      alert('Não foi possível aplicar o recorte. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const sliderLabel = useMemo(() => {
    if (!cropInfo || cropInfo.sliderDisabled) {
      return 'Posição fixa';
    }
    if (cropInfo.sliderOrientation === 'horizontal') {
      return 'Posição horizontal';
    }
    return 'Posição vertical';
  }, [cropInfo]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000]" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center z-[10001] p-4">
          <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ajustar proporção da imagem
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400">
                  Escolha entre os formatos quadrado, retrato ou horizontal e ajuste o enquadramento.
                </Dialog.Description>
              </div>
              <button
                onClick={onCancel}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancelar
              </button>
            </div>

            <div className="grid md:grid-cols-[260px_1fr] gap-6 p-6">
              <div className="space-y-5">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Formato</h4>
                  <div className="flex flex-col gap-2">
                    {ASPECT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setSelectedPresetId(preset.id)}
                        className={`w-full px-4 py-2 rounded-lg border text-left transition-colors ${
                          selectedPresetId === preset.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{preset.label}</span>
                          <span className="text-xs uppercase tracking-wide">{preset.description}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{sliderLabel}</h4>
                  <input
                    type="range"
                    min={0}
                    max={SLIDER_STEPS}
                    value={sliderValue}
                    onChange={(event) => setSliderValue(Number(event.target.value))}
                    disabled={!cropInfo || cropInfo.sliderDisabled}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {cropInfo?.sliderDisabled ? 'A imagem já está na proporção selecionada.' : 'Deslize para ajustar o enquadramento.'}
                  </p>
                </div>

                {imageSize && (
                  <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-3 text-xs text-gray-500 dark:text-gray-400">
                    <p>Dimensões originais: {imageSize.width} × {imageSize.height}px</p>
                    <p>Formato escolhido: {selectedPreset?.description}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 flex items-center justify-center min-h-[360px]">
                {imageUrl ? (
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full max-h-[520px] rounded-xl shadow-inner bg-black"
                  />
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Carregando imagem…</div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50/60 dark:bg-gray-900/60">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={isProcessing}
              >
                Descartar imagem
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isProcessing || !imageRef.current}
              >
                {isProcessing ? 'Processando...' : 'Aplicar recorte'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ImageCropperModal;

