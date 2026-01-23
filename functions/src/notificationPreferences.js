const admin = require("firebase-admin");

const defaultPreferences = {
  push: true,
  email: true,
  habitReminders: true,
};

/**
 * Normaliza o objeto de prefer�ncias garantindo chaves padr�o.
 * @param {object} [preferences={}] Prefer�ncias fornecidas pelo usu�rio.
 * @return {object} Prefer�ncias mescladas com valores padr�o.
 */
function normalizePreferences(preferences = {}) {
  return {
    ...defaultPreferences,
    ...preferences,
  };
}

/**
 * Obt�m as prefer�ncias do usu�rio a partir do Firestore.
 * @param {string} userId ID do usu�rio.
 * @return {Promise<object>} Prefer�ncias normalizadas.
 */
async function getUserPreferences(userId) {
  if (!userId) {
    return defaultPreferences;
  }

  const snapshot = await admin.firestore()
    .collection("notification_preferences")
    .doc(userId)
    .get();

  if (!snapshot.exists) {
    return defaultPreferences;
  }

  return normalizePreferences(snapshot.data());
}

/**
 * Verifica se uma categoria de notifica��o � permitida para o usu�rio.
 * @param {string} category Categoria da notifica��o.
 * @param {object} [preferences=defaultPreferences] Prefer�ncias do usu�rio.
 * @return {boolean} Verdadeiro se a notifica��o for permitida.
 */
function isNotificationAllowed(category, preferences = defaultPreferences) {
  const prefs = normalizePreferences(preferences);

  if (!prefs.push) {
    return false;
  }

  switch (category) {
  case "habit":
  case "reminder":
    return prefs.habitReminders;
  case "content":
    return prefs.email;
  default:
    return true;
  }
}

module.exports = {
  getUserPreferences,
  isNotificationAllowed,
  normalizePreferences,
  defaultPreferences,
};
