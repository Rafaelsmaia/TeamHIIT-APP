// Exemplo de como usar o sistema de notificações
// Este arquivo mostra como integrar notificações em diferentes partes do app

import NotificationService from '../services/NotificationService';
import { getAuth } from 'firebase/auth';

// Exemplo 1: Quando um treino é concluído
export const handleWorkoutCompleted = async (workoutName) => {
  const auth = getAuth();
  if (auth.currentUser) {
    try {
      await NotificationService.createWorkoutCompletedNotification(
        auth.currentUser.uid, 
        workoutName
      );
      console.log('✅ Notificação de treino concluído criada');
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
    }
  }
};

// Exemplo 2: Quando novo conteúdo é adicionado
export const handleNewContentAdded = async (contentType) => {
  const auth = getAuth();
  if (auth.currentUser) {
    try {
      await NotificationService.createNewContentNotification(
        auth.currentUser.uid, 
        contentType
      );
      console.log('✅ Notificação de novo conteúdo criada');
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
    }
  }
};

// Exemplo 3: Quando uma meta é atingida
export const handleGoalAchieved = async (goalType) => {
  const auth = getAuth();
  if (auth.currentUser) {
    try {
      await NotificationService.createGoalAchievedNotification(
        auth.currentUser.uid, 
        goalType
      );
      console.log('✅ Notificação de meta atingida criada');
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
    }
  }
};

// Exemplo 4: Lembrete de treino
export const handleWorkoutReminder = async (reminderType) => {
  const auth = getAuth();
  if (auth.currentUser) {
    try {
      await NotificationService.createReminderNotification(
        auth.currentUser.uid, 
        reminderType
      );
      console.log('✅ Notificação de lembrete criada');
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
    }
  }
};

// Exemplo 5: Nível desbloqueado
export const handleLevelUp = async (newLevel) => {
  const auth = getAuth();
  if (auth.currentUser) {
    try {
      await NotificationService.createLevelUpNotification(
        auth.currentUser.uid, 
        newLevel
      );
      console.log('✅ Notificação de nível criada');
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
    }
  }
};

// Exemplo 6: Notificação personalizada
export const handleCustomNotification = async (title, message, type = 'info') => {
  const auth = getAuth();
  if (auth.currentUser) {
    try {
      await NotificationService.createSystemNotification(
        auth.currentUser.uid, 
        title, 
        message, 
        type
      );
      console.log('✅ Notificação personalizada criada');
    } catch (error) {
      console.error('❌ Erro ao criar notificação:', error);
    }
  }
};

// Exemplo de uso no VideoPlayer quando vídeo é concluído:
/*
// No VideoPlayerDedicated.jsx ou VideoPlayer.jsx
import { handleWorkoutCompleted } from '../utils/notificationHelpers';

const handleVideoComplete = async () => {
  // ... lógica existente ...
  
  // Criar notificação
  await handleWorkoutCompleted(training.name || 'Treino HIIT');
};
*/

// Exemplo de uso no Dashboard quando meta é atingida:
/*
// No Dashboard.jsx
import { handleGoalAchieved } from '../utils/notificationHelpers';

const checkWeeklyGoal = async () => {
  if (weeklyWorkouts >= 5) {
    await handleGoalAchieved('5 treinos semanais');
  }
};
*/
























