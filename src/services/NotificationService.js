import { db } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  serverTimestamp, 
  doc, 
  updateDoc,
  deleteDoc,
  limit,
  setDoc,
  getDoc
} from 'firebase/firestore';

class NotificationService {
  // Criar uma nova notificação
  static async createNotification(userId, notification) {
    try {
      const preferences = await this.getUserPreferences(userId);
      if (!this.isNotificationAllowed(notification?.category, preferences)) {
        console.log('🚫 Notificação bloqueada pelas preferências do usuário:', userId, notification?.category);
        return null;
      }

      const notificationData = {
        ...notification,
        userId: userId,
        timestamp: serverTimestamp(),
        read: false,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('✅ Notificação criada:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
      throw error;
    }
  }

  static isNotificationAllowed(category, preferences = {}) {
    const prefs = this.normalizePreferences(preferences);

    if (!prefs.push) {
      return false;
    }

    switch (category) {
      case 'habit':
      case 'reminder':
        return prefs.habitReminders;
      case 'content':
        return prefs.marketing || prefs.email;
      default:
        return true;
    }
  }

  // === Gerenciamento de Tokens FCM ===
  static async saveUserFcmToken(userId, token, metadata = {}) {
    if (!userId || !token) {
      throw new Error('User ID e token são obrigatórios para salvar FCM');
    }

    const tokenRef = doc(db, 'fcm_tokens', userId);
    await setDoc(tokenRef, {
      userId,
      token,
      platform: metadata.platform || 'web',
      userEmail: metadata.userEmail || null,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  static async deleteUserFcmToken(userId) {
    if (!userId) return;
    const tokenRef = doc(db, 'fcm_tokens', userId);
    await deleteDoc(tokenRef);
  }

  // Buscar notificações de um usuário
  static async getUserNotifications(userId, limitCount = 50) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        });
      });

      // Ordenar localmente por timestamp (mais recente primeiro)
      notifications.sort((a, b) => {
        const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
        const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
        return timeB - timeA; // Ordem decrescente (mais recente primeiro)
      });

      return notifications;
    } catch (error) {
      console.error('❌ Erro ao buscar notificações:', error);
      return [];
    }
  }

  // Marcar notificação como lida
  static async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
      console.log('✅ Notificação marcada como lida:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao marcar notificação como lida:', error);
    }
  }

  // Marcar todas as notificações como lidas
  static async markAllAsRead(userId) {
    try {
      const notifications = await this.getUserNotifications(userId);
      const unreadNotifications = notifications.filter(n => !n.read);

      const updatePromises = unreadNotifications.map(notification => 
        this.markAsRead(notification.id)
      );

      await Promise.all(updatePromises);
      console.log('✅ Todas as notificações marcadas como lidas');
    } catch (error) {
      console.error('❌ Erro ao marcar todas como lidas:', error);
    }
  }

  // Deletar notificação
  static async deleteNotification(notificationId) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      console.log('✅ Notificação deletada:', notificationId);
    } catch (error) {
      console.error('❌ Erro ao deletar notificação:', error);
    }
  }

  // === Preferências do Usuário ===
  static normalizePreferences(preferences = {}) {
    return {
      push: preferences.push ?? true,
      email: preferences.email ?? true,
      habitReminders: preferences.habitReminders ?? true
    };
  }

  static mapPreferencesToDoc(preferences = {}) {
    return {
      ...this.normalizePreferences(preferences),
      updatedAt: serverTimestamp()
    };
  }

  static async saveUserPreferences(userId, preferences) {
    if (!userId) throw new Error('User ID é obrigatório para salvar preferências');

    const preferencesRef = doc(db, 'notification_preferences', userId);
    const preferencesDoc = {
      userId,
      ...this.mapPreferencesToDoc(preferences),
      version: 1
    };

    await setDoc(preferencesRef, preferencesDoc, { merge: true });
    return preferencesDoc;
  }

  static async getUserPreferences(userId) {
    if (!userId) throw new Error('User ID é obrigatório para buscar preferências');

    const preferencesRef = doc(db, 'notification_preferences', userId);
    const snapshot = await getDoc(preferencesRef);

    if (!snapshot.exists()) {
      return this.normalizePreferences();
    }

    return {
      push: snapshot.get('push'),
      email: snapshot.get('email'),
      habitReminders: snapshot.get('habitReminders') ?? true,
      updatedAt: snapshot.get('updatedAt')?.toDate?.() ?? null
    };
  }

  static async resetUserPreferences(userId) {
    return this.saveUserPreferences(userId, this.mapPreferencesToDoc());
  }

  // Criar notificações automáticas baseadas em eventos
  static async createWorkoutCompletedNotification(userId, workoutName) {
    return await this.createNotification(userId, {
      type: 'success',
      title: 'Treino Concluído! 🎉',
      message: `Parabéns! Você completou o treino "${workoutName}". Continue assim!`,
      category: 'workout',
      actionUrl: '/dashboard'
    });
  }

  static async createNewContentNotification(userId, contentType) {
    return await this.createNotification(userId, {
      type: 'info',
      title: 'Novo Conteúdo Disponível! 📺',
      message: `Um novo ${contentType} foi adicionado ao Team HIIT.`,
      category: 'content',
      actionUrl: '/dashboard'
    });
  }

  static async createGoalAchievedNotification(userId, goalType) {
    return await this.createNotification(userId, {
      type: 'success',
      title: 'Meta Atingida! 🏆',
      message: `Parabéns! Você atingiu sua meta de ${goalType}.`,
      category: 'achievement',
      actionUrl: '/progress'
    });
  }

  static async createReminderNotification(userId, reminderType) {
    return await this.createNotification(userId, {
      type: 'warning',
      title: 'Lembrete de Hábito ⏰',
      message: `Não esqueça de manter seu hábito em dia! ${reminderType}`,
      category: 'habit',
      actionUrl: '/dashboard'
    });
  }

  static async createLevelUpNotification(userId, newLevel) {
    return await this.createNotification(userId, {
      type: 'success',
      title: 'Nível Desbloqueado! 🚀',
      message: `Parabéns! Você alcançou o nível ${newLevel} no Team HIIT.`,
      category: 'level',
      actionUrl: '/dashboard'
    });
  }

  // Notificações de sistema
  static async createSystemNotification(userId, title, message, type = 'info') {
    return await this.createNotification(userId, {
      type: type,
      title: title,
      message: message,
      category: 'system',
      actionUrl: '/dashboard'
    });
  }

  static async broadcastAnnouncement({
    announcementId,
    title,
    message,
    highlight,
    authorName,
    imageUrls = []
  }) {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      try {
        const result = await this.createNotification(userId, {
          type: 'info',
          title: title || 'Novo anúncio na comunidade',
          message: message || highlight || 'Confira as novidades na aba de anúncios.',
          category: 'announcement',
          actionUrl: '/community?tab=announcements',
          payload: {
            announcementId: announcementId || null,
            highlight: highlight || '',
            authorName: authorName || '',
            hasImages: Array.isArray(imageUrls) && imageUrls.length > 0,
            previewImage: Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls[0] : null
          }
        });

        if (result) {
          created++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error('❌ Erro ao criar notificação de anúncio para usuário', userId, error);
        errors.push({ userId, error: error.message });
      }
    }

    return { created, skipped, errors };
  }
}

export default NotificationService;