export const encodeImageUrl = (url) => {
  if (!url) return '';

  let normalized = url.startsWith('/') ? url : `/${url}`;
  normalized = normalized.replace(/^\/CAPAS TEAM HIIT/, '/IMAGES/CAPAS TEAM HIIT');
  normalized = normalized.replace(/^\/CAPAS HORIZONTAIS/, '/IMAGES/CAPAS HORIZONTAIS');
  normalized = normalized.replace(/^\/LOGOS/, '/IMAGES/LOGOS');
  normalized = normalized.replace(/^\/IMAGES\/IMAGES\//, '/IMAGES/');

  return encodeURI(normalized);
};

export const getModuleImage = (trainingId, sections, fallback = '/IMAGES/CAPAS TEAM HIIT/capa TH.png') => {
  if (!trainingId) return fallback;

  if (Array.isArray(sections)) {
    for (const section of sections) {
      const training = section.trainings?.find((t) => t.id === trainingId);
      if (training?.imageUrl) {
        return training.imageUrl;
      }
    }
  }

  return fallback;
};

const DEFAULT_HORIZONTAL_IMAGE = '/IMAGES/CAPAS HORIZONTAIS/PROJETO-VERAO-HORIZONTAL.png';
const HORIZONTAL_IMAGE_MAP = {
  'comece-aqui': DEFAULT_HORIZONTAL_IMAGE,
  'projeto-verao': DEFAULT_HORIZONTAL_IMAGE,
  'desafio-4-semanas': DEFAULT_HORIZONTAL_IMAGE,
  'in-shape': DEFAULT_HORIZONTAL_IMAGE,
  'pernas-gluteos': DEFAULT_HORIZONTAL_IMAGE,
  abs: DEFAULT_HORIZONTAL_IMAGE,
  superiores: DEFAULT_HORIZONTAL_IMAGE,
  'com-halteres': DEFAULT_HORIZONTAL_IMAGE,
  'sem-impacto': DEFAULT_HORIZONTAL_IMAGE,
  iniciantes: DEFAULT_HORIZONTAL_IMAGE,
  'todo-em-pe': DEFAULT_HORIZONTAL_IMAGE,
  'aquece-alongar': DEFAULT_HORIZONTAL_IMAGE,
  'treinos-combinados': DEFAULT_HORIZONTAL_IMAGE,
  'voce-atleta': DEFAULT_HORIZONTAL_IMAGE,
  'desafio-super-intenso': DEFAULT_HORIZONTAL_IMAGE,
  'desafio-com-halteres': DEFAULT_HORIZONTAL_IMAGE,
  'projeto-60d': DEFAULT_HORIZONTAL_IMAGE,
};

export const getModuleHorizontalImage = (trainingId, mapOverride) => {
  if (!trainingId) return DEFAULT_HORIZONTAL_IMAGE;
  const map = mapOverride || HORIZONTAL_IMAGE_MAP;
  return map[trainingId] || DEFAULT_HORIZONTAL_IMAGE;
};

export const getYouTubeVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url?.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
};
