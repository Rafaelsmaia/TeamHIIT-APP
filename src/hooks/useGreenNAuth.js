/**
 * Hook para Autenticação Híbrida (Firebase + GreenN)
 * Gerencia login e validação de assinaturas
 */

import { useState, useEffect, useCallback } from 'react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import greenNIntegration from '../services/GreenNIntegration';

export function useGreenNAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [error, setError] = useState(null);
  
  const auth = getAuth();

  /**
   * Faz login híbrido (Firebase + GreenN)
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Resultado do login
   */
  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Validar credenciais na GreenN
      console.log('🔐 [GreenN] Validando credenciais...');
      const greenNValidation = await greenNIntegration.validateCredentials(email, password);
      
      if (!greenNValidation.success) {
        throw new Error('Credenciais inválidas na GreenN');
      }

      // 2. Verificar status da assinatura
      console.log('📋 [GreenN] Verificando assinatura...');
      const subscriptionCheck = await greenNIntegration.checkSubscriptionStatus(
        greenNValidation.user.id,
        greenNValidation.accessToken
      );

      if (!subscriptionCheck.success || !subscriptionCheck.isActive) {
        throw new Error('Assinatura não ativa ou expirada');
      }

      // 3. Fazer login no Firebase
      console.log('🔥 [Firebase] Fazendo login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 4. Atualizar dados do usuário no Firestore
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        greenNUserId: greenNValidation.user.id,
        subscriptionStatus: {
          isActive: subscriptionCheck.isActive,
          plan: subscriptionCheck.plan,
          expiresAt: subscriptionCheck.expiresAt,
          features: subscriptionCheck.features
        },
        lastGreenNSync: new Date().toISOString()
      });

      // 5. Definir estado local
      setCurrentUser(firebaseUser);
      setIsAuthenticated(true);
      setSubscriptionStatus(subscriptionCheck);

      // 6. Registrar evento de uso
      await greenNIntegration.trackUsage(
        greenNValidation.user.id,
        'login',
        { platform: 'team-hiit', timestamp: new Date().toISOString() }
      );

      console.log('✅ [GreenN] Login realizado com sucesso!');
      return {
        success: true,
        user: firebaseUser,
        subscription: subscriptionCheck
      };

    } catch (error) {
      console.error('❌ [GreenN] Erro no login:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [auth]);

  /**
   * Cria conta híbrida (Firebase + GreenN)
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @param {string} displayName - Nome do usuário
   * @returns {Promise<Object>} - Resultado da criação
   */
  const createAccount = useCallback(async (email, password, displayName) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Criar conta no Firebase
      console.log('🔥 [Firebase] Criando conta...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Salvar dados iniciais no Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: firebaseUser.email,
        name: displayName || firebaseUser.email,
        displayName: displayName || firebaseUser.email,
        createdAt: new Date().toISOString(),
        subscriptionStatus: {
          isActive: false,
          plan: 'free',
          expiresAt: null,
          features: []
        }
      });

      // 3. Sincronizar com GreenN (se necessário)
      // Aqui você pode implementar a lógica para criar conta na GreenN também

      setCurrentUser(firebaseUser);
      setIsAuthenticated(true);
      setSubscriptionStatus({
        isActive: false,
        plan: 'free',
        expiresAt: null,
        features: []
      });

      console.log('✅ [GreenN] Conta criada com sucesso!');
      return {
        success: true,
        user: firebaseUser
      };

    } catch (error) {
      console.error('❌ [GreenN] Erro ao criar conta:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setLoading(false);
    }
  }, [auth]);

  /**
   * Faz logout
   */
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIsAuthenticated(false);
      setSubscriptionStatus(null);
      setError(null);
      console.log('✅ [GreenN] Logout realizado com sucesso!');
    } catch (error) {
      console.error('❌ [GreenN] Erro no logout:', error);
      setError(error.message);
    }
  }, [auth]);

  /**
   * Verifica se o usuário tem acesso a uma funcionalidade
   * @param {string} feature - Funcionalidade a verificar
   * @returns {boolean} - Se tem acesso ou não
   */
  const hasFeatureAccess = useCallback((feature) => {
    if (!subscriptionStatus || !subscriptionStatus.isActive) {
      return false;
    }
    
    return subscriptionStatus.features.includes(feature);
  }, [subscriptionStatus]);

  /**
   * Verifica se a assinatura está ativa
   * @returns {boolean} - Se está ativa ou não
   */
  const isSubscriptionActive = useCallback(() => {
    return subscriptionStatus?.isActive || false;
  }, [subscriptionStatus]);

  /**
   * Atualiza status da assinatura
   */
  const refreshSubscriptionStatus = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setSubscriptionStatus(userData.subscriptionStatus);
      }
    } catch (error) {
      console.error('❌ [GreenN] Erro ao atualizar status da assinatura:', error);
    }
  }, [currentUser]);

  // Listener de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        
        // Carregar status da assinatura
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setSubscriptionStatus(userData.subscriptionStatus);
          }
        } catch (error) {
          console.error('❌ [GreenN] Erro ao carregar status da assinatura:', error);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setSubscriptionStatus(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  return {
    isAuthenticated,
    loading,
    currentUser,
    subscriptionStatus,
    error,
    login,
    createAccount,
    logout,
    hasFeatureAccess,
    isSubscriptionActive,
    refreshSubscriptionStatus
  };
}
