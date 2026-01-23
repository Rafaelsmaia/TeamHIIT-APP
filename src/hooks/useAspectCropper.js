import { useCallback, useRef, useState } from 'react';
import { ASPECT_PRESETS, detectPreset, getClosestPreset, getImageDimensions } from '../utils/imageAspect.js';

export function useAspectCropper() {
  const [cropRequest, setCropRequest] = useState(null);
  const resolverRef = useRef(null);

  const requestCrop = useCallback((payload) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setCropRequest(payload);
    });
  }, []);

  const cancelCrop = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(null);
      resolverRef.current = null;
    }
    setCropRequest(null);
  }, []);

  const confirmCrop = useCallback((file) => {
    if (resolverRef.current) {
      resolverRef.current(file);
      resolverRef.current = null;
    }
    setCropRequest(null);
  }, []);

  const ensurePreset = useCallback(async (file) => {
    if (!file) return null;

    const dimensions = await getImageDimensions(file);
    if (!dimensions) {
      return file;
    }

    const match = detectPreset(dimensions.width, dimensions.height);
    if (match) {
      return file;
    }

    const closest = getClosestPreset(dimensions.width, dimensions.height);
    const croppedFile = await requestCrop({
      file,
      dimensions,
      defaultPresetId: closest?.id || ASPECT_PRESETS[0].id
    });

    return croppedFile;
  }, [requestCrop]);

  return {
    cropRequest,
    cancelCrop,
    confirmCrop,
    requestCrop,
    ensurePreset
  };
}

export { ASPECT_PRESETS } from '../utils/imageAspect.js';

