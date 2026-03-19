/**
 * Configuração de Ambiente
 * Centraliza todas as variáveis de ambiente para a aplicação
 */

// Configurações da Calculadora de Calorias (Gemini + FatSecret)
// NOTA: Para produção, use variáveis de ambiente (.env)
export const NUTRITION_CONFIG = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyCQo3l0QWloF1dzZFxWXZJ4ksLvhYXg5HQ',
  fatSecretClientId: import.meta.env.VITE_FATSECRET_CLIENT_ID || '4cf5b8d0cc5648fb84fd0790a664d7f6',
  fatSecretClientSecret: import.meta.env.VITE_FATSECRET_CLIENT_SECRET || 'f0fea149c98e43f0bc39abecf45a9c8b'
};

// Configurações da GreenN
export const GREENN_CONFIG = {
  apiUrl: import.meta.env.VITE_GREENN_API_URL || 'https://api.greenn.com.br',
  apiKey: import.meta.env.VITE_GREENN_API_KEY || '$2y$10$KNN0QurB5dLPKltjvMmsMeBjrac1UqvgnBuFr/DDnKUyvGf8WDlr.',
  publicKey: import.meta.env.VITE_GREENN_PUBLIC_KEY || '$2y$10$7H47GgS31OPMhnsSr5pcRO87vJGDjrlGbkaf4E7/H39Cs5Jzo1/wa',
  webhookToken: import.meta.env.VITE_GREENN_WEBHOOK_TOKEN || '$2y$10$xNsLPwD/ajwry42D1a7ReeB7dzMbTIyR7DPvS8GENpzRVjOh9SO/2',
  environment: import.meta.env.VITE_GREENN_ENVIRONMENT || 'production'
};

// Configurações do Firebase
export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA0ZaV9EJl1z4hT0wd5EL-7RqG2slAE5Kg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "comunidade-team-hiit.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "comunidade-team-hiit",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "comunidade-team-hiit.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "106629704358",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:106629704358:web:7151af4773e2e4c3822267"
};

// Função para verificar se as configurações estão corretas
export const validateConfig = () => {
  const missingKeys = [];
  
  // Verificar chaves da GreenN
  if (!GREENN_CONFIG.apiKey || GREENN_CONFIG.apiKey.includes('$2y$10$KNN0QurB5dLPKltjvMmsMeBjrac1UqvgnBuFr/DDnKUyvGf')) {
    missingKeys.push('VITE_GREENN_API_KEY');
  }
  
  if (!GREENN_CONFIG.publicKey || GREENN_CONFIG.publicKey.includes('$2y$10$7H47GgS310PMhnsSr5pcRO87vJGDjrlGbkaf4E7/H39Cs5Jzc')) {
    missingKeys.push('VITE_GREENN_PUBLIC_KEY');
  }
  
  if (!GREENN_CONFIG.webhookToken || GREENN_CONFIG.webhookToken.includes('$2y$10$xNsLPwD/ajwry42D1a7ReeB7dzMbTlyR7DPvS8GENpzRVjO')) {
    missingKeys.push('VITE_GREENN_WEBHOOK_TOKEN');
  }
  
  if (missingKeys.length > 0) {
    console.warn('⚠️ [Config] Chaves não configuradas:', missingKeys);
    console.warn('⚠️ [Config] Crie um arquivo .env na raiz do projeto com as chaves da GreenN');
    return false;
  }
  
  return true;
};

export default {
  GREENN_CONFIG,
  FIREBASE_CONFIG,
  validateConfig
};
