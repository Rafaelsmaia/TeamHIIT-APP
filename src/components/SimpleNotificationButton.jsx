import { useEffect, useState, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { NotificationPopup } from './NotificationPopup';
import NotificationService from '../services/NotificationService';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export function SimpleNotificationButton({ isDarkMode }) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchUnreadCount = useCallback(async (userId) => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      const notifications = await NotificationService.getUserNotifications(userId, 50);
      const unread = notifications.filter(notification => !notification.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUnreadCount(user.uid);
      } else {
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (isPopupOpen && currentUser) {
      fetchUnreadCount(currentUser.uid);
    }
  }, [isPopupOpen, currentUser, fetchUnreadCount]);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  return (
    <>
      <button 
        onClick={togglePopup}
        className={`relative p-2 ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded-lg transition-colors`}
        title="Ver notificações"
      >
        <Bell className={`w-6 h-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center shadow-lg"
            aria-label={`${unreadCount} notificações não lidas`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPopup 
        isDarkMode={isDarkMode}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </>
  );
}


