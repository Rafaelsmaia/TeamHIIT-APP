import { Capacitor } from '@capacitor/core';

const CAMERA_CAPTURE_UNAVAILABLE_MESSAGE = 'Não foi possível concluir a captura pela câmera. Você pode tentar novamente ou escolher uma imagem da galeria.';
const CAMERA_CAPTURE_FALLBACK_MESSAGE = `${CAMERA_CAPTURE_UNAVAILABLE_MESSAGE}\n\nDeseja escolher uma imagem da galeria agora?`;
const IOS_CAMERA_RETURN_THRESHOLD_MS = 2500;
const IOS_CAMERA_FEEDBACK_DELAY_MS = 400;
let activeCameraAttemptCleanup = null;

export const openFileInput = (input, source = 'arquivo') => {
  const isDisconnected = typeof input?.isConnected === 'boolean' ? !input.isConnected : false;

  if (!input || input.disabled || isDisconnected || typeof input.click !== 'function') {
    console.warn(`[fileInput] Input de ${source} indisponivel para abertura.`);
    return false;
  }

  try {
    input.click();
    return true;
  } catch (error) {
    console.error(`[fileInput] Falha ao abrir seletor de ${source}:`, error);
    return false;
  }
};

export const alertFileInputUnavailable = (source = 'arquivo') => {
  if (typeof window === 'undefined' || typeof window.alert !== 'function') {
    return;
  }

  if (source === 'camera') {
    window.alert('Não foi possível abrir a câmera agora. Tente novamente ou escolha uma imagem da galeria.');
    return;
  }

  window.alert('Não foi possível abrir o seletor de imagens agora. Tente novamente.');
};

const isNativeIOS = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';
};

const offerCameraGalleryFallback = (galleryInput) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!galleryInput) {
    window.alert(CAMERA_CAPTURE_UNAVAILABLE_MESSAGE);
    return;
  }

  const shouldOpenGallery = window.confirm(CAMERA_CAPTURE_FALLBACK_MESSAGE);
  if (shouldOpenGallery && !openFileInput(galleryInput, 'galeria')) {
    alertFileInputUnavailable();
  }
};

const clearActiveCameraAttempt = () => {
  if (typeof activeCameraAttemptCleanup !== 'function') {
    return;
  }

  const cleanup = activeCameraAttemptCleanup;
  activeCameraAttemptCleanup = null;
  cleanup();
};

const watchNativeIOSCameraReturn = (cameraInput, galleryInput) => {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !cameraInput || !isNativeIOS()) {
    return () => {};
  }

  const openedAt = Date.now();
  let leftApp = false;
  let settled = false;
  let feedbackTimerId = null;

  const clearFeedbackTimer = () => {
    if (feedbackTimerId !== null) {
      window.clearTimeout(feedbackTimerId);
      feedbackTimerId = null;
    }
  };

  const cleanup = () => {
    clearFeedbackTimer();
    window.removeEventListener('blur', handleBlur);
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('pagehide', handleBlur);
    window.removeEventListener('pageshow', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    cameraInput.removeEventListener('change', handleChange);
    cameraInput.removeEventListener('cancel', handleCancel);

    if (activeCameraAttemptCleanup === cleanup) {
      activeCameraAttemptCleanup = null;
    }
  };

  const settle = (onSettled) => {
    if (settled) {
      return;
    }

    settled = true;
    cleanup();
    onSettled?.();
  };

  const handleChange = () => {
    settle();
  };

  const handleCancel = () => {
    settle(() => offerCameraGalleryFallback(galleryInput));
  };

  const scheduleFeedback = () => {
    if (!leftApp || settled) {
      return;
    }

    clearFeedbackTimer();
    feedbackTimerId = window.setTimeout(() => {
      if (settled) {
        cleanup();
        return;
      }

      const elapsed = Date.now() - openedAt;
      const hasSelectedFile = (cameraInput.files?.length || 0) > 0;

      if (hasSelectedFile || elapsed > IOS_CAMERA_RETURN_THRESHOLD_MS) {
        settle();
        return;
      }

      settle(() => offerCameraGalleryFallback(galleryInput));
    }, IOS_CAMERA_FEEDBACK_DELAY_MS);
  };

  const handleBlur = () => {
    leftApp = true;
  };

  const handleFocus = () => {
    scheduleFeedback();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      leftApp = true;
      return;
    }

    if (document.visibilityState === 'visible') {
      scheduleFeedback();
    }
  };

  clearActiveCameraAttempt();

  cameraInput.addEventListener('change', handleChange);
  cameraInput.addEventListener('cancel', handleCancel);
  window.addEventListener('blur', handleBlur);
  window.addEventListener('focus', handleFocus);
  window.addEventListener('pagehide', handleBlur);
  window.addEventListener('pageshow', handleFocus);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  activeCameraAttemptCleanup = cleanup;

  return cleanup;
};

export const openCameraInput = (cameraInput, galleryInput) => {
  const cleanupWatch = watchNativeIOSCameraReturn(cameraInput, galleryInput);
  const opened = openFileInput(cameraInput, 'camera');

  if (!opened) {
    cleanupWatch();
    alertFileInputUnavailable('camera');
    return false;
  }

  return true;
};
