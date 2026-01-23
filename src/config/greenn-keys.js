/**
 * Configuração das Chaves da GreenN
 * Centraliza todas as chaves de acesso para a integração
 */

// Chaves de acesso da GreenN (obtenha na área de configurações)
export const GREENN_KEYS = {
  // URL da API
  apiUrl: import.meta.env.VITE_GREENN_API_URL || 'https://api.greenn.com.br',
  
  // Chaves de autenticação
  apiKey: import.meta.env.VITE_GREENN_API_KEY || '$2y$10$KNN0QurB5dLPKltjvMmsMeBjrac1UqvgnBuFr/DDnKUyvGf8WDlr.',
  publicKey: import.meta.env.VITE_GREENN_PUBLIC_KEY || '$2y$10$7H47GgS31OPMhnsSr5pcRO87vJGDjrlGbkaf4E7/H39Cs5Jzo1/wa',
  webhookToken: import.meta.env.VITE_GREENN_WEBHOOK_TOKEN || '$2y$10$xNsLPwD/ajwry42D1a7ReeB7dzMbTIyR7DPvS8GENpzRVjOh9SO/2',
  
  // Ambiente
  environment: import.meta.env.VITE_GREENN_ENVIRONMENT || 'production'
};

// Função para verificar se as chaves estão configuradas
export const validateGreenNKeys = () => {
  const requiredKeys = ['apiKey', 'publicKey', 'webhookToken'];
  const missingKeys = requiredKeys.filter(key => !GREENN_KEYS[key]);
  
  if (missingKeys.length > 0) {
    console.warn('⚠️ [GreenN] Chaves não configuradas:', missingKeys);
    return false;
  }
  
  return true;
};

// Função para obter headers de autenticação
export const getGreenNHeaders = (additionalHeaders = {}) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${GREENN_KEYS.apiKey}`,
    'X-Public-Key': GREENN_KEYS.publicKey,
    'X-API-Version': '1.0',
    'X-Environment': GREENN_KEYS.environment,
    ...additionalHeaders
  };
};

// Função para obter URL da API
export const getGreenNApiUrl = (endpoint = '') => {
  const baseUrl = GREENN_KEYS.apiUrl.endsWith('/') 
    ? GREENN_KEYS.apiUrl.slice(0, -1) 
    : GREENN_KEYS.apiUrl;
  
  const cleanEndpoint = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;
  
  return `${baseUrl}${cleanEndpoint}`;
};

export default GREENN_KEYS;
