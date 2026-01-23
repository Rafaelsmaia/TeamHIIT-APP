const admin = require("firebase-admin");
const {getUserPreferences} = require("./notificationPreferences");

const HABIT_QUEUE_COLLECTION = "habit_reminder_queue";
const NOTIFICATION_COLLECTION = "notifications";
const FCM_TOKEN_COLLECTION = "fcm_tokens";
const DEFAULT_TIMES = ["09:00", "12:00", "15:00", "18:00"];
const TIMEZONE = "America/Sao_Paulo";
const PROCESS_LIMIT = 50;

/**
 * Retorna instância do Firestore.
 * @return {FirebaseFirestore.Firestore} Instância do Firestore.
 */
function getFirestore() {
  return admin.firestore();
}

/**
 * Retorna instância do Cloud Messaging.
 * @return {admin.messaging.Messaging} Instância do Cloud Messaging.
 */
function getMessaging() {
  return admin.messaging();
}

/**
 * Retorna a data atual ajustada para o fuso horário configurado.
 * @return {Date} Data corrente ajustada para o fuso horário.
 */
function getTimezoneNow() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", {timeZone: TIMEZONE}));
}

/**
 * Gera um objeto Date a partir de uma base e um horário "HH:MM".
 * @param {Date} baseDate Data base utilizada como referência.
 * @param {string} timeString Horário no formato "HH:MM".
 * @return {Date|null} Data agendada ou null quando o horário é inválido.
 */
function createScheduledDate(baseDate, timeString) {
  if (!timeString || typeof timeString !== "string") {
    return null;
  }

  const [hourStr, minuteStr] = timeString.split(":");
  const hour = Number.parseInt(hourStr, 10);
  const minute = Number.parseInt(minuteStr, 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  const scheduled = new Date(baseDate.getTime());
  scheduled.setHours(hour, minute, 0, 0);
  scheduled.setMilliseconds(0);

  if (scheduled.getTime() < baseDate.getTime() - 60 * 1000) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
}

/**
 * Agenda lembretes de hábitos para todos os usuários elegíveis.
 * @return {Promise<object>} Resultado contendo a quantidade agendada.
 */
async function scheduleHabitRemindersCore() {
  const firestore = getFirestore();
  const tzNow = getTimezoneNow();
  const nowUtc = new Date();

  const prefsSnapshot = await firestore
    .collection("notification_preferences")
    .where("habitReminders", "==", true)
    .get();

  let queued = 0;
  const batch = firestore.batch();

  prefsSnapshot.forEach((docSnap) => {
    const userId = docSnap.id;
    const data = docSnap.data() || {};
    const hasCustomTimes = Array.isArray(data.habitReminderTimes) && data.habitReminderTimes.length > 0;
    const times = hasCustomTimes ? data.habitReminderTimes : DEFAULT_TIMES;

    times.forEach((timeString) => {
      const scheduledDate = createScheduledDate(tzNow, timeString);
      if (!scheduledDate) {
        return;
      }

      if (scheduledDate.getTime() < nowUtc.getTime() - 60 * 1000) {
        return;
      }

      const scheduleKey = scheduledDate.toISOString().slice(0, 10);
      const docId = `${userId}_${scheduleKey}_${timeString.replace(":", "")}`;
      const queueRef = firestore.collection(HABIT_QUEUE_COLLECTION).doc(docId);

      batch.set(queueRef, {
        userId,
        habit: data.defaultHabit || "water",
        timeslot: timeString,
        scheduleDate: scheduleKey,
        status: "pending",
        scheduledFor: admin.firestore.Timestamp.fromDate(scheduledDate),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastScheduledAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});
      queued += 1;
    });
  });

  if (queued > 0) {
    await batch.commit();
  }

  console.log("📅 [HabitReminders] Jobs agendados:", queued);
  return {queued};
}

/**
 * Processa a fila de lembretes enviados pelo agendador.
 * @return {Promise<object>} Resultado com a quantidade processada.
 */
async function processHabitReminderQueueCore() {
  const firestore = getFirestore();
  const messaging = getMessaging();
  const now = admin.firestore.Timestamp.now();
  const pendingSnapshot = await firestore
    .collection(HABIT_QUEUE_COLLECTION)
    .where("status", "==", "pending")
    .where("scheduledFor", "<=", now)
    .limit(PROCESS_LIMIT)
    .get();

  if (pendingSnapshot.empty) {
    console.log("⏱️ [HabitReminders] Nenhum job pendente.");
    return {processed: 0};
  }

  let processed = 0;
  const batch = firestore.batch();

  for (const docSnap of pendingSnapshot.docs) {
    const data = docSnap.data();
    const userId = data.userId;

    try {
      const preferences = await getUserPreferences(userId);
      if (!preferences.habitReminders) {
        batch.update(docSnap.ref, {
          status: "skipped",
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          skipReason: "habitReminders_disabled",
        });
        continue;
      }

      const notificationRef = firestore.collection(NOTIFICATION_COLLECTION).doc();
      batch.set(notificationRef, {
        userId,
        title: "Hora de beber água! 💧",
        message: "Beba um copo de água agora e mantenha seu hábito em dia.",
        type: "info",
        category: "habit",
        habit: data.habit || "water",
        actionUrl: "/dashboard",
        read: false,
        bypassPreferenceCheck: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      const tokenSnap = await firestore.collection(FCM_TOKEN_COLLECTION).doc(userId).get();
      const token = tokenSnap.exists ? tokenSnap.get("token") : null;

      if (token) {
        try {
          await messaging.send({
            token,
            notification: {
              title: "Hora de beber água! 💧",
              body: "Beba um copo de água agora e mantenha seu hábito em dia.",
            },
            data: {
              category: "habit",
              type: "info",
              actionUrl: "/dashboard",
            },
          });
        } catch (error) {
          console.error("❌ [HabitReminders] Erro ao enviar push:", error);
        }
      }

      batch.update(docSnap.ref, {
        status: "sent",
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      processed += 1;
    } catch (error) {
      console.error("❌ [HabitReminders] Erro ao processar job:", docSnap.id, error);
      batch.update(docSnap.ref, {
        status: "error",
        errorMessage: error.message,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();

  console.log("🚀 [HabitReminders] Jobs processados:", processed);
  return {processed};
}

/**
 * Handler HTTP para agendar lembretes sob demanda.
 * @param {object} req Request.
 * @param {object} res Response.
 * @return {Promise<void>} Promessa resolvida após processamento.
 */
const scheduleHabitRemindersHttp = async (req, res) => {
  try {
    const result = await scheduleHabitRemindersCore();
    res.status(200).json({success: true, ...result});
  } catch (error) {
    console.error("❌ [HabitReminders] Erro ao agendar via HTTP:", error);
    res.status(500).json({success: false, error: error.message});
  }
};

/**
 * Handler HTTP para processar a fila sob demanda.
 * @param {object} req Request.
 * @param {object} res Response.
 * @return {Promise<void>} Promessa resolvida após processamento.
 */
const processHabitReminderQueueHttp = async (req, res) => {
  try {
    const result = await processHabitReminderQueueCore();
    res.status(200).json({success: true, ...result});
  } catch (error) {
    console.error("❌ [HabitReminders] Erro ao processar via HTTP:", error);
    res.status(500).json({success: false, error: error.message});
  }
};

module.exports = {
  runScheduleHabitReminders: scheduleHabitRemindersCore,
  runProcessHabitReminderQueue: processHabitReminderQueueCore,
  scheduleHabitRemindersHttp,
  processHabitReminderQueueHttp,
};

