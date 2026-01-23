import { useState, useEffect } from 'react';
import { getToken, onMessage, deleteToken as firebaseDeleteToken, isSupported as messagingIsSupported } from 'firebase/messaging';
import { messaging } from '../firebaseConfig';
import NotificationService from '../services/NotificationService.js';

export function useNotifications() {
  const [fcmToken, setFcmToken] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const isNotificationAPIAvailable = typeof window !== 'undefined' && typeof window.Notification !== 'undefined';

  // Verificar se FCM é suportado
  useEffect(() => {
    (async () => {
      if (typeof window !== 'undefined') {
        try {
          const supported = await messagingIsSupported();
          setIsSupported(supported && !!messaging && isNotificationAPIAvailable);
        } catch (error) {
          console.error('Erro ao verificar suporte a FCM:', error);
          setIsSupported(false);
        }
      }
    })();
  }, [isNotificationAPIAvailable]);

  // Solicitar permissão e obter token
  const requestPermission = async () => {
    if (!messaging || !isNotificationAPIAvailable) return false;

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI8F5j8kEdg3YwL4QMXMpVlQCBgU6lY0jP0n6S5U8L9tM1oP3qR5sT7uV9wX2yZ4'
        });
        
        if (token) {
          setFcmToken(token);
          await saveToken(token);
          localStorage.setItem('fcm_token', token);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  };

  const saveToken = async (token) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.uid) {
        await NotificationService.saveUserFcmToken(user.uid, token, {
          platform: 'web',
          userEmail: user.email || null
        });
        console.log('Token FCM salvo no Firestore');
      }
    } catch (error) {
      console.error('Erro ao salvar token:', error);
    }
  };

  const revokeToken = async () => {
    try {
      const storedToken = fcmToken || localStorage.getItem('fcm_token');
      if (messaging && storedToken) {
        await firebaseDeleteToken(messaging);
      }

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.uid) {
        await NotificationService.deleteUserFcmToken(user.uid);
      }

      setFcmToken(null);
      localStorage.removeItem('fcm_token');
      return true;
    } catch (error) {
      console.error('Erro ao revogar token FCM:', error);
      return false;
    }
  };

  // Configurar listener para mensagens em foreground
  useEffect(() => {
    if (messaging && isNotificationAPIAvailable) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Mensagem recebida:', payload);
        
        // Mostrar notificação customizada
        if (payload.notification) {
          const notification = new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png'
          });
          
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // Verificar permissão atual
  useEffect(() => {
    if (isNotificationAPIAvailable) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
  }, [isNotificationAPIAvailable]);

  return {
    fcmToken,
    isSupported,
    permission,
    requestPermission,
    revokeToken,
    isEnabled: permission === 'granted' && fcmToken !== null
  };
}












