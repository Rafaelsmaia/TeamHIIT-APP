/**
 * Componente de Login Integrado com GreenN
 * Substitui o PWALogin atual para integrar com a plataforma GreenN
 */

import { useState, useCallback } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useGreenNAuth } from '../hooks/useGreenNAuth';
import { useTheme } from '../contexts/ThemeContext';

function GreenNLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);
  const [isLogin, setIsLogin] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const { isDarkMode } = useTheme();
  const { 
    login, 
    createAccount, 
    loading, 
    error: authError 
  } = useGreenNAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    if (!email.includes('@')) {
      return;
    }

    try {
      let result;
      
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await createAccount(email, password, displayName);
      }

      if (result.success) {
        setLoginSuccess(true);
        // Redirecionar para dashboard após sucesso
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (error) {
      console.error('Erro no login:', error);
    }
  };

  const handleCreateAccount = () => {
    setIsLogin(false);
  };

  const handleBackToLogin = () => {
    setIsLogin(true);
  };

  // Tela de sucesso
  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
        <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl p-8 w-full max-w-md`}>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Login realizado com sucesso!
            </h2>
            
            <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Redirecionando para o dashboard...
            </p>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
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
            src="/IMAGES/LOGOS/ICONE-TH.png" 
            alt="Team HIIT" 
            className="h-16 w-auto"
          />
        </div>
        
        {/* Título */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isLogin ? 'Acesso ao Team HIIT' : 'Criar Conta'}
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
            {isLogin ? 'Faça login com suas credenciais GreenN' : 'Crie sua conta para começar'}
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} py-8 px-4 sm:rounded-lg sm:px-10 shadow-lg`}>
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
                  className={`appearance-none relative block w-full px-3 py-4 border-0 border-b-2 ${isDarkMode ? 'border-gray-600 placeholder-gray-400 text-white focus:border-blue-500 bg-gray-700' : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:border-blue-500 bg-transparent'} focus:outline-none focus:ring-0 focus:z-10 text-lg`}
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
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
                  className={`appearance-none relative block w-full px-3 py-4 pr-12 border-0 border-b-2 ${isDarkMode ? 'border-gray-600 placeholder-gray-400 text-white focus:border-blue-500 bg-gray-700' : 'border-gray-300 placeholder-gray-500 text-gray-900 focus:border-blue-500 bg-transparent'} focus:outline-none focus:ring-0 focus:z-10 text-lg`}
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

            {/* Error Message */}
            {authError && (
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-medium rounded-lg ${isDarkMode ? 'text-white bg-blue-600 hover:bg-blue-700' : 'text-white bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Entrando...' : 'Criando conta...'}
                  </div>
                ) : (
                  isLogin ? 'Entrar' : 'Criar Conta'
                )}
              </button>
            </div>

            {/* Toggle Login/Register */}
            <div className="text-center">
              {isLogin ? (
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} font-medium`}
                >
                  Não tem uma conta? Criar conta
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} font-medium`}
                >
                  Já tem uma conta? Fazer login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GreenNLogin;
