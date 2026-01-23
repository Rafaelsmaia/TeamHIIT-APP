import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      // IMPORTANTE: Forçar tema claro no primeiro load
      // Remover qualquer tema salvo anteriormente que possa estar forçando dark mode
      const savedTheme = localStorage.getItem('theme');
      
      // Se já tem um tema salvo, usar ele
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      
      // Se não tem tema salvo, usar claro por padrão e salvar
      localStorage.setItem('theme', 'light');
      return false;
    } catch (error) {
      console.error('❌ [ThemeContext] Erro ao ler localStorage:', error);
      return false; // Em caso de erro, usar tema claro
    }
  });

  useEffect(() => {
    try {
      // Salvar preferência no localStorage
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.error('❌ [ThemeContext] Erro ao salvar no localStorage:', error);
    }
    
    try {
      // Aplicar tema ao documento
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('❌ [ThemeContext] Erro ao aplicar tema:', error);
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
