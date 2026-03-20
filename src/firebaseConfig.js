import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  indexedDBLocalPersistence,
  initializeAuth,
  inMemoryPersistence,
  signOut
} from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Configurações do Firebase - Configurações reais
const firebaseConfig = {
  apiKey: "AIzaSyA0ZaV9EJl1z4hT0wd5EL-7RqG2slAE5Kg",
  authDomain: "comunidade-team-hiit.firebaseapp.com",
  projectId: "comunidade-team-hiit",
  storageBucket: "comunidade-team-hiit.firebasestorage.app",
  messagingSenderId: "106629704358",
  appId: "1:106629704358:web:7151af4773e2e4c3822267",
  measurementId: "G-9GDD249KT4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const createAuth = () => {
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
        inMemoryPersistence
      ]
    });
  } catch (error) {
    console.warn('⚠️ Fallback para getAuth(app):', error);
    return getAuth(app);
  }
};

const auth = createAuth();

// Função para limpar dados de autenticação na primeira instalação
// IMPORTANTE: Preserva a autenticação se o usuário já estiver logado
const clearAuthOnFirstInstall = async () => {
  const FIRST_INSTALL_KEY = 'teamhiit_first_install_done';
  
  try {
    // Verificar se já foi executado antes
    const firstInstallDone = localStorage.getItem(FIRST_INSTALL_KEY);
    
    if (!firstInstallDone) {
      console.log('🔧 Primeira instalação detectada - verificando autenticação...');
      
      // Aguardar um pouco para garantir que o Firebase Auth está inicializado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if a user is currently authenticated
      const user = await new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((u) => {
          unsubscribe();
          resolve(u);
        });
      });
      
      if (user) {
        console.log('✅ Usuário autenticado encontrado, pulando limpeza de sessão.');
      } else {
        // Proceed with logout and cleanup only if no user is authenticated
        try {
          if (auth.currentUser) {
            await signOut(auth);
            console.log('✅ Logout do Firebase Auth realizado');
          }
        } catch (signOutError) {
          console.warn('⚠️ Erro ao fazer logout:', signOutError);
        }
        
        const authKeys = [
          'authenticated', 'pwa_authenticated', 'user_email', 'user_uid', 'user',
          'notificationSettings', 'teamhiit_user_progress', 'teamhiit_user_habits'
        ];
        authKeys.forEach(key => {
          try { localStorage.removeItem(key); } catch (e) { console.warn(`⚠️ Erro ao remover ${key}:`, e); }
        });
        
        try {
          if ('indexedDB' in window) {
            const dbName = 'firebaseLocalStorageDb';
            const deleteReq = indexedDB.deleteDatabase(dbName);
            deleteReq.onsuccess = () => { console.log('✅ IndexedDB do Firebase Auth limpo'); };
            deleteReq.onerror = () => { console.warn('⚠️ Erro ao limpar IndexedDB'); };
            deleteReq.onblocked = () => {
              console.warn('⚠️ IndexedDB bloqueado, tentando novamente...');
              setTimeout(() => { indexedDB.deleteDatabase(dbName); }, 1000);
            };
          }
        } catch (indexedDBError) { console.warn('⚠️ Erro ao limpar IndexedDB:', indexedDBError); }
      }
      localStorage.setItem(FIRST_INSTALL_KEY, 'true');
      console.log('✅ Limpeza de primeira instalação concluída');
    }
  } catch (error) { console.error('❌ Erro na limpeza de primeira instalação:', error); }
};

// Executar limpeza na inicialização
if (typeof window !== 'undefined') {
  clearAuthOnFirstInstall();
}

// Initialize Firebase Cloud Messaging
let messaging = null;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('FCM não disponível:', error);
  }
}

export { db, auth, storage, messaging };
