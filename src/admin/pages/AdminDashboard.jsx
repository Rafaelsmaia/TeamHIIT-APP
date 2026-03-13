import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Users, Dumbbell, Bell, TrendingUp, Clock, Flame, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import progressManager from '../../utils/ProgressManager.js';
import { checkSuperioresTrainingCount } from '../utils/checkTrainingCount.js';

/**
 * Dashboard Principal do Admin
 * 
 * Exemplo de página admin modular que pode ser facilmente migrada.
 * Dependências:
 * - firebaseConfig.js (db)
 * - ThemeContext.jsx (opcional)
 */
export default function AdminDashboard() {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTrainings: 0,
    notificationsSent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [superioresCheck, setSuperioresCheck] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Contar usuários totais
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        // Contar usuários ativos (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const activeUsersQuery = query(
          collection(db, 'users'),
          where('lastLogin', '>=', thirtyDaysAgo)
        );
        const activeUsersSnapshot = await getDocs(activeUsersQuery);
        const activeUsers = activeUsersSnapshot.size;

        // Contar notificações enviadas
        const notificationsSnapshot = await getDocs(collection(db, 'notifications_queue'));
        const notificationsSent = notificationsSnapshot.size;

        setStats({
          totalUsers,
          activeUsers,
          totalTrainings: 0, // TODO: Implementar contagem de treinos
          notificationsSent,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    
    // Verificar contabilização do módulo Superiores
    const checkSuperiores = () => {
      try {
        const userProgress = progressManager.getProgress();
        const checkResult = checkSuperioresTrainingCount(userProgress);
        setSuperioresCheck(checkResult);
        console.log('📊 Verificação módulo Superiores:', checkResult);
      } catch (error) {
        console.error('Erro ao verificar módulo Superiores:', error);
      }
    };
    
    checkSuperiores();
  }, []);

  const statCards = [
    {
      icon: Users,
      label: 'Total de Usuários',
      value: stats.totalUsers,
      color: 'blue',
    },
    {
      icon: TrendingUp,
      label: 'Usuários Ativos',
      value: stats.activeUsers,
      color: 'green',
    },
    {
      icon: Dumbbell,
      label: 'Treinos Disponíveis',
      value: stats.totalTrainings,
      color: 'orange',
    },
    {
      icon: Bell,
      label: 'Notificações Enviadas',
      value: stats.notificationsSent,
      color: 'purple',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Dashboard Administrativo
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Visão geral do sistema Team HIIT
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: isDarkMode ? 'bg-blue-600' : 'bg-blue-50',
            green: isDarkMode ? 'bg-green-600' : 'bg-green-50',
            orange: isDarkMode ? 'bg-orange-600' : 'bg-orange-50',
            purple: isDarkMode ? 'bg-purple-600' : 'bg-purple-50',
          };
          const iconColorClasses = {
            blue: 'text-blue-600',
            green: 'text-green-600',
            orange: 'text-orange-600',
            purple: 'text-purple-600',
          };

          return (
            <div
              key={index}
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${colorClasses[stat.color]} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${iconColorClasses[stat.color]}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Verificação Módulo Superiores */}
      {superioresCheck && (
        <div className={`mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className={`w-6 h-6 ${superioresCheck.isValid ? 'text-green-500' : 'text-yellow-500'}`} />
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Verificação: Módulo Superiores com Halteres
            </h2>
          </div>
          
          <div className="space-y-3">
            <div className={`p-4 rounded-lg ${superioresCheck.isValid ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {superioresCheck.message}
              </p>
            </div>
            
            {superioresCheck.details && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Treinos Completados:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {superioresCheck.details.summary.completed} / {superioresCheck.details.summary.total}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tempo Total:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {superioresCheck.details.summary.totalDurationMinutes} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Calorias Total:</span>
                  <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {superioresCheck.details.summary.totalCalories} kcal
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Registrado em lastAccessedVideos:</span>
                  <span className={`font-bold ${superioresCheck.details.summary.hasLastAccess ? 'text-green-600' : 'text-red-600'}`}>
                    {superioresCheck.details.summary.hasLastAccess ? 'Sim' : 'Não'}
                  </span>
                </div>
                
                {superioresCheck.details.lastAccessInfo && (
                  <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Último acesso registrado:
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Vídeo: {superioresCheck.details.lastAccessVideo || superioresCheck.details.lastAccessInfo.videoId}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Data: {new Date(superioresCheck.details.lastAccessInfo.accessedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}
                
                {superioresCheck.details.missingDurations.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className={`text-xs font-medium mb-1 text-red-700 dark:text-red-400`}>
                      ⚠️ {superioresCheck.details.missingDurations.length} vídeo(s) sem duração:
                    </p>
                    {superioresCheck.details.missingDurations.map((v, i) => (
                      <p key={i} className={`text-xs text-red-600 dark:text-red-300`}>
                        • {v.title} ({v.youtubeId})
                      </p>
                    ))}
                  </div>
                )}
                
                {superioresCheck.details.missingCalories.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className={`text-xs font-medium mb-1 text-red-700 dark:text-red-400`}>
                      ⚠️ {superioresCheck.details.missingCalories.length} vídeo(s) sem calorias:
                    </p>
                    {superioresCheck.details.missingCalories.map((v, i) => (
                      <p key={i} className={`text-xs text-red-600 dark:text-red-300`}>
                        • {v.title} ({v.youtubeId})
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Seções Adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ações Rápidas */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Ações Rápidas
          </h2>
          <div className="space-y-3">
            <button className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
            }`}>
              Criar Novo Treino
            </button>
            <button className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
            }`}>
              Enviar Notificação
            </button>
            <button className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
            }`}>
              Ver Relatórios
            </button>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Atividades Recentes
          </h2>
          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Nenhuma atividade recente
          </div>
        </div>
      </div>
    </div>
  );
}
