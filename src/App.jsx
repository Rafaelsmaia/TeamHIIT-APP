import { useEffect, useState, Suspense, lazy } from 'react';
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
import AdminLayout from './admin/AdminLayout.jsx';
import AdminRoute from './admin/components/AdminRoute.jsx';
import { PlatformConfig } from './config/platform.js';
import './App.css';
import './styles/responsive.css';
import './styles/animations.css';
import './styles/smooth-loading.css';
import './pwa-ios-fix.css';

// Lazy load admin pages
const AdminDashboard = lazy(() => import('./admin/pages/AdminDashboard.jsx'));
const AdminUsers = lazy(() => import('./admin/pages/AdminUsers.jsx'));
const AdminModules = lazy(() => import('./admin/pages/AdminModules.jsx'));
const AdminModuleEdit = lazy(() => import('./admin/pages/AdminModuleEdit.jsx'));
const AdminTrainings = lazy(() => import('./admin/pages/AdminTrainings.jsx'));
const AdminAnalytics = lazy(() => import('./admin/pages/AdminAnalytics.jsx'));
const AdminSettings = lazy(() => import('./admin/pages/AdminSettings.jsx'));

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
  const auth = getAuth();
  const currentAuthUser = auth.currentUser;
  const isReallyAuthenticated = isAuthenticated || currentAuthUser !== null;

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
    if (!loading && isReallyAuthenticated) {
      const timer = setTimeout(() => {
        setHideSplashOverlay(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [loading, isReallyAuthenticated]);

  // Aguardar o loading completar antes de verificar autenticação
  // Isso evita race conditions onde o estado ainda não foi atualizado
  if (loading) {
    return <SplashScreen />;
  }

  // Verificar também auth.currentUser diretamente para evitar race conditions
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
                  PlatformConfig.isCommunityEnabled ? (
                    <PrivateRoute>
                      <Community />
                    </PrivateRoute>
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
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
              {/* Admin Routes */}
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute>
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  </PrivateRoute>
                }
              >
                <Route 
                  path="dashboard" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                      <AdminDashboard />
                    </Suspense>
                  } 
                />
                <Route 
                  path="users" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                      <AdminUsers />
                    </Suspense>
                  } 
                />
                <Route 
                  path="modules" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                      <AdminModules />
                    </Suspense>
                  } 
                />
                <Route 
                  path="modules/edit/:moduleId" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                      <AdminModuleEdit />
                    </Suspense>
                  } 
                />
                <Route 
                  path="trainings" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                      <AdminTrainings />
                    </Suspense>
                  } 
                />
                <Route 
                  path="notifications" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                      <AdminNotifications />
                    </Suspense>
                  } 
                />
                <Route 
                  path="analytics" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                      <AdminAnalytics />
                    </Suspense>
                  } 
                />
                <Route 
                  path="settings" 
                  element={
                    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
                      <AdminSettings />
                    </Suspense>
                  } 
                />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Route>
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

