/*
 * Envio manual de notificações para todos os usuários.
 *
 * Uso:
 *   node scripts/sendManualNotification.js --title "Título" --message "Mensagem" \
 *        [--category marketing] [--type info] [--sendPush]
 *
 * Requer um arquivo `serviceAccountKey.json` na raiz do projeto ou o caminho
 * informado pela variável de ambiente FIREBASE_SERVICE_ACCOUNT.
 */

const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
  : path.resolve(__dirname, '../serviceAccountKey.json');

const serviceAccount = require(serviceAccountPath);

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

console.log('🔐 Firebase apps inicializados:', admin.apps.length);

const db = admin.firestore();
const messaging = admin.messaging();

const defaultPreferences = {
  push: true,
  email: true,
  workoutReminders: true,
  achievementAlerts: true,
  weeklyReports: false,
  marketing: false,
};

function normalizePreferences(preferences = {}) {
  return {
    ...defaultPreferences,
    ...preferences,
  };
}

async function getUserPreferences(userId) {
  if (!userId) {
    return defaultPreferences;
  }

  const snapshot = await db.collection('notification_preferences').doc(userId).get();
  if (!snapshot.exists) {
    return defaultPreferences;
  }

  return normalizePreferences(snapshot.data());
}

function isNotificationAllowed(category, preferences = defaultPreferences) {
  const prefs = normalizePreferences(preferences);

  if (!prefs.push) {
    return false;
  }

  switch (category) {
    case 'workout':
    case 'reminder':
      return prefs.workoutReminders;
    case 'achievement':
    case 'level':
      return prefs.achievementAlerts;
    case 'weekly':
      return prefs.weeklyReports;
    case 'marketing':
      return prefs.marketing;
    case 'content':
      return prefs.marketing || prefs.email;
    default:
      return true;
  }
}

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  const args = {};

  rawArgs.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const key = arg.replace(/^--/, '');
      const value = rawArgs[index + 1] && !rawArgs[index + 1].startsWith('--')
        ? rawArgs[index + 1]
        : true;
      args[key] = value;
    }
  });

  return args;
}

async function main() {
  const args = parseArgs();

  const title = args.title;
  const message = args.message;
  const category = args.category || 'system';
  const type = args.type || 'info';
  const sendPush = Boolean(args.sendPush);

  if (!title || !message) {
    console.error('⚠️  Informe --title e --message.');
    process.exit(1);
  }

  console.log('📣 Enviando notificação manual');
  console.log('  → Título:', title);
  console.log('  → Mensagem:', message);
  console.log('  → Categoria:', category);
  console.log('  → Tipo:', type);
  console.log('  → Push:', sendPush ? 'sim' : 'não');

  const usersSnapshot = await db.collection('users').get();
  const tokensSnapshot = await db.collection('fcm_tokens').get();
  const tokenByUser = new Map();
  tokensSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data?.token) {
      tokenByUser.set(doc.id, data.token);
    }
  });

  const createdNotifications = [];
  const skippedByPreference = [];
  const skippedWithoutToken = [];
  const pushErrors = [];

  const batchOperations = [];
  let currentBatch = db.batch();
  let writesInBatch = 0;

  async function commitBatch() {
    if (writesInBatch === 0) return;
    await currentBatch.commit();
    batchOperations.push(writesInBatch);
    currentBatch = db.batch();
    writesInBatch = 0;
  }

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;

    try {
      const preferences = await getUserPreferences(userId);
      if (!isNotificationAllowed(category, preferences)) {
        skippedByPreference.push(userId);
        continue;
      }

      const notificationRef = db.collection('notifications').doc();
      currentBatch.set(notificationRef, {
        userId,
        title,
        message,
        category,
        type,
        bypassPreferenceCheck: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        preferencesSnapshot: normalizePreferences(preferences),
      });
      writesInBatch += 1;
      createdNotifications.push(userId);

      if (writesInBatch === 450) {
        await commitBatch();
      }

      if (sendPush) {
        const token = tokenByUser.get(userId);
        if (!token) {
          skippedWithoutToken.push(userId);
        } else {
          try {
            await messaging.send({
              token,
              notification: {
                title,
                body: message,
              },
              data: {
                category,
                type,
              },
            });
          } catch (error) {
            console.error(`❌ Erro ao enviar push para ${userId}:`, error.message);
            pushErrors.push({ userId, error: error.message });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar preferências de ${userId}:`, error.message);
    }
  }

  await commitBatch();

  console.log('✅ Notificações criadas para', createdNotifications.length, 'usuários');
  if (skippedByPreference.length) {
    console.log('⚠️ Usuários ignorados por preferência:', skippedByPreference.length);
  }
  if (sendPush && skippedWithoutToken.length) {
    console.log('⚠️ Usuários sem token push:', skippedWithoutToken.length);
  }
  if (sendPush && pushErrors.length) {
    console.log('⚠️ Erros de envio push:', pushErrors.length);
  }
}

main()
  .then(() => {
    console.log('🏁 Processo concluído');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha ao enviar notificações manuais:', error);
    process.exit(1);
  });


