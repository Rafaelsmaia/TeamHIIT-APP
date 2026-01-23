import { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import NotificationService from '../services/NotificationService';
import { getAuth } from 'firebase/auth';

const filterOutTestNotifications = (items = []) => {
  return items.filter((notification) => {
    const title = notification?.title?.toLowerCase?.() || '';
    const message = notification?.message?.toLowerCase?.() || '';
    const category = notification?.category?.toLowerCase?.() || '';

    const containsTestKeyword = title.includes('notificação teste')
      || title.includes('notificacao teste')
      || message.includes('notificação teste')
      || message.includes('notificacao teste');

    const isTestCategory = category === 'test' || category === 'teste';

    return !(containsTestKeyword || isTestCategory);
  });
};

export function NotificationPopup({ isDarkMode, isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const popupRef = useRef(null);
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const readNotifications = notifications.filter((notification) => notification.read);

  // Fechar popup ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Fechar com ESC
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  // Carregar notificações reais do Firebase
  useEffect(() => {
    const loadNotifications = async () => {
      if (isOpen && currentUser) {
        setLoading(true);
        try {
          const userNotifications = await NotificationService.getUserNotifications(currentUser.uid);
          setNotifications(filterOutTestNotifications(userNotifications));
        } catch (error) {
          console.error('Erro ao carregar notificações:', error);
          setNotifications([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadNotifications();
  }, [currentUser, isOpen]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (currentUser) {
      try {
        await NotificationService.markAllAsRead(currentUser.uid);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (error) {
        console.error('Erro ao marcar todas como lidas:', error);
      }
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Agora';
    
    const now = new Date();
    const notificationTime = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    
    if (diffInSeconds < 60) return 'Agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
    return `${Math.floor(diffInSeconds / 604800)} semanas atrás`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-start justify-end pt-20 pr-4 z-50">
      <div 
        ref={popupRef}
        className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} w-80 max-h-96 overflow-hidden`}
      >
        {/* Header */}
        <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-3 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <Bell className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Notificações
            </h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className={`p-1 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} rounded transition-colors`}
          >
            <X className={`w-4 h-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Carregando notificações...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Nenhuma notificação
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {unreadNotifications.length > 0 && (
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className={`px-4 py-2 ${isDarkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-500 bg-white'} text-xs uppercase tracking-wide font-semibold`}>
                    Não lidas
                  </div>
                  {unreadNotifications.map((notification) => {
                    const previewImage = notification?.payload?.previewImage;
                    const showPreview = notification?.category === 'announcement' && previewImage;

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'} transition-colors cursor-pointer`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {showPreview ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                              <img
                                src={previewImage}
                                alt="Prévia do anúncio"
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            getNotificationIcon(notification.type)
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} font-bold`}>
                                {notification.title}
                              </p>
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                            </div>
                            {notification?.payload?.authorName && (
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                                Publicado por {notification.payload.authorName}
                              </p>
                            )}
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {readNotifications.length > 0 && (
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className={`px-4 py-2 ${isDarkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-500 bg-white'} text-xs uppercase tracking-wide font-semibold`}>
                    Já lidas
                  </div>
                  {readNotifications.map((notification) => {
                    const previewImage = notification?.payload?.previewImage;
                    const showPreview = notification?.category === 'announcement' && previewImage;

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {showPreview ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
                              <img
                                src={previewImage}
                                alt="Prévia do anúncio"
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            getNotificationIcon(notification.type)
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {notification.title}
                              </p>
                            </div>
                            {notification?.payload?.authorName && (
                              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>
                                Publicado por {notification.payload.authorName}
                              </p>
                            )}
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && unreadNotifications.length > 0 && (
          <div className={`${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-4 py-2 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <button
              onClick={markAllAsRead}
              className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} transition-colors`}
            >
              Marcar todas como lidas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
