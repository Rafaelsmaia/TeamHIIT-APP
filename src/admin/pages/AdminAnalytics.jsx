import { BarChart3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

export default function AdminAnalytics() {
  const { isDarkMode } = useTheme();

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Analytics e Relatórios
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Visualize métricas e estatísticas do sistema
        </p>
      </div>

      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
        <BarChart3 className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
        <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Em Desenvolvimento
        </h3>
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
          Esta funcionalidade será implementada em breve
        </p>
      </div>
    </div>
  );
}
