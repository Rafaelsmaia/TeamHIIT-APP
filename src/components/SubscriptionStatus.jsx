/**
 * Componente para exibir o status da assinatura GreenN
 * Mostra informações sobre o plano atual e funcionalidades disponíveis
 */

import { useState } from 'react';
import { Crown, Star, Check, X, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getPlanInfo, getSubscriptionStatusText, isSubscriptionExpiring } from '../config/greenn';

function SubscriptionStatus({ subscriptionStatus, onUpgrade }) {
  const { isDarkMode } = useTheme();
  const [showFeatures, setShowFeatures] = useState(false);

  if (!subscriptionStatus) {
    return null;
  }

  const planInfo = getPlanInfo(subscriptionStatus.plan);
  const statusText = getSubscriptionStatusText(subscriptionStatus);
  const isExpiring = isSubscriptionExpiring(subscriptionStatus);
  const isActive = subscriptionStatus.isActive;

  const getPlanIcon = (plan) => {
    switch (plan) {
      case 'free':
        return <Star className="w-5 h-5" />;
      case 'basic':
        return <Crown className="w-5 h-5" />;
      case 'premium':
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 'vip':
        return <Crown className="w-5 h-5 text-purple-500" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'free':
        return 'text-gray-500';
      case 'basic':
        return 'text-blue-500';
      case 'premium':
        return 'text-yellow-500';
      case 'vip':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusColor = () => {
    if (!isActive) return 'text-red-500';
    if (isExpiring) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`${getPlanColor(subscriptionStatus.plan)}`}>
            {getPlanIcon(subscriptionStatus.plan)}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {planInfo.name}
            </h3>
            <p className={`text-sm ${getStatusColor()}`}>
              {statusText}
            </p>
          </div>
        </div>
        
        {subscriptionStatus.plan !== 'vip' && (
          <button
            onClick={onUpgrade}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            Upgrade
          </button>
        )}
      </div>

      {/* Status da Assinatura */}
      <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div className="flex items-center space-x-2">
          {isActive ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <X className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isActive ? 'Assinatura ativa' : 'Assinatura inativa'}
          </span>
        </div>
        
        {subscriptionStatus.expiresAt && (
          <div className="flex items-center space-x-2 mt-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Expira em: {new Date(subscriptionStatus.expiresAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        
        {isExpiring && (
          <div className="flex items-center space-x-2 mt-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
              Sua assinatura está próxima do vencimento
            </span>
          </div>
        )}
      </div>

      {/* Funcionalidades */}
      <div>
        <button
          onClick={() => setShowFeatures(!showFeatures)}
          className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
          }`}
        >
          <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Funcionalidades Disponíveis
          </span>
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {showFeatures ? 'Ocultar' : 'Ver todas'}
          </span>
        </button>
        
        {showFeatures && (
          <div className="mt-3 space-y-2">
            {planInfo.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-3">
          {subscriptionStatus.plan !== 'free' && (
            <button className="flex items-center space-x-2 text-sm text-blue-500 hover:text-blue-600">
              <CreditCard className="w-4 h-4" />
              <span>Gerenciar Assinatura</span>
            </button>
          )}
          
          <button className="flex items-center space-x-2 text-sm text-blue-500 hover:text-blue-600">
            <Calendar className="w-4 h-4" />
            <span>Histórico de Pagamentos</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionStatus;

