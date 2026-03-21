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
