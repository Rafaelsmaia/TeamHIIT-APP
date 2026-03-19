import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, Zap, FileText, ExternalLink, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import Header from '../components/ui/Header.jsx';
import { deleteUser, EmailAuthProvider, getAuth, reauthenticateWithCredential, signOut } from 'firebase/auth';
import { collection, collectionGroup, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig.js';
import NotificationService from '../services/NotificationService.js';
import { useNotifications } from '../hooks/useNotifications.js';

const clearUserLocalData = () => {
  const keysToRemove = [
    'authenticated',
    'user_email',
    'user_uid',
    'user',
    'notificationSettings',
    'teamhiit_user_progress',
    'teamhiit_user_habits',
    'pendingPostImage',
    'pendingPostImageName',
    'pendingPostImageType',
    'pendingCalorieImage',
    'pendingCalorieImageName',
    'pendingCalorieImageType'
  ];

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

const deleteDocsFromSnapshot = async (snapshot) => {
  await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
};

function Settings() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const auth = getAuth();
  const {
    requestPermission,
    revokeToken,
    isSupported: messagingSupported
  } = useNotifications();
  
  // Estados para configurações de notificações
  const [notifications, setNotifications] = useState({
    push: true,
    email: true,
    habitReminders: true
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Scroll para o topo quando a página é carregada
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Carregar configurações salvas
  useEffect(() => {
    const loadSettings = async () => {
      const currentUser = auth.currentUser;

      try {
        if (currentUser) {
          const preferences = await NotificationService.getUserPreferences(currentUser.uid);
          const normalized = NotificationService.normalizePreferences(preferences);
          setNotifications(normalized);
          localStorage.setItem('notificationSettings', JSON.stringify(normalized));
        } else {
          const savedSettings = localStorage.getItem('notificationSettings');
          if (savedSettings) {
            const parsed = JSON.parse(savedSettings);
            setNotifications(NotificationService.normalizePreferences(parsed));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        setSaveError('Erro ao carregar suas preferências.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [auth]);

  const persistSettings = useCallback(async (nextNotifications) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const currentUser = auth.currentUser;
      const payload = NotificationService.normalizePreferences(nextNotifications || notifications);

      if (currentUser) {
        await NotificationService.saveUserPreferences(currentUser.uid, payload);
      }

      if (payload) {
        localStorage.setItem('notificationSettings', JSON.stringify(payload));
      }
      console.log('Configurações salvas automaticamente:', payload);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSaveError('Não foi possível salvar automaticamente.');
    } finally {
      setIsSaving(false);
    }
  }, [notifications, auth]);

  const handleToggle = async (key) => {
    if (key === 'push') {
      if (!notifications.push) {
        if (!messagingSupported) {
          setSaveError('Notificações push não são suportadas neste dispositivo.');
          return;
        }

        const permissionGranted = await requestPermission();
        if (!permissionGranted) {
          setSaveError('Permita notificações nas configurações do dispositivo para ativar.');
          return;
        }
      } else {
        await revokeToken();
      }
    }

    setNotifications(prev => {
      const updated = {
        ...prev,
        [key]: !prev[key]
      };
      persistSettings(updated);
      return updated;
    });
  };

  const handleDeleteAccount = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser?.email) {
      setDeleteError('Não foi possível validar a conta atual.');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Digite sua senha atual para excluir a conta.');
      return;
    }

    const confirmed = window.confirm(
      'Tem certeza que deseja excluir sua conta? Esta ação apaga o acesso e os dados principais do app e não pode ser desfeita.'
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);

      const userId = currentUser.uid;
      const email = currentUser.email;

      const [
        userPostsSnapshot,
        trainingCommentsSnapshot,
        communityCommentsSnapshot,
        notificationsSnapshot,
        workoutHistorySnapshot,
        interactionsSnapshot
      ] = await Promise.all([
        getDocs(query(collection(db, 'posts'), where('authorId', '==', userId))),
        getDocs(query(collection(db, 'comments'), where('userId', '==', userId))),
        getDocs(query(collectionGroup(db, 'comments'), where('authorId', '==', userId))),
        getDocs(query(collection(db, 'notifications'), where('userId', '==', userId))),
        getDocs(query(collection(db, 'workoutHistory'), where('userId', '==', userId))),
        getDocs(collection(db, 'userInteractions', userId, 'posts'))
      ]);

      await Promise.all(
        userPostsSnapshot.docs.map(async (postDoc) => {
          const postCommentsSnapshot = await getDocs(collection(db, 'posts', postDoc.id, 'comments'));
          await deleteDocsFromSnapshot(postCommentsSnapshot);
          await deleteDoc(postDoc.ref);
        })
      );

      await Promise.all([
        deleteDocsFromSnapshot(trainingCommentsSnapshot),
        deleteDocsFromSnapshot(communityCommentsSnapshot),
        deleteDocsFromSnapshot(notificationsSnapshot),
        deleteDocsFromSnapshot(workoutHistorySnapshot),
        deleteDocsFromSnapshot(interactionsSnapshot),
        deleteDoc(doc(db, 'users', userId)).catch(() => {}),
        deleteDoc(doc(db, 'progress', userId)).catch(() => {}),
        deleteDoc(doc(db, 'habits', userId)).catch(() => {}),
        deleteDoc(doc(db, 'fcm_tokens', userId)).catch(() => {}),
        deleteDoc(doc(db, 'notification_preferences', userId)).catch(() => {}),
        deleteDoc(doc(db, 'user_credentials', email)).catch(() => {})
      ]);

      await deleteUser(currentUser);
      clearUserLocalData();
      await signOut(auth).catch(() => {});
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Erro ao excluir conta:', error);

      switch (error.code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setDeleteError('Senha atual incorreta.');
          break;
        case 'auth/requires-recent-login':
          setDeleteError('Faça login novamente e tente excluir a conta de novo.');
          break;
        default:
          setDeleteError('Não foi possível excluir a conta agora. Tente novamente.');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
        <Header />
        <div className="flex items-center justify-center h-96 pt-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <Header />
      
      {/* Conteúdo Principal */}
      <div className="px-6 pb-32 pt-20">
        
        {/* Header da Página */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors mr-4`}
          >
            <ArrowLeft className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Configurações
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Ajuste preferências do aplicativo
            </p>
          </div>
        </div>

        {/* Seção de Tipos de Notificação */}
        <div className="mb-8">
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Tipos de Notificação
          </h2>
          
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
            
            {/* Notificações Push */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Notificações Push
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Receber notificações no dispositivo
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleToggle('push')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.push ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.push ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Lembretes de Hábitos */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Lembretes de Hábitos
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Receber lembretes para manter seus hábitos saudáveis em dia
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleToggle('habitReminders')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications.habitReminders ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications.habitReminders ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Informações Legais */}
        <div className="mb-8">
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Informações Legais
          </h2>
          
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
            
            {/* Política de Privacidade */}
            <a
              href="https://teamhiit.com.br/politica-privacidade.html"
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Política de Privacidade
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Como coletamos e usamos seus dados
                  </p>
                </div>
              </div>
              <ExternalLink className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </a>
          </div>
        </div>

        <div className="mb-8">
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Conta
          </h2>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Excluir Conta
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Remove o acesso ao app e os dados principais vinculados a esta conta.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteAccount((prev) => !prev);
                    setDeleteError(null);
                    setDeletePassword('');
                  }}
                  className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
                >
                  {showDeleteAccount ? 'Cancelar' : 'Excluir conta'}
                </button>
              </div>

              {showDeleteAccount && (
                <div className="mt-4 space-y-3">
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(event) => setDeletePassword(event.target.value)}
                    placeholder="Digite sua senha atual"
                    className={`w-full px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />

                  {deleteError && (
                    <p className="text-sm text-red-500">{deleteError}</p>
                  )}

                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isDeletingAccount ? 'Excluindo conta...' : 'Confirmar exclusão da conta'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6" />
      </div>

    </div>
  );
}

export default Settings;
