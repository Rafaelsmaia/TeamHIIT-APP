import { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import TrainingOverview from './pages/TrainingOverview.jsx';
import VideoPlayerDedicated from './pages/VideoPlayerDedicated.jsx';
import Community from './pages/Community.jsx';
import Profile from './pages/Profile.jsx';
import TeamHIIT from './pages/TeamHIIT.jsx';
import { AdminNotifications } from './pages/AdminNotifications.jsx';
import Settings from './pages/Settings.jsx';
import CalorieCalculator from './pages/CalorieCalculator.jsx';
import ImagePreloader from './components/ImagePreloader.jsx';
import PWALogin from './components/PWALogin.jsx';
import AutoLogin from './components/AutoLogin.jsx';
import SplashScreen from './components/SplashScreen.jsx';
import { usePWAAuth } from './hooks/UsePWAAuth.js';
import { FirebaseSyncProvider } from './contexts/FirebaseSyncContext.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import './App.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/smooth-loading.css';
import './pwa-ios-fix.css';

function PrivateRoute({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, [auth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return currentUser ? children : <Navigate to="/auth" replace />;
}

function AppContent() {
  const [preloadingDone, setPreloadingDone] = useState(false);
  const [hideSplashOverlay, setHideSplashOverlay] = useState(false);
  const { isAuthenticated, loading, login, currentUser } = usePWAAuth();
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Detectar prompt de instalação do PWA
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Verificar se há parâmetro ?install=true na URL e mostrar prompt
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldInstall = urlParams.get('install') === 'true';

    if (shouldInstall && deferredPrompt) {
      // Aguardar um pouco para garantir que a página carregou
      setTimeout(() => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('✅ Usuário aceitou instalar o PWA');
          } else {
            console.log('❌ Usuário rejeitou instalar o PWA');
          }
          setDeferredPrompt(null);
          // Remover parâmetro da URL
          const newUrl = window.location.href.split('?')[0] + window.location.hash;
          window.history.replaceState({}, '', newUrl);
        });
      }, 1000);
    }
  }, [deferredPrompt]);

  useEffect(() => {
    // Remover dependência de preloadingDone - não deve bloquear o acesso
    if (!loading && isAuthenticated) {
      const timer = setTimeout(() => {
        setHideSplashOverlay(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated]);

  // Aguardar o loading completar antes de verificar autenticação
  // Isso evita race conditions onde o estado ainda não foi atualizado
  if (loading) {
    return <SplashScreen />;
  }

  // Verificar também auth.currentUser diretamente para evitar race conditions
  const auth = getAuth();
  const currentAuthUser = auth.currentUser;
  const isReallyAuthenticated = isAuthenticated || currentAuthUser !== null;

  // Verificar se está na rota de login automático (deve ser acessível sem autenticação)
  const currentHash = window.location.hash;
  const isAutoLoginRoute = currentHash === '#/auto-login' || 
                           currentHash.startsWith('#/auto-login?');

  // Permitir acesso à rota de login automático sem autenticação
  if (!isReallyAuthenticated && !isAutoLoginRoute) {
    return <PWALogin onLogin={login} />;
  }

  return (
    <>
      <FirebaseSyncProvider currentUser={currentUser} loading={loading}>
        <ImagePreloader onLoadComplete={() => setPreloadingDone(true)} showSplash={false}>
          <Router>
            <Routes>
              <Route path="/auto-login" element={<AutoLogin />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/player/:trainingId/:videoId" element={<VideoPlayerDedicated />} />
              <Route path="/trainings/:id" element={<TrainingOverview />} />
              <Route path="/video/:moduleId/:videoId" element={<TrainingOverview />} />
              <Route path="/video/:moduleId" element={<TrainingOverview />} />
              <Route path="/player" element={<TrainingOverview />} />
              <Route 
                path="/community" 
                element={
                  <PrivateRoute>
                    <Community />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/teamhiit" 
                element={
                  <PrivateRoute>
                    <TeamHIIT />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/admin/notifications" 
                element={
                  <PrivateRoute>
                    <AdminNotifications />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/settings" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                }
              />
              <Route 
                path="/nutrition" 
                element={
                  <PrivateRoute>
                    <CalorieCalculator />
                  </PrivateRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </ImagePreloader>
      </FirebaseSyncProvider>
      {!hideSplashOverlay && <SplashScreen />}
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;

