import { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import NotificationService from '../services/NotificationService.js';
import { PlatformConfig, getCurrentPlatformConfig, logPlatform } from '../config/platform.js';

export function usePWAAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [hasCalorieCalculator, setHasCalorieCalculator] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState({
    push: true,
    email: true,
    habitReminders: true
  });
  const hasInitializedListenerRef = useRef(false);
  const auth = getAuth();
  const db = getFirestore();

  const loadUserProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setCurrentUser(null);
      setIsSubscriber(false);
      setHasCalorieCalculator(false);
      return null;
    }

    // SEMPRE garantir que estamos usando o firebaseUser mais recente
    // Criar enhancedUser copiando diretamente do firebaseUser para ter a photoURL mais atualizada
    let enhancedUser = {
      ...firebaseUser,
      // Forçar usar photoURL do firebaseUser (objeto original do Firebase Auth)
      photoURL: firebaseUser.photoURL || null
    };

    try {
      // Adicionar timeout de 3 segundos para a chamada do Firestore (REDUZIDO)
      const firestorePromise = getDoc(doc(db, 'users', firebaseUser.uid));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao buscar documento do usuário')), 3000)
      );
      
      const userDoc = await Promise.race([firestorePromise, timeoutPromise]);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userIsSubscriber = userData.isSubscriber || false;
        setIsSubscriber(userIsSubscriber);
        
        // Verificar acesso à calculadora de calorias:
        // - Se hasCalorieCalculator está definido, usar esse valor
        // - Se NÃO está definido E é assinante, dar acesso (usuários existentes)
        // - Senão, bloquear
        const hasCalcAccess = userData.hasCalorieCalculator !== undefined 
          ? userData.hasCalorieCalculator 
          : userIsSubscriber; // Usuários existentes (assinantes) ganham acesso
        setHasCalorieCalculator(hasCalcAccess);

        enhancedUser = {
          ...enhancedUser,
          displayName: enhancedUser.displayName || userData.displayName || firebaseUser.email,
          // SEMPRE priorizar photoURL do firebaseUser (Firebase Auth atualizado) sobre tudo
          // Não usar enhancedUser.photoURL porque pode ter a foto antiga
          photoURL: firebaseUser.photoURL || userData.photoURL || null,
          phone: userData.phone || enhancedUser.phone || ''
        };
      } else {
        setIsSubscriber(false);
        setHasCalorieCalculator(false);
        // Mesmo sem documento no Firestore, garantir que photoURL vem do firebaseUser
        enhancedUser = {
          ...enhancedUser,
          photoURL: firebaseUser.photoURL || null
        };
      }
    } catch (error) {
      logPlatform(`Erro ao carregar perfil do usuário: ${error.message}`, 'error');
      setIsSubscriber(false);
      setHasCalorieCalculator(false);
      // Continuar com dados básicos mesmo se houver erro
      // Garantir que photoURL vem do firebaseUser mesmo em caso de erro
      enhancedUser = {
        ...enhancedUser,
        photoURL: firebaseUser.photoURL || null
      };
    }

    // SEMPRE garantir que a photoURL final vem do firebaseUser (Firebase Auth)
    const finalPhotoURL = firebaseUser.photoURL || enhancedUser.photoURL || null;
    enhancedUser = {
      ...enhancedUser,
      photoURL: finalPhotoURL
    };

    logPlatform('✅ loadUserProfile concluído. photoURL do firebaseUser:', firebaseUser.photoURL, 'debug');
    logPlatform('✅ loadUserProfile concluído. photoURL final:', finalPhotoURL, 'debug');
    setCurrentUser(enhancedUser);
    return enhancedUser;
  }, [db]);
  
  // Usar configuração centralizada
  const platformConfig = getCurrentPlatformConfig();

  useEffect(() => {
    if (hasInitializedListenerRef.current) {
      logPlatform('Listener de autenticação já ativo, ignorando nova inicialização.', 'debug');
      return () => {};
    }
    hasInitializedListenerRef.current = true;
    logPlatform('Iniciando verificação de autenticação...', 'debug');
    
    // Timeout baseado na configuração da plataforma (REDUZIDO para 8 segundos)
    const loadingTimeout = setTimeout(() => {
      logPlatform('⚠️ TIMEOUT DE AUTENTICAÇÃO (8s) - Forçando carregamento do app', 'warn');
      setLoading(false);
      
      // Tentar usar dados do localStorage como fallback
      const cachedAuth = localStorage.getItem('authenticated');
      const cachedUid = localStorage.getItem('user_uid');
      const cachedEmail = localStorage.getItem('user_email');
      
      if (cachedAuth === 'true' && cachedUid) {
        logPlatform('✅ Usando autenticação em cache do localStorage', 'warn');
        setIsAuthenticated(true);
        setCurrentUser({
          uid: cachedUid,
          email: cachedEmail || '',
          displayName: cachedEmail || 'Usuário'
        });
        setIsSubscriber(true); // Assumir que é assinante se estava autenticado
        setHasCalorieCalculator(true);
      } else {
        logPlatform('❌ Nenhum cache encontrado - forçando estado não autenticado', 'warn');
      setIsAuthenticated(false);
      setCurrentUser(null);
      
      // Limpar localStorage para garantir
      try {
        localStorage.removeItem('authenticated');
        localStorage.removeItem('user_email');
        localStorage.removeItem('user_uid');
        logPlatform('LocalStorage limpo por timeout', 'debug');
      } catch (storageError) {
        logPlatform(`Erro ao limpar localStorage: ${storageError.message}`, 'error');
      }
      }
    }, 8000); // REDUZIDO de platformConfig.timeout (5000) para 8000ms

    // Verificar autenticação Firebase sempre
    logPlatform('Configurando listener de autenticação...', 'debug');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        logPlatform(`Callback de autenticação: ${user ? 'Usuário encontrado' : 'Nenhum usuário'}`, 'debug');
        
        if (user) {
          // Usuário autenticado no Firebase
          logPlatform(`Usuário autenticado: ${user.uid}`, 'debug');
          setIsAuthenticated(true);

          try {
            localStorage.setItem('authenticated', 'true');
            localStorage.setItem('user_uid', user.uid);
            localStorage.setItem('user_email', user.email || '');
            logPlatform('Snapshot de autenticação salvo antes de carregar o perfil', 'debug');
          } catch (storageError) {
            logPlatform(`Erro ao salvar snapshot de autenticação: ${storageError.message}`, 'error');
          }

          // Carregar perfil do usuário com TIMEOUT de segurança (REDUZIDO para 2s)
          try {
            const profilePromise = loadUserProfile(user);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout ao carregar perfil')), 2000)
            );
            
            const enhancedUser = await Promise.race([profilePromise, timeoutPromise]);
          const userId = enhancedUser?.uid || user.uid;

            // Carregar preferências de notificação EM BACKGROUND (não bloqueia o loading)
            NotificationService.getUserPreferences(userId)
              .then(preferences => {
            const normalizedPrefs = NotificationService.normalizePreferences(preferences);
            setNotificationPreferences(normalizedPrefs);
            localStorage.setItem('notificationSettings', JSON.stringify(normalizedPrefs));
            logPlatform('Preferências de notificação carregadas do Firestore', 'debug');
              })
              .catch(prefsError => {
            logPlatform(`Erro ao carregar preferências de notificação: ${prefsError.message}`, 'error');
              });
          } catch (profileError) {
            logPlatform(`⚠️ Erro/timeout ao carregar perfil: ${profileError.message} - Prosseguindo com dados básicos`, 'warn');
            // Continuar mesmo se o perfil falhar - usar apenas dados do Firebase Auth
            setCurrentUser({ ...user });
            setIsSubscriber(false);
            setHasCalorieCalculator(false);
          }
        } else {
          // Usuário não autenticado
          logPlatform('Nenhum usuário autenticado', 'debug');
          setCurrentUser(null);
          setIsAuthenticated(false);
          setIsSubscriber(false);
          setHasCalorieCalculator(false);
          setNotificationPreferences({
            push: true,
            email: true,
            habitReminders: true
          });
          
          // Limpar localStorage
          try {
            localStorage.removeItem('authenticated');
            localStorage.removeItem('user_uid');
            localStorage.removeItem('user_email');
            localStorage.removeItem('pwa_authenticated');
            logPlatform('Status de autenticação limpo', 'debug');
          } catch (storageError) {
            logPlatform(`Erro ao limpar status: ${storageError.message}`, 'error');
          }
        }
        
        // Limpar timeout APENAS após tudo estar pronto
        clearTimeout(loadingTimeout);
        
        logPlatform('Definindo loading como false', 'debug');
        setLoading(false);
      } catch (error) {
        logPlatform(`Erro no callback de autenticação: ${error.message}`, 'error');
        
        // Limpar timeout em caso de erro também
        clearTimeout(loadingTimeout);
        
        // Em caso de erro, definir estado seguro
        setLoading(false);
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    }, (error) => {
      // Callback de erro do onAuthStateChanged
      logPlatform(`Erro no onAuthStateChanged: ${error.message}`, 'error');
      
      clearTimeout(loadingTimeout);
      setLoading(false);
      setIsAuthenticated(false);
      setCurrentUser(null);
    });

    // Cleanup subscription e timeout
    return () => {
      hasInitializedListenerRef.current = false;
      clearTimeout(loadingTimeout);
      unsubscribe();
    };
  }, [auth, loadUserProfile, platformConfig.timeout]);

  const login = (success = true) => {
    if (success) {
      // O estado será atualizado automaticamente pelo onAuthStateChanged
      logPlatform('Login confirmado', 'debug');
    }
  };

  const logout = async () => {
    try {
      // Fazer logout do Firebase
      await signOut(auth);
      
      // Limpar localStorage
      localStorage.removeItem('authenticated');
      localStorage.removeItem('user_email');
      localStorage.removeItem('user_uid');
      localStorage.removeItem('pwa_authenticated');
      
      // Estados serão atualizados automaticamente pelo onAuthStateChanged
      logPlatform('Logout realizado', 'debug');
    } catch (error) {
      logPlatform(`Erro ao fazer logout: ${error.message}`, 'error');
    }
  };

  // SEMPRE requer autenticação
  const requiresAuth = !isAuthenticated;

  const refreshUserProfile = useCallback(async (userToRefresh = null) => {
    try {
      let activeUser = userToRefresh; // Usar o usuário passado, que já deve estar atualizado

      if (!activeUser) {
        // Se nenhum usuário foi passado, usar o atual do Auth e recarregá-lo
        activeUser = auth.currentUser;
        if (activeUser) {
          await activeUser.reload(); // Forçar o recarregamento do Firebase Auth
          logPlatform('✅ Usuário recarregado do Firebase Auth no refreshUserProfile', 'debug');
        }
      }

      if (!activeUser) {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsSubscriber(false);
        setHasCalorieCalculator(false);
        return null;
      }

      // Chamar loadUserProfile com o usuário mais atualizado
      // Isso garantirá que setCurrentUser seja chamado com os dados mais recentes
      const updatedUser = await loadUserProfile(activeUser);
      logPlatform('✅ Perfil atualizado via refreshUserProfile. Nova photoURL:', updatedUser?.photoURL, 'debug');
      return updatedUser;
    } catch (error) {
      logPlatform(`❌ Erro ao recarregar perfil no refreshUserProfile: ${error.message}`, 'error');
      return null;
    }
  }, [auth, loadUserProfile]);

  return {
    isPWA: PlatformConfig.isPWA,
    isAuthenticated,
    loading,
    requiresAuth,
    currentUser,
    isSubscriber,
    hasCalorieCalculator,
    login,
    logout,
    platform: PlatformConfig.platform,
    isNative: PlatformConfig.isNative,
    notificationPreferences,
    refreshUserProfile
  };
}

