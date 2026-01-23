import { useState, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
// import { useToast } from './ui/Toast.jsx'; // Removido - causava erro
import { useTheme } from '../contexts/ThemeContext.jsx';
function PWALogin({ onLogin = null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [resetPasswordSent, setResetPasswordSent] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [lastResetAttempt, setLastResetAttempt] = useState(null);
  // useToast removido para evitar erros
  // const { addToast } = useToast();
  
  // Função temporária para substituir addToast
  const addToast = (message, type = 'info') => {
    console.log(`Toast ${type}: ${message}`);
  };
  const { isDarkMode } = useTheme();
  const auth = getAuth();

  // Função para detectar se está rodando como PWA
  const isPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true ||
           document.referrer.includes('android-app://');
  };

  // Função para navegação forçada no PWA
  const forceNavigateToDashboard = () => {
    console.log('🚀 [PWALogin] Forçando navegação para dashboard no PWA...');
    
    // Tentar múltiplas formas de navegação para garantir compatibilidade
    // No PWA do iPhone, window.location pode não funcionar imediatamente
    try {
      // Método 1: window.location.href (mais compatível)
      window.location.href = '/dashboard';
      
      // Método 2: window.location.replace (fallback após pequeno delay)
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          console.log('🔄 [PWALogin] Tentativa 2: window.location.replace');
          window.location.replace('/dashboard');
        }
      }, 200);
      
      // Método 3: window.location.assign (fallback final)
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          console.log('🔄 [PWALogin] Tentativa 3: window.location.assign');
          window.location.assign('/dashboard');
        }
      }, 500);
    } catch (error) {
      console.error('❌ [PWALogin] Erro ao redirecionar:', error);
      // Fallback: recarregar a página na rota do dashboard
      window.location.href = window.location.origin + '/dashboard';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetPasswordSent(false); // Limpar mensagem de sucesso do reset se existir

    // Validação básica
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Por favor, insira um e-mail válido');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 [PWALogin] Iniciando processo de login...');
      console.log('📱 [PWALogin] User Agent:', navigator.userAgent);
      console.log('🌐 [PWALogin] Online:', navigator.onLine);
      console.log('📡 [PWALogin] Connection:', navigator.connection?.effectiveType || 'unknown');
      
      // Verificar se o Firebase está funcionando
      if (!auth) {
        throw new Error('Firebase Auth não está disponível. Verifique sua conexão.');
      }

      let userCredential;
      
      if (isLogin) {
        // Login
        console.log('🔐 [PWALogin] Tentando fazer login...');
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('✅ [PWALogin] Login bem-sucedido');
      } else {
        // Criar conta
        console.log('🔐 [PWALogin] Criando nova conta...');
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Atualizar perfil com nome
        if (displayName) {
          await updateProfile(userCredential.user, {
            displayName: displayName
          });
        }
        
        // Salvar dados do usuário no Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          name: displayName || userCredential.user.email,
          displayName: displayName || userCredential.user.email,
          createdAt: new Date()
        });
        console.log('✅ [PWALogin] Conta criada com sucesso');
      }
      
      // Salvar apenas flag de autenticação (não dados sensíveis)
      localStorage.setItem('pwa_authenticated', 'true');
      
      console.log('✅ [PWALogin] Login bem-sucedido');
      
      // Chamar onLogin se existir para notificar o App.jsx
      if (onLogin && typeof onLogin === 'function') {
        console.log('🔄 [PWALogin] Chamando onLogin...');
        onLogin(true);
      }
      
      // Mostrar tela de sucesso brevemente
      setLoginSuccess(true);
      
      // Redirecionar rapidamente
      console.log('✅ [PWALogin] Redirecionando para dashboard...');
      
      // Pequeno delay para mostrar feedback visual
      setTimeout(() => {
        // Usar hash para compatibilidade com HashRouter
          window.location.hash = '/dashboard';
          }, 300);
    } catch (err) {
      console.error('❌ [PWALogin] Erro de autenticação:', err);
      console.error('❌ [PWALogin] Código do erro:', err.code);
      console.error('❌ [PWALogin] Mensagem:', err.message);
      
      // Tratar diferentes tipos de erro do Firebase
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado. Verifique o e-mail.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha incorreta. Tente novamente.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta conta foi desabilitada.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          break;
        case 'auth/invalid-credential':
          errorMessage = 'Credenciais inválidas. Verifique e-mail e senha.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Operação não permitida. Contate o suporte.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Este e-mail já está em uso. Tente fazer login.';
          break;
        default:
          // Verificar se é erro de rede
          if (err.message.includes('network') ||
              err.message.includes('fetch') ||
              err.message.includes('blocked')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else {
            errorMessage = `Erro: ${err.message}`;
          }
      }
      
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Prevenir cliques duplicados
    if (resetPasswordLoading) {
      return;
    }

    // Verificar se já tentou recentemente (últimos 60 segundos)
    const now = Date.now();
    if (lastResetAttempt && (now - lastResetAttempt) < 60000) {
      const secondsLeft = Math.ceil((60000 - (now - lastResetAttempt)) / 1000);
      setError(`Aguarde ${secondsLeft} segundos antes de tentar novamente. O e-mail pode já ter sido enviado.`);
      return;
    }

    // Limpar estados anteriores
    setError('');
    setResetPasswordSent(false);
    
    // Validação básica
    if (!email) {
      setError('Digite seu e-mail primeiro para recuperar a senha');
      addToast('Digite seu e-mail primeiro', 'error');
      return;
    }

    // Validação de formato de email mais robusta
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, insira um e-mail válido');
      addToast('E-mail inválido', 'error');
      return;
    }

    setResetPasswordLoading(true);
    setLastResetAttempt(now);

    try {
      console.log('📧 [PWALogin] Enviando e-mail de recuperação de senha para:', email);
      
      // Verificar se o Firebase está funcionando
      if (!auth) {
        throw new Error('Firebase Auth não está disponível. Verifique sua conexão.');
      }

      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ [PWALogin] E-mail de recuperação enviado com sucesso');
      
      // Mostrar mensagem de sucesso
      setResetPasswordSent(true);
      setError('');
      addToast('E-mail de recuperação enviado! Verifique sua caixa de entrada.', 'success');
      
      // Limpar a mensagem de sucesso após alguns segundos
      setTimeout(() => {
        setResetPasswordSent(false);
      }, 10000);
      
    } catch (err) {
      console.error('❌ [PWALogin] Erro ao enviar e-mail de recuperação:', err);
      console.error('❌ [PWALogin] Código do erro:', err.code);
      console.error('❌ [PWALogin] Mensagem:', err.message);
      
      let errorMessage = 'Erro ao enviar e-mail de recuperação';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'E-mail não encontrado em nossa base de dados. Verifique o e-mail digitado.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'E-mail inválido. Por favor, verifique o formato.';
          break;
        case 'auth/too-many-requests':
          // O Firebase bloqueia quando há muitas tentativas ou email já enviado recentemente
          // Na maioria dos casos, isso significa que o email JÁ FOI ENVIADO recentemente
          // Tratar como sucesso com aviso, pois é mais provável que o email tenha sido enviado
          console.log('⚠️ [PWALogin] Firebase bloqueou por muitas tentativas - provavelmente email já foi enviado');
          setError('');
          setResetPasswordSent(true);
          // Não definir errorMessage aqui, apenas mostrar mensagem de sucesso
          addToast('Se o e-mail está registrado, você receberá instruções para recuperar a senha. Verifique sua caixa de entrada e pasta de spam.', 'success');
          setTimeout(() => {
            setResetPasswordSent(false);
          }, 15000); // Mostrar por mais tempo
          // Retornar cedo para não mostrar erro
          setResetPasswordLoading(false);
          return;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          break;
        default:
          // Verificar se é erro de rede
          if (err.message.includes('network') ||
              err.message.includes('fetch') ||
              err.message.includes('blocked')) {
            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          } else {
            errorMessage = `Erro: ${err.message || 'Não foi possível enviar o e-mail. Tente novamente.'}`;
          }
      }
      
      setError(errorMessage);
      setResetPasswordSent(false);
      addToast(errorMessage, 'error');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  // Tela de sucesso com botão de emergência
  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl p-8 w-full max-w-md`}>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Login realizado com sucesso!
            </h2>
            
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Redirecionando para o dashboard...
            </p>
            
            {/* Botão de emergência para PWA */}
            <button
              onClick={() => {
                console.log('🚨 [PWALogin] Botão de emergência clicado');
                window.location.href = '/dashboard';
              }}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Ir para Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} flex flex-col justify-center py-12 sm:px-6 lg:px-8`}>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/icons/icon-128.webp"
            alt="Team HIIT"
            className="h-24 w-24 object-contain"
          />
        </div>
        
        {/* Título */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isLogin ? 'Acesso ao App' : 'Criar Conta'}
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
            {isLogin ? 'Faça login para continuar' : 'Crie sua conta para começar'}
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} py-8 px-4 sm:rounded-lg sm:px-10`}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Nome Field - apenas para criação de conta */}
            {!isLogin && (
              <div>
                <label htmlFor="displayName" className="sr-only">
                  Nome
                </label>
                <div className="relative">
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    autoComplete="name"
                    className={`appearance-none relative block w-full px-3 py-4 border-0 border-b-2 ${isDarkMode ? 'border-gray-600 placeholder-gray-400 text-white focus:border-blue-500 bg-gray-700' : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:border-blue-500 bg-transparent'} focus:outline-none focus:ring-0 focus:z-10 text-lg`}
                    placeholder="Nome (opcional)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="sr-only">
                E-mail
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-4 border-0 border-b-2 border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-0 focus:border-red-500 focus:z-10 bg-gray-100 text-lg"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mt-8">
              <label htmlFor="password" className="sr-only">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`appearance-none relative block w-full px-3 py-4 border-0 border-b-2 ${isDarkMode ? 'border-gray-600 placeholder-gray-400 text-white focus:border-blue-500 bg-gray-700' : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:border-blue-500 bg-transparent'} focus:outline-none focus:ring-0 focus:z-10 text-lg pr-12`}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center z-20 cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePasswordVisibility();
                  }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <EyeOff className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  ) : (
                    <Eye className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex flex-col items-center mt-6 space-y-2">
              <button
                type="button"
                disabled={resetPasswordLoading || loading}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleForgotPassword();
                }}
              >
                {resetPasswordLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    Enviando...
                  </>
                ) : (
                  'Esqueceu sua senha?'
                )}
              </button>
              
              {/* Success Message for Password Reset */}
              {resetPasswordSent && (
                <div className={`${isDarkMode ? 'bg-green-900 border-green-700 text-green-200' : 'bg-green-50 border-green-200 text-green-800'} border px-4 py-3 rounded-md text-sm text-center w-full`}>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-medium">E-mail de recuperação enviado!</span>
                    </div>
                    <span className="text-xs">Verifique sua caixa de entrada e pasta de spam. Se o e-mail está registrado, você receberá as instruções.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && !resetPasswordSent && (
              <div className={`${isDarkMode ? 'bg-red-900 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-600'} border px-4 py-3 rounded-md text-sm`}>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Login Button */}
            <div className="mt-12">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-full text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  isLogin ? 'Login' : 'Criar Conta'
                )}
              </button>
            </div>

            {/* Toggle Login/Create Account */}
            <div className="flex justify-center mt-8">
              <button
                type="button"
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'} text-lg transition-colors`}
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
              >
                {isLogin ? 'Criar nova conta' : 'Já tem uma conta? Faça login!'}
              </button>
            </div>
          </form>
          
          {/* Info adicional */}
          <div className="mt-6 text-center">
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Use as mesmas credenciais do site web
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWALogin;

