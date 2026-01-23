export const ASPECT_PRESETS = [
  {
    id: 'square',
    label: 'Quadrado',
    ratio: 1,
    description: '1:1'
  },
  {
    id: 'portrait',
    label: 'Retrato',
    ratio: 4 / 5,
    description: '4:5'
  },
  {
    id: 'landscape',
    label: 'Horizontal',
    ratio: 16 / 9,
    description: '16:9'
  }
];

export async function getImageDimensions(file) {
  if (!file) return null;

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (error) => reject(error);
      image.src = objectUrl;
    });

    return {
      width: img.naturalWidth,
      height: img.naturalHeight
    };
  } catch (error) {
    console.error('[ImageAspect] Falha ao obter dimensões da imagem:', error);
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function detectPreset(width, height, tolerance = 0.02) {
  if (!width || !height) return null;

  const ratio = width / height;
  return ASPECT_PRESETS.find((preset) => Math.abs(ratio - preset.ratio) <= tolerance) || null;
}

export function getClosestPreset(width, height) {
  if (!width || !height) return ASPECT_PRESETS[0];

  const ratio = width / height;
  let closest = ASPECT_PRESETS[0];
  let smallestDiff = Math.abs(ratio - closest.ratio);

  for (let i = 1; i < ASPECT_PRESETS.length; i++) {
    const diff = Math.abs(ratio - ASPECT_PRESETS[i].ratio);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = ASPECT_PRESETS[i];
    }
  }

  return closest;
}

export function generateCroppedFileName(originalName, presetId, extension = 'jpg') {
  if (!originalName) return `imagem_${presetId}.${extension}`;

  const dotIndex = originalName.lastIndexOf('.');
  const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;

  return `${baseName}_${presetId}.${extension}`;
}

