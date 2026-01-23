import { db } from '../firebaseConfig';
import { getLocalDateString } from '../utils/dateUtils.js';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  addDoc,
  getDocs,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp
} from 'firebase/firestore';

class FirebaseSyncService {
  constructor() {
    this.userId = null;
    this.progressData = null;
    this.habitsData = null;
    this.listeners = [];
  }

  // Definir usuário atual
  setUser(userId) {
    this.userId = userId;
  }

  // Sincronização automática como Netflix - sempre usar Firebase como fonte da verdade
  async syncProgressData() {
    if (!this.userId) {
      return null;
    }

    try {
      
      // 1. Buscar dados do Firebase (fonte da verdade)
      const firebaseData = await this.getProgressData();
      
      // 2. Buscar dados do localStorage (cache local)
      const localData = this.getLocalProgressData();
      
      // 3. Mesclar dados (Firebase tem prioridade)
      const mergedData = this.mergeProgressData(firebaseData, localData);
      
      // 4. Salvar no localStorage (cache)
      if (mergedData) {
        localStorage.setItem('teamhiit_user_progress', JSON.stringify(mergedData));
        console.log('✅ [FirebaseSync] Dados sincronizados e salvos no localStorage');
      }
      
      return mergedData;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro na sincronização:', error);
      // Em caso de erro, usar dados locais
      return this.getLocalProgressData();
    }
  }

  // Mesclar dados: Firebase (prioridade) + localStorage (fallback)
  mergeProgressData(firebaseData, localData) {
    if (!firebaseData && !localData) return null;
    
    // Se só temos Firebase, usar ele
    if (!localData) return firebaseData;
    
    // Se só temos local, usar ele
    if (!firebaseData) return localData;
    
    // Se temos ambos, mesclar com Firebase tendo prioridade
    const merged = { ...localData, ...firebaseData };
    
    // Garantir que arrays sejam mesclados corretamente
    if (firebaseData.completedVideos && localData.completedVideos) {
      const firebaseVideos = new Set(firebaseData.completedVideos);
      const localVideos = new Set(localData.completedVideos);
      
      // União dos dois arrays (Firebase tem prioridade)
      merged.completedVideos = [...new Set([...firebaseVideos, ...localVideos])];
    }
    
    console.log('🔄 [FirebaseSync] Dados mesclados (Firebase + Local)');
    return merged;
  }

  // Buscar dados do localStorage
  getLocalProgressData() {
    try {
      const data = localStorage.getItem('teamhiit_user_progress');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao ler localStorage:', error);
      return null;
    }
  }

  // Normalizar dados de progresso para garantir estrutura correta
  normalizeProgressData(data) {
    if (!data) return null;

    const normalized = { ...data };

    // Garantir que completedVideos seja um array
    if (normalized.completedVideos) {
      if (Array.isArray(normalized.completedVideos)) {
        // Já é um array, manter como está
      } else if (typeof normalized.completedVideos === 'object') {
        // É um objeto, converter para array
        
        normalized.completedVideos = Object.keys(normalized.completedVideos);
      } else {
        // Tipo inesperado, inicializar como array vazio
        normalized.completedVideos = [];
      }
    } else {
      // Não existe, inicializar como array vazio
      normalized.completedVideos = [];
    }

    // Garantir que workoutDates seja um objeto
    if (!normalized.workoutDates || typeof normalized.workoutDates !== 'object') {
      normalized.workoutDates = {};
    }

    return normalized;
  }

  // Carregar progresso do usuário
  async loadProgress() {
    if (!this.userId) {
      console.warn('⚠️ [FirebaseSync] syncHabits chamado sem usuário definido. Ignorando sincronização.');
      return false;
    }

    try {
      
      // Timeout para evitar travamento
      const loadPromise = getDoc(doc(db, 'progress', this.userId));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Firestore não respondeu')), 10000)
      );
      
      const progressDoc = await Promise.race([loadPromise, timeoutPromise]);
      
      if (progressDoc.exists()) {
        this.progressData = progressDoc.data();
        // Normalizar completedVideos para garantir que seja um array
        this.progressData = this.normalizeProgressData(this.progressData);
      } else {
        // Criar documento de progresso vazio
        this.progressData = {
          completedVideos: [],
          totalTime: 0,
          lastUpdated: new Date().toISOString()
        };
        await this.saveProgress();
        console.log('📝 [FirebaseSync] Documento de progresso criado');
      }
      
      return this.progressData;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao carregar progresso do Firebase:', error);
      
      // FALLBACK: Usar dados locais se Firebase falhar
      console.log('🔄 [FirebaseSync] Usando fallback - dados locais');
      const localData = this.getLocalProgressData();
      
      if (localData) {
        this.progressData = this.normalizeProgressData(localData);
        console.log('✅ [FirebaseSync] Usando dados locais como fallback');
        return this.progressData;
      } else {
        // Criar dados vazios se não houver dados locais
        this.progressData = {
          completedVideos: [],
          totalTime: 0,
          lastUpdated: new Date().toISOString()
        };
        console.log('📝 [FirebaseSync] Criando dados vazios (sem Firebase e sem dados locais)');
        return this.progressData;
      }
    }
  }

  // Salvar progresso do usuário
  async saveProgress(progressData = null) {
    if (!this.userId) {
      console.warn('⚠️ [FirebaseSync] loadHabits chamado sem usuário definido. Retornando dados vazios.');
      return this.habitsData || {
        dailyHabits: {},
        weeklyGoals: {},
        waterHistory: {},
        sleepHistory: {},
        lastUpdated: new Date().toISOString()
      };
    }

    // Usar dados passados como parâmetro ou dados internos
    const dataToSave = progressData || this.progressData;
    if (!dataToSave) {
      throw new Error('Dados de progresso não definidos');
    }

    try {
      console.log(`💾 [FirebaseSync] Tentando salvar progresso no Firebase para usuário: ${this.userId}`, {
        completedVideos: dataToSave.completedVideos?.length || 0,
        hasWorkoutDates: !!dataToSave.workoutDates
      });
      
      // Normalizar dados antes de salvar
      const normalizedData = this.normalizeProgressData(dataToSave);
      normalizedData.lastUpdated = new Date().toISOString();
      
      // Timeout para evitar travamento
      const savePromise = setDoc(doc(db, 'progress', this.userId), normalizedData, { merge: true });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Firestore não respondeu')), 10000)
      );
      
      await Promise.race([savePromise, timeoutPromise]);
      
      // Atualizar dados internos
      this.progressData = normalizedData;
      
      console.log('✅ [FirebaseSync] Progresso salvo no Firebase com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao salvar progresso no Firebase:', error);
      
      // FALLBACK: Salvar localmente se Firebase falhar
      console.log('🔄 [FirebaseSync] Usando fallback - salvando localmente');
      try {
        const normalizedData = this.normalizeProgressData(dataToSave);
        normalizedData.lastUpdated = new Date().toISOString();
        
        // Salvar no localStorage como fallback
        localStorage.setItem('teamhiit_user_progress', JSON.stringify(normalizedData));
        
        // Atualizar dados internos
        this.progressData = normalizedData;
        
        console.log('✅ [FirebaseSync] Progresso salvo localmente (fallback)');
        return true;
      } catch (localError) {
        console.error('❌ [FirebaseSync] Erro ao salvar localmente:', localError);
        throw new Error('Não foi possível salvar os dados nem no Firebase nem localmente');
      }
    }
  }

  // Carregar hábitos do usuário
  async loadHabits() {
    if (!this.userId) {
      throw new Error('Usuário não definido');
    }

    try {
      
      // Timeout para evitar travamento
      const loadPromise = getDoc(doc(db, 'habits', this.userId));
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: Firestore não respondeu')), 10000)
      );
      
      const habitsDoc = await Promise.race([loadPromise, timeoutPromise]);
      
      if (habitsDoc.exists()) {
        this.habitsData = habitsDoc.data();
        
        // NÃO salvar diretamente no localStorage aqui - o useHabitSync gerencia isso
        // com chaves específicas por usuário para evitar compartilhamento de dados
        
      } else {
        // Criar documento de hábitos vazio
        this.habitsData = {
          dailyHabits: {},
          weeklyGoals: {},
          waterHistory: {},
          sleepHistory: {},
          lastUpdated: new Date().toISOString()
        };
        await this.saveHabits();
        console.log('📝 [FirebaseSync] Documento de hábitos criado');
      }
      
      return this.habitsData;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao carregar hábitos do Firebase:', error);
      
      // FALLBACK: Usar dados locais se Firebase falhar
      console.log('🔄 [FirebaseSync] Usando fallback para hábitos - dados locais');
      try {
        const localHabits = localStorage.getItem('teamhiit_user_habits');
        if (localHabits) {
          this.habitsData = JSON.parse(localHabits);
          console.log('✅ [FirebaseSync] Usando hábitos locais como fallback');
          return this.habitsData;
        }
      } catch (localError) {
        console.error('❌ [FirebaseSync] Erro ao carregar hábitos locais:', localError);
      }
      
      // Criar dados vazios se não houver dados locais
      this.habitsData = {
        dailyHabits: {},
        weeklyGoals: {},
        waterHistory: {},
        sleepHistory: {},
        lastUpdated: new Date().toISOString()
      };
      console.log('📝 [FirebaseSync] Criando hábitos vazios (sem Firebase e sem dados locais)');
      return this.habitsData;
    }
  }

  // Salvar hábitos do usuário
  async saveHabits() {
    if (!this.userId || !this.habitsData) {
      throw new Error('Usuário ou dados de hábitos não definidos');
    }

    try {
      this.habitsData.lastUpdated = new Date().toISOString();
      
      await setDoc(doc(db, 'habits', this.userId), this.habitsData, { merge: true });
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao salvar hábitos:', error);
      throw error;
    }
  }

  // Marcar vídeo como concluído
  async markVideoCompleted(videoId, duration = 0) {
    if (!this.progressData) {
      await this.loadProgress();
    }

    try {
      console.log(`✅ [FirebaseSync] Marcando vídeo como concluído: ${videoId}`);
      
      this.progressData.completedVideos[videoId] = {
        completedAt: new Date().toISOString(),
        duration: duration
      };
      
      // Atualizar tempo total
      this.progressData.totalTime = (this.progressData.totalTime || 0) + duration;
      
      await this.saveProgress();
      console.log('✅ [FirebaseSync] Vídeo marcado como concluído');
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao marcar vídeo como concluído:', error);
      throw error;
    }
  }

  // Verificar se vídeo foi concluído
  isVideoCompleted(videoId) {
    return this.progressData?.completedVideos?.[videoId] || false;
  }

  // Atualizar hábito diário
  async updateDailyHabit(habitId, value) {
    if (!this.habitsData) {
      await this.loadHabits();
    }

    try {
      console.log(`📋 [FirebaseSync] Atualizando hábito diário: ${habitId} = ${value}`);
      
      const today = getLocalDateString(); // YYYY-MM-DD
      
      if (!this.habitsData.dailyHabits[today]) {
        this.habitsData.dailyHabits[today] = {};
      }
      
      this.habitsData.dailyHabits[today][habitId] = value;
      
      await this.saveHabits();
      console.log('✅ [FirebaseSync] Hábito diário atualizado');
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao atualizar hábito diário:', error);
      throw error;
    }
  }

  // Obter dados de progresso
  getProgressData() {
    return this.progressData;
  }

  // Obter dados de hábitos
  getHabitsData() {
    return this.habitsData;
  }

  // Configurar listener em tempo real para progresso
  setupProgressListener(callback) {
    if (!this.userId) {
      throw new Error('Usuário não definido');
    }

    const progressRef = doc(db, 'progress', this.userId);
    const unsubscribe = onSnapshot(progressRef, (doc) => {
      if (doc.exists()) {
        this.progressData = doc.data();
        console.log('🔄 [FirebaseSync] Progresso atualizado em tempo real');
        if (callback) callback(this.progressData);
      }
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Configurar listener em tempo real para hábitos
  setupHabitsListener(callback) {
    if (!this.userId) {
      throw new Error('Usuário não definido');
    }

    const habitsRef = doc(db, 'habits', this.userId);
    const unsubscribe = onSnapshot(habitsRef, (doc) => {
      if (doc.exists()) {
        this.habitsData = doc.data();
        console.log('🔄 [FirebaseSync] Hábitos atualizados em tempo real');
        if (callback) callback(this.habitsData);
      }
    });

    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // Limpar todos os listeners
  cleanup() {
    console.log('🧹 [FirebaseSync] Limpando listeners');
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners = [];
    this.userId = null;
    this.progressData = null;
    this.habitsData = null;
  }

  // Sincronizar progresso com Firebase
  async syncProgress(progressData) {
    if (!this.userId) {
      throw new Error('Usuário não definido');
    }

    try {
      console.log('🔄 [FirebaseSync] Sincronizando progresso com Firebase', {
        completedVideos: progressData?.completedVideos?.length || 0
      });
      
      // Fazer merge com dados existentes se houver
      let mergedData = progressData;
      if (this.progressData) {
        mergedData = this.mergeProgressData(this.progressData, progressData);
      }
      
      // Salvar dados mesclados
      await this.saveProgress(mergedData);
      console.log('✅ [FirebaseSync] Progresso sincronizado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao sincronizar progresso:', error);
      return false;
    }
  }

  // Sincronizar hábitos com Firebase
  async syncHabits(habitsData) {
    if (!this.userId) {
      throw new Error('Usuário não definido');
    }

    try {
      
      // Fazer merge com dados existentes se houver
      if (this.habitsData) {
        this.habitsData = this.mergeHabitsData(this.habitsData, habitsData);
      } else {
        this.habitsData = habitsData;
      }
      
      await this.saveHabits();
      return true;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao sincronizar hábitos:', error);
      return false;
    }
  }

  // Fazer merge de dados de progresso
  mergeProgressData(existingData, newData) {
    console.log('🔄 [FirebaseSync] Fazendo merge de dados de progresso:', {
      existing: existingData?.completedVideos,
      new: newData?.completedVideos
    });
    
    // Garantir que completedVideos seja sempre um array
    const existingVideos = Array.isArray(existingData.completedVideos) 
      ? existingData.completedVideos 
      : [];
    const newVideos = Array.isArray(newData.completedVideos) 
      ? newData.completedVideos 
      : [];
    
    // Combinar arrays e remover duplicatas
    const combinedVideos = [...new Set([...existingVideos, ...newVideos])];
    
    console.log('🔄 [FirebaseSync] Videos combinados:', {
      existing: existingVideos,
      new: newVideos,
      combined: combinedVideos
    });
    
    const merged = {
      ...existingData,
      ...newData,
      completedVideos: combinedVideos
    };

    // Somar tempo total se ambos tiverem
    if (existingData.totalTime && newData.totalTime) {
      merged.totalTime = Math.max(existingData.totalTime, newData.totalTime);
    }

    merged.lastUpdated = new Date().toISOString();
    return merged;
  }

  // Fazer merge de dados de hábitos
  mergeHabitsData(existingData, newData) {
    console.log('🔄 [FirebaseSync] Fazendo merge de dados de hábitos');
    
    const merged = {
      ...existingData,
      ...newData,
      dailyHabits: {
        ...existingData.dailyHabits,
        ...newData.dailyHabits
      },
      weeklyGoals: {
        ...existingData.weeklyGoals,
        ...newData.weeklyGoals
      },
      // Preservar waterHistory fazendo merge correto
      waterHistory: {
        ...existingData.waterHistory,
        ...newData.waterHistory
      },
      // Preservar sleepHistory fazendo merge correto
      sleepHistory: {
        ...existingData.sleepHistory,
        ...newData.sleepHistory
      },
      // Preservar outros campos importantes
      sleepHours: newData.sleepHours !== undefined ? newData.sleepHours : existingData.sleepHours,
      waterIntake: newData.waterIntake !== undefined ? newData.waterIntake : existingData.waterIntake
    };

    merged.lastUpdated = new Date().toISOString();
    return merged;
  }

  // Método genérico para merge (usado pelo ProgressManager)
  mergeData(localData, firebaseData) {
    console.log('🔄 [FirebaseSync] Fazendo merge genérico de dados:', {
      local: localData?.completedVideos?.length || 0,
      firebase: firebaseData?.completedVideos?.length || 0
    });
    
    if (!localData && !firebaseData) return null;
    if (!localData) return this.normalizeProgressData(firebaseData);
    if (!firebaseData) return this.normalizeProgressData(localData);

    // Normalizar ambos os dados antes do merge
    const normalizedLocal = this.normalizeProgressData(localData);
    const normalizedFirebase = this.normalizeProgressData(firebaseData);

    // PRIORIDADE: localStorage tem precedência sobre Firebase
    // Para dados de progresso, sempre priorizar dados locais (mais recentes)
    if (normalizedLocal.completedVideos || normalizedFirebase.completedVideos) {
      console.log('🔄 [FirebaseSync] Priorizando dados locais sobre Firebase');
      return this.mergeProgressData(normalizedLocal, normalizedFirebase); // LOCAL primeiro
    }

    // Para dados de hábitos
    if (normalizedLocal.dailyHabits || normalizedFirebase.dailyHabits) {
      return this.mergeHabitsData(normalizedLocal, normalizedFirebase); // LOCAL primeiro
    }

    // Merge genérico - priorizar dados locais
    return {
      ...normalizedFirebase,
      ...normalizedLocal, // LOCAL sobrescreve Firebase
      lastUpdated: new Date().toISOString()
    };
  }

  // Limpar dados corrompidos do Firebase
  async cleanCorruptedFirebaseData() {
    try {
      
      if (!this.progressData) {
        await this.loadProgress();
      }
      
      if (this.progressData && this.progressData.completedVideos) {
        const originalLength = this.progressData.completedVideos.length;
        
        // Limpar dados corrompidos
        this.progressData.completedVideos = this.progressData.completedVideos.filter(key => {
          if (key.endsWith('-default-default')) {
            console.log('🧹 [FirebaseSync] Removendo chave corrompida do Firebase:', key);
            return false;
          }
          if (/^\d+$/.test(key)) {
            console.log('🧹 [FirebaseSync] Removendo chave numérica do Firebase:', key);
            return false;
          }
          return true;
        });
        
        const cleanedCount = originalLength - this.progressData.completedVideos.length;
        
        if (cleanedCount > 0) {
          console.log('🧹 [FirebaseSync] Dados corrompidos removidos do Firebase:', cleanedCount);
          await this.saveProgress();
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao limpar dados corrompidos do Firebase:', error);
      return false;
    }
  }

  // ===== SISTEMA DE HISTÓRICO DE TREINOS =====
  
  // Armazenar treino no histórico com timestamp
  async addWorkoutToHistory(trainingId, moduleId, videoId, calories, duration) {
    if (!this.userId) {
      console.warn('⚠️ [FirebaseSync] Usuário não definido para adicionar treino ao histórico');
      return false;
    }

    try {
      const workoutData = {
        userId: this.userId,
        trainingId,
        moduleId,
        videoId,
        calories: calories || 0,
        duration: duration || 0,
        completedAt: Timestamp.now(),
        date: getLocalDateString(), // YYYY-MM-DD para facilitar consultas
      };

      const historyRef = collection(db, 'workoutHistory');
      await addDoc(historyRef, workoutData);
      
      console.log('✅ [FirebaseSync] Treino adicionado ao histórico:', workoutData);
      
      // Limpar dados antigos automaticamente
      await this.cleanOldWorkoutHistory();
      
      return true;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao adicionar treino ao histórico:', error);
      return false;
    }
  }

  // Buscar treinos por data específica
  async getWorkoutsByDate(date) {
    if (!this.userId) {
      return [];
    }

    try {
      const historyRef = collection(db, 'workoutHistory');
      const q = query(
        historyRef,
        where('userId', '==', this.userId),
        where('date', '==', date)
      );

      const querySnapshot = await getDocs(q);
      const workouts = [];

      querySnapshot.forEach((doc) => {
        workouts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return workouts;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao buscar treinos por data:', error);
      return [];
    }
  }

  // Buscar treinos dos últimos N dias
  async getRecentWorkouts(days = 7) {
    if (!this.userId) {
      return [];
    }

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateString = getLocalDateString(startDate);

      const historyRef = collection(db, 'workoutHistory');
      const q = query(
        historyRef,
        where('userId', '==', this.userId),
        where('date', '>=', startDateString),
        orderBy('date', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const workouts = [];

      querySnapshot.forEach((doc) => {
        workouts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return workouts;
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao buscar treinos recentes:', error);
      return [];
    }
  }

  // Limpar dados antigos (janela deslizante de 6 meses)
  async cleanOldWorkoutHistory() {
    if (!this.userId) {
      return;
    }

    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const cutoffDate = getLocalDateString(sixMonthsAgo);

      console.log('🧹 [FirebaseSync] Limpando dados antigos anteriores a:', cutoffDate);

      const historyRef = collection(db, 'workoutHistory');
      const q = query(
        historyRef,
        where('userId', '==', this.userId),
        where('date', '<', cutoffDate)
      );

      const querySnapshot = await getDocs(q);
      const deletePromises = [];

      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);

      if (deletePromises.length > 0) {
        console.log(`✅ [FirebaseSync] ${deletePromises.length} registros antigos removidos`);
      }
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro ao limpar dados antigos:', error);
    }
  }

  // Obter calorias totais por data
  async getCaloriesByDate(date) {
    const workouts = await this.getWorkoutsByDate(date);
    return workouts.reduce((total, workout) => total + (workout.calories || 0), 0);
  }

  // Obter calorias dos últimos N dias
  async getCaloriesByDateRange(days = 7) {
    const workouts = await this.getRecentWorkouts(days);
    const caloriesByDate = {};

    workouts.forEach(workout => {
      const date = workout.date;
      if (!caloriesByDate[date]) {
        caloriesByDate[date] = 0;
      }
      caloriesByDate[date] += workout.calories || 0;
    });

    return caloriesByDate;
  }

  // Obter tempo total por data
  async getDurationByDate(date) {
    const workouts = await this.getWorkoutsByDate(date);
    return workouts.reduce((total, workout) => total + (workout.duration || 0), 0);
  }

  // Obter tempo dos últimos N dias
  async getDurationByDateRange(days = 7) {
    const workouts = await this.getRecentWorkouts(days);
    const durationByDate = {};

    workouts.forEach(workout => {
      const date = workout.date;
      if (!durationByDate[date]) {
        durationByDate[date] = 0;
      }
      durationByDate[date] += workout.duration || 0;
    });

    return durationByDate;
  }

  // Sincronizar todos os dados
  async syncAll() {
    try {
      console.log('🔄 [FirebaseSync] Iniciando sincronização completa');
      
      // Limpar dados corrompidos primeiro
      await this.cleanCorruptedFirebaseData();
      
      await Promise.all([
        this.loadProgress(),
        this.loadHabits()
      ]);
      
      console.log('✅ [FirebaseSync] Sincronização completa finalizada');
    } catch (error) {
      console.error('❌ [FirebaseSync] Erro na sincronização completa:', error);
      throw error;
    }
  }
}

// Exportar instância única (singleton)
const firebaseSyncService = new FirebaseSyncService();
export default firebaseSyncService;
