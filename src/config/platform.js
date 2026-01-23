import { Capacitor } from '@capacitor/core';

/**
 * Configuração centralizada de plataforma
 * Centraliza toda a lógica de detecção de plataforma em um só lugar
 */
export const PlatformConfig = {
  // Detecção básica
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform(),
  
  // Detecções específicas
  isAndroid: Capacitor.getPlatform() === 'android',
  isIOS: Capacitor.getPlatform() === 'ios',
  isWeb: Capacitor.getPlatform() === 'web',
  
  // Detecção PWA (apenas para web)
  isPWA: (() => {
    if (Capacitor.isNativePlatform()) return false; // App nativo não é PWA
    
    // Métodos de detecção PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = window.navigator.standalone === true;
    const isAddedToHomeScreen = document.referrer.includes('android-app://');
    
    return isStandalone || isIOSStandalone || isAddedToHomeScreen;
  })(),
  
  // Configurações específicas por plataforma
  config: {
    // Android nativo
    android: {
      timeout: 5000, // Reduzido de 15s para 5s
      enableDebugOverlay: true,
      skipServiceWorker: true,
      onboardingKey: 'onboarding_shown'
    },
    
    // iOS nativo  
    ios: {
      timeout: 15000,
      enableDebugOverlay: true,
      skipServiceWorker: true,
      onboardingKey: 'onboarding_shown'
    },
    
    // PWA (qualquer plataforma)
    pwa: {
      timeout: 5000, // Reduzido de 10s para 5s
      enableDebugOverlay: false,
      skipServiceWorker: false,
      onboardingKey: 'onboarding_shown'
    },
    
    // Web navegador
    web: {
      timeout: 8000,
      enableDebugOverlay: false,
      skipServiceWorker: true,
      onboardingKey: 'onboarding_shown'
    }
  }
};

// Função helper para obter configuração da plataforma atual
export const getCurrentPlatformConfig = () => {
  if (PlatformConfig.isAndroid) return PlatformConfig.config.android;
  if (PlatformConfig.isIOS) return PlatformConfig.config.ios;
  if (PlatformConfig.isPWA) return PlatformConfig.config.pwa;
  return PlatformConfig.config.web;
};

// Função helper para logs específicos por plataforma
export const logPlatform = (message, level = 'info') => {
  const prefix = `[${PlatformConfig.platform.toUpperCase()}]`;
  const timestamp = new Date().toLocaleTimeString();
  
  switch (level) {
    case 'error':
      console.error(`${prefix} ${timestamp} ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} ${timestamp} ${message}`);
      break;
    case 'debug':
      console.log(`${prefix} ${timestamp} ${message}`);
      break;
    default:
      console.log(`${prefix} ${timestamp} ${message}`);
  }
};

// Exportar configuração atual para fácil acesso
export default PlatformConfig;
