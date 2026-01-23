/**
 * Configurações da GreenN
 * Centraliza todas as configurações relacionadas à integração com a GreenN
 */

// Configurações da API GreenN
export const GREENN_CONFIG = {
  // URLs da API (dev/prod)
  apiUrl: {
    development: 'https://api-dev.greenn.com.br',
    production: 'https://api.greenn.com.br',
    staging: 'https://api-staging.greenn.com.br'
  },
  
  // Versão da API
  apiVersion: '1.0',
  
  // Timeout das requisições
  timeout: 10000,
  
  // Funcionalidades disponíveis por plano
  features: {
    free: [
      'basic_workouts',
      'progress_tracking'
    ],
    basic: [
      'basic_workouts',
      'progress_tracking',
      'nutrition_tracking',
      'community_access'
    ],
    premium: [
      'basic_workouts',
      'progress_tracking',
      'nutrition_tracking',
      'community_access',
      'personalized_workouts',
      'nutritionist_access',
      'advanced_analytics'
    ],
    vip: [
      'basic_workouts',
      'progress_tracking',
      'nutrition_tracking',
      'community_access',
      'personalized_workouts',
      'nutritionist_access',
      'advanced_analytics',
      'one_on_one_coaching',
      'priority_support'
    ]
  },
  
  // Planos disponíveis
  plans: {
    free: {
      name: 'Gratuito',
      price: 0,
      duration: 'permanent',
      features: ['basic_workouts', 'progress_tracking']
    },
    basic: {
      name: 'Básico',
      price: 29.90,
      duration: 'monthly',
      features: ['basic_workouts', 'progress_tracking', 'nutrition_tracking', 'community_access']
    },
    premium: {
      name: 'Premium',
      price: 59.90,
      duration: 'monthly',
      features: ['basic_workouts', 'progress_tracking', 'nutrition_tracking', 'community_access', 'personalized_workouts', 'nutritionist_access', 'advanced_analytics']
    },
    vip: {
      name: 'VIP',
      price: 99.90,
      duration: 'monthly',
      features: ['basic_workouts', 'progress_tracking', 'nutrition_tracking', 'community_access', 'personalized_workouts', 'nutritionist_access', 'advanced_analytics', 'one_on_one_coaching', 'priority_support']
    }
  }
};

// Função para obter a URL da API baseada no ambiente
export const getGreenNApiUrl = () => {
  const env = import.meta.env.MODE || 'development';
  return GREENN_CONFIG.apiUrl[env] || GREENN_CONFIG.apiUrl.development;
};

// Função para obter as funcionalidades de um plano
export const getPlanFeatures = (plan) => {
  return GREENN_CONFIG.features[plan] || GREENN_CONFIG.features.free;
};

// Função para verificar se um plano tem acesso a uma funcionalidade
export const hasFeatureAccess = (plan, feature) => {
  const features = getPlanFeatures(plan);
  return features.includes(feature);
};

// Função para obter informações de um plano
export const getPlanInfo = (plan) => {
  return GREENN_CONFIG.plans[plan] || GREENN_CONFIG.plans.free;
};

// Função para obter o plano atual do usuário
export const getCurrentPlan = (subscriptionStatus) => {
  if (!subscriptionStatus || !subscriptionStatus.isActive) {
    return 'free';
  }
  return subscriptionStatus.plan || 'free';
};

// Função para verificar se o usuário tem acesso a uma funcionalidade
export const checkFeatureAccess = (subscriptionStatus, feature) => {
  const currentPlan = getCurrentPlan(subscriptionStatus);
  return hasFeatureAccess(currentPlan, feature);
};

// Função para obter a data de expiração da assinatura
export const getSubscriptionExpiry = (subscriptionStatus) => {
  if (!subscriptionStatus || !subscriptionStatus.isActive) {
    return null;
  }
  return subscriptionStatus.expiresAt;
};

// Função para verificar se a assinatura está próxima do vencimento
export const isSubscriptionExpiring = (subscriptionStatus, daysBefore = 7) => {
  const expiry = getSubscriptionExpiry(subscriptionStatus);
  if (!expiry) return false;
  
  const expiryDate = new Date(expiry);
  const now = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  return daysUntilExpiry <= daysBefore && daysUntilExpiry > 0;
};

// Função para obter o status da assinatura em texto
export const getSubscriptionStatusText = (subscriptionStatus) => {
  if (!subscriptionStatus) {
    return 'Não verificado';
  }
  
  if (!subscriptionStatus.isActive) {
    return 'Inativa';
  }
  
  const expiry = getSubscriptionExpiry(subscriptionStatus);
  if (!expiry) {
    return 'Ativa (sem expiração)';
  }
  
  const expiryDate = new Date(expiry);
  const now = new Date();
  
  if (expiryDate < now) {
    return 'Expirada';
  }
  
  const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 7) {
    return `Expira em ${daysUntilExpiry} dias`;
  }
  
  return 'Ativa';
};

export default GREENN_CONFIG;
