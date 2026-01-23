/**
 * Serviço de Integração com GreenN
 * Gerencia autenticação e validação de assinaturas
 */

import { getGreenNHeaders, getGreenNApiUrl, validateGreenNKeys } from '../config/greenn-keys';
import { GREENN_CONFIG } from '../config/environment';

class GreenNIntegration {
  constructor() {
    this.timeout = 10000; // 10 segundos
    
    // Validar se as chaves estão configuradas
    if (!validateGreenNKeys()) {
      console.warn('⚠️ [GreenN] Chaves não configuradas. Algumas funcionalidades podem não funcionar.');
    }
  }

  /**
   * Valida credenciais do usuário na GreenN
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Dados do usuário e assinatura
   */
  async validateCredentials(email, password) {
    try {
      const response = await fetch(getGreenNApiUrl('/auth/validate'), {
        method: 'POST',
        headers: getGreenNHeaders(),
        body: JSON.stringify({
          email: email,
          password: password
        }),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Erro na API GreenN: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user,
        subscription: data.subscription,
        accessToken: data.accessToken
      };
    } catch (error) {
      console.error('❌ [GreenN] Erro ao validar credenciais:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verifica se a assinatura está ativa
   * @param {string} userId - ID do usuário na GreenN
   * @param {string} accessToken - Token de acesso
   * @returns {Promise<Object>} - Status da assinatura
   */
  async checkSubscriptionStatus(userId, accessToken) {
    try {
      const response = await fetch(`${this.apiUrl}/subscriptions/${userId}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-API-Version': '1.0'
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar assinatura: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        isActive: data.isActive,
        plan: data.plan,
        expiresAt: data.expiresAt,
        features: data.features
      };
    } catch (error) {
      console.error('❌ [GreenN] Erro ao verificar assinatura:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Sincroniza dados do usuário entre GreenN e Team HIIT
   * @param {Object} userData - Dados do usuário
   * @param {Object} subscriptionData - Dados da assinatura
   * @returns {Promise<Object>} - Resultado da sincronização
   */
  async syncUserData(userData, subscriptionData) {
    try {
      const response = await fetch(`${this.apiUrl}/sync/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': '1.0'
        },
        body: JSON.stringify({
          user: userData,
          subscription: subscriptionData,
          platform: 'team-hiit'
        }),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Erro na sincronização: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        syncId: data.syncId,
        lastSync: data.lastSync
      };
    } catch (error) {
      console.error('❌ [GreenN] Erro na sincronização:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Registra evento de uso do Team HIIT
   * @param {string} userId - ID do usuário
   * @param {string} event - Tipo de evento
   * @param {Object} data - Dados do evento
   * @returns {Promise<Object>} - Resultado do registro
   */
  async trackUsage(userId, event, data) {
    try {
      const response = await fetch(`${this.apiUrl}/analytics/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': '1.0'
        },
        body: JSON.stringify({
          userId: userId,
          event: event,
          data: data,
          timestamp: new Date().toISOString(),
          platform: 'team-hiit'
        }),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`Erro ao registrar uso: ${response.status}`);
      }

      return {
        success: true,
        eventId: response.json().eventId
      };
    } catch (error) {
      console.error('❌ [GreenN] Erro ao registrar uso:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verifica se o usuário tem acesso a uma funcionalidade específica
   * @param {string} userId - ID do usuário
   * @param {string} feature - Funcionalidade a verificar
   * @returns {Promise<boolean>} - Se tem acesso ou não
   */
  async hasFeatureAccess(userId, feature) {
    try {
      const response = await fetch(`${this.apiUrl}/users/${userId}/features/${feature}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Version': '1.0'
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.hasAccess;
    } catch (error) {
      console.error('❌ [GreenN] Erro ao verificar acesso:', error);
      return false;
    }
  }
}

// Instância singleton
const greenNIntegration = new GreenNIntegration();

export default greenNIntegration;
