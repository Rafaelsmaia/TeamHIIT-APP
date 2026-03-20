import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { resolveAccessLink } from '../services/AuthLinkService.js';

function AutoLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    performAutoLogin();
  }, [token, email]);

  const performAutoLogin = async () => {
    if (!token || !email) {
      setError('Link inválido. Verifique se copiou o link completo do email.');
      setValidating(false);
      setLoading(false);
      return;
    }

    try {
      setValidating(true);
      setLoading(true);

      setTokenValid(true);

      // Fazer login automático
      const auth = getAuth();
      const result = await resolveAccessLink({
        email,
        token,
        type: 'auto-login'
      });
      await signInWithCustomToken(auth, result.customToken);

      setSuccess(true);
      
      // Redirecionar para dashboard após 1 segundo
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      console.error('Erro no login automático:', err);
      let errorMessage = 'Erro ao fazer login automático. Use suas credenciais para fazer login manualmente.';
      
      switch (err.code) {
        case 'auth/user-not-found':
          errorMessage = 'Usuário não encontrado. Verifique o email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Senha temporária inválida. Use as credenciais do email.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Email inválido.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Esta conta foi desabilitada.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Erro de conexão. Verifique sua internet.';
          break;
        default:
          errorMessage =
            err.message ||
            'Erro ao fazer login automático.';
      }
      
      setError(errorMessage);
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  if (validating || loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
          <p className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Fazendo login automático...
          </p>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Aguarde um momento
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8`}>
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Login Realizado com Sucesso!
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Redirecionando para o dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid || error) {
    return (
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full mx-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl p-8`}>
          <div className="text-center mb-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {error ? 'Erro no Login Automático' : 'Link Inválido'}
            </h1>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              {error || 'Este link não é válido ou expirou.'}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Você pode fazer login manualmente:
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Use o email e senha temporária que foram enviados para você no email de boas-vindas.
            </p>
          </div>

          <button
            onClick={() => navigate('/auth')}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              isDarkMode 
                ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default AutoLogin;

