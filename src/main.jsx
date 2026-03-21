import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './pwa-ios-fix.css'
import App from './App.jsx'
// ToastProvider removido para evitar erros
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { PlatformConfig, logPlatform, getCurrentPlatformConfig } from './config/platform.js';
import AppFallback from './components/AppFallback.jsx';


// Debug visual para apps nativos - cria um overlay de status
const createDebugOverlay = (message, type = 'info') => {
  if (!import.meta.env.DEV) return; // Nunca mostrar overlay de debug em release
  if (!PlatformConfig.isNative) return; // Só no modo nativo
  const platformSettings = getCurrentPlatformConfig();
  if (!platformSettings?.enableDebugOverlay) return;
  
  const overlay = document.createElement('div');
  overlay.id = 'debug-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'};
    color: white;
    padding: 8px;
    z-index: 999999;
    font-size: 12px;
    font-family: monospace;
  `;
  overlay.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  document.body.appendChild(overlay);
  
  // Remove após 3 segundos
  setTimeout(() => overlay.remove(), 3000);
};

// Tratamento de erros global para debug
window.addEventListener('error', (event) => {
  logPlatform(`Erro global capturado: ${event.error?.message || 'Erro desconhecido'}`, 'error');
  
  // Debug visual em apps nativos
  if (PlatformConfig.isNative) {
    createDebugOverlay(`ERRO: ${event.error?.message || 'Erro desconhecido'}`, 'error');
  }
});

const shouldIgnorePromiseRejection = (reason) => {
  const code = reason?.code;
  const message = typeof reason === 'string' ? reason : reason?.message;
  if (!message && !code) return false;

  return code === 'messaging/unsupported-browser' || (typeof message === 'string' && message.includes('messaging/unsupported-browser'));
};

window.addEventListener('unhandledrejection', (event) => {
  logPlatform(`Promise rejeitada: ${event.reason?.message || 'Erro desconhecido'}`, 'error');
  if (shouldIgnorePromiseRejection(event.reason)) {
    logPlatform('Promise rejeitada ignorada (messaging/unsupported-browser).', 'debug');
    return;
  }
  
  // Debug visual em apps nativos
  if (PlatformConfig.isNative) {
    createDebugOverlay(`PROMISE REJEITADA: ${event.reason?.message || 'Erro desconhecido'}`, 'error');
  }
});

// Registrar Service Worker APENAS para PWA (não para apps nativos)
if ('serviceWorker' in navigator && !PlatformConfig.isNative) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        logPlatform(`Service Worker registrado com sucesso: ${registration.scope}`, 'debug');
      })
      .catch((registrationError) => {
        logPlatform(`Service Worker falhou: ${registrationError.message}`, 'error');
      });
  });
} else if (PlatformConfig.isNative) {
  logPlatform('Service Worker desabilitado (modo nativo)', 'debug');
}

// Função para renderizar tela de erro crítico
const renderCriticalError = (error) => {
  console.error('🚨 [MAIN] Renderizando erro crítico:', error);
  
  const root = document.getElementById('root');
  if (root) {
    // Usar React para renderizar o fallback
    try {
      const fallbackRoot = createRoot(root);
      fallbackRoot.render(<AppFallback />);
    } catch (fallbackError) {
      console.error('❌ [MAIN] Erro no fallback, usando HTML direto:', fallbackError);
      root.innerHTML = `
        <div style="
          min-height: 100vh;
          background: #ff0000;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 20px;
          text-align: center;
          border: 5px solid #00ff00;
        ">
          <div>
            <h1 style="font-size: 2rem; margin-bottom: 1rem;">🚨 FALLBACK HTML 🚨</h1>
            <p style="font-size: 1.2rem; margin-bottom: 1rem;">App funcionando via fallback HTML!</p>
            <p style="font-size: 1rem; opacity: 0.8; margin-bottom: 2rem;">${error?.message || 'Erro desconhecido'}</p>
            <button onclick="window.location.reload()" style="
              background: white;
              color: #ff0000;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: bold;
              cursor: pointer;
            ">
              Recarregar Página
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Função para aguardar o DOM estar pronto
const waitForDOM = () => {
  return new Promise((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resolve);
    } else {
      resolve();
    }
  });
};

// Função para aguardar recursos críticos
const waitForCriticalResources = () => {
  return new Promise((resolve) => {
    if (PlatformConfig.isNative) {
      resolve();
      return;
    }

    // Aguardar um pouco para garantir que todos os recursos foram carregados
    setTimeout(resolve, 100);
  });
};

// Função principal de inicialização
const initializeApp = async () => {
  try {
    // Iniciando aplicação
    
    // Aguardar DOM estar pronto
    await waitForDOM();
    // DOM carregado
    
    // Aguardar recursos críticos
    await waitForCriticalResources();
    // Recursos carregados
    
    // Remover fallback de carregamento ANTES de renderizar React
    // Isso evita piscar entre o fallback HTML e o SplashScreen do React
    // Remover imediatamente sem transição para evitar piscar
    const loadingFallback = document.getElementById('loading-fallback');
    if (loadingFallback && loadingFallback.parentNode) {
      loadingFallback.remove();
    }
    
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Elemento #root não encontrado no DOM');
    }
    
    // Elemento root encontrado
    
    const root = createRoot(rootElement);
    
    // Renderizando aplicação
    root.render(
      <StrictMode>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StrictMode>
    );
    
    // Aplicação renderizada com sucesso
    
    // Timeout de segurança para verificar se realmente renderizou
    setTimeout(() => {
      const root = document.getElementById('root');
      if (root && root.innerHTML.trim() === '') {
        window.location.reload();
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ [MAIN] ERRO CRÍTICO na renderização:', error);
    console.error('❌ [MAIN] Stack:', error?.stack);
    renderCriticalError(error);
  }
};

// Inicializar aplicação com fallback robusto
try {
  initializeApp();
} catch (error) {
  console.error('❌ [MAIN] Erro na inicialização:', error);
  
  // FALLBACK: Se der erro, forçar reload após 1 segundo
  setTimeout(() => {
    console.log('🔄 [MAIN] Forçando reload devido a erro...');
    window.location.reload();
  }, 1000);
}

// Timeout de segurança para remover fallback
setTimeout(() => {
  const loadingFallback = document.getElementById('loading-fallback');
  if (loadingFallback) {
    console.log('⚠️ [MAIN] Removendo fallback por timeout');
    loadingFallback.remove();
  }
}, 5000); // 5 segundos de timeout

