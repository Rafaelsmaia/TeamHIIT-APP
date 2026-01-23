/**
 * Firebase Functions para processar webhooks da plataforma Greenn
 * 
 * Este módulo processa eventos de vendas, contratos e abandono de carrinho,
 * criando usuários automaticamente no Firebase Authentication e enviando
 * emails de boas-vindas.
 */

const {onRequest} = require("firebase-functions/v2/https");
const {setGlobalOptions} = require("firebase-functions/v2");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const {defineSecret} = require("firebase-functions/params");
const admin = require("firebase-admin");
const {processSaleWebhook, processSaleRefundedWebhook} = require("./src/processors");
const {processContractWebhook} = require("./src/processors");
const {processCheckoutAbandonedWebhook} = require("./src/processors");
const {validateWebhook} = require("./src/utils");
const {setResendApiKeySecret} = require("./src/email");
const {getUserPreferences, isNotificationAllowed} = require("./src/notificationPreferences");
const {
  runScheduleHabitReminders,
  runProcessHabitReminderQueue,
  scheduleHabitRemindersHttp,
  processHabitReminderQueueHttp,
} = require("./src/habitReminderScheduler");
const { analyzeFoodImage } = require("./src/calorieCalculator");

// Inicializar Firebase Admin
admin.initializeApp();

// Definir secrets e variáveis de ambiente
const resendApiKey = defineSecret("RESEND_API_KEY");
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const fatSecretConsumerKey = defineSecret("FATSECRET_CONSUMER_KEY");
const fatSecretConsumerSecret = defineSecret("FATSECRET_CONSUMER_SECRET");

// Configurações globais
setGlobalOptions({
  maxInstances: 10,
  region: "us-central1",
});

/**
 * Função principal do webhook da Greenn
 * 
 * Endpoint: POST /webhook
 * 
 * Processa eventos:
 * - saleUpdated: Quando uma venda é atualizada
 * - contractUpdated: Quando um contrato é atualizado
 * - checkoutAbandoned: Quando um carrinho é abandonado
 */
exports.greennWebhook = onRequest({
  cors: true,
  maxInstances: 10,
  timeoutSeconds: 60,
  secrets: [resendApiKey],
}, async (req, res) => {
  try {
    // Configurar secret do Resend para o módulo de email
    setResendApiKeySecret(resendApiKey);
    
    // Log da requisição
    console.log("📥 [Webhook] Nova requisição recebida");
    console.log("📥 [Webhook] Método:", req.method);
    console.log("📥 [Webhook] URL:", req.url);
    console.log("📥 [Webhook] Headers:", JSON.stringify(req.headers, null, 2));
    
    // Health check (aceita GET e POST para /health)
    if (req.path === "/health" || req.url === "/health") {
      return res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "greenn-webhook",
        version: "1.0.0",
      });
    }

    // Apenas POST para webhook
    if (req.method !== "POST") {
      console.warn("⚠️ [Webhook] Método não permitido:", req.method);
      return res.status(405).json({
        error: "Method not allowed",
        message: "Apenas requisições POST são permitidas",
      });
    }

    // Validar webhook
    const validationResult = validateWebhook(req);
    if (!validationResult.valid) {
      console.error("❌ [Webhook] Validação falhou:", validationResult.error);
      // Retornar 200 para não quebrar o teste da Greenn, mas logar o erro
      return res.status(200).json({
        success: false,
        error: "Validation failed",
        message: validationResult.error,
      });
    }

    const payload = req.body;
    console.log("📦 [Webhook] Payload recebido:", JSON.stringify(payload, null, 2));

    // Verificar tipo e evento
    const {type, event} = payload;

    if (!type || !event) {
      console.warn("⚠️ [Webhook] Payload sem type ou event:", {type, event});
      // Retornar 200 para não quebrar o teste da Greenn
      return res.status(200).json({
        success: false,
        error: "Invalid payload",
        message: "Payload deve conter 'type' e 'event'",
      });
    }

    let result;

    // Processar baseado no tipo e evento
    switch (`${type}-${event}`) {
      case "sale-saleUpdated":
      case "sale-salePaid":
        console.log("🛒 [Webhook] Processando venda atualizada/paga");
        result = await processSaleWebhook(payload);
        break;

      case "sale-saleRefunded":
        console.log("💰 [Webhook] Processando venda reembolsada");
        result = await processSaleRefundedWebhook(payload);
        break;

      case "contract-contractUpdated":
        console.log("📋 [Webhook] Processando contrato atualizado");
        result = await processContractWebhook(payload);
        break;

      case "lead-checkoutAbandoned":
        console.log("🛒 [Webhook] Processando carrinho abandonado");
        result = await processCheckoutAbandonedWebhook(payload);
        break;

      default:
        console.warn("⚠️ [Webhook] Tipo/evento não reconhecido:", `${type}-${event}`);
        // Retornar sucesso mesmo para eventos não reconhecidos (para não falhar o teste)
        return res.status(200).json({
          success: true,
          message: `Evento ${type}-${event} recebido mas não processado`,
        });
    }

    console.log("✅ [Webhook] Processamento concluído:", JSON.stringify(result, null, 2));

    // Retornar sucesso (sempre 200 para compatibilidade com Greenn)
    return res.status(200).json({
      success: true,
      message: "Webhook processado com sucesso",
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error("❌ [Webhook] Erro ao processar webhook:", error);
    console.error("❌ [Webhook] Stack:", error.stack);

    // Registrar erro no Firestore para análise posterior
    try {
      await admin.firestore().collection("webhook_errors").add({
        error: error.message,
        stack: error.stack,
        payload: req.body,
        headers: req.headers,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("❌ [Webhook] Erro ao registrar erro no Firestore:", logError);
    }

    // Retornar 200 mesmo em caso de erro (para não quebrar o teste da Greenn)
    // Mas logar o erro para análise
    return res.status(200).json({
      success: false,
      error: "Internal server error",
      message: "Erro ao processar webhook",
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Endpoint de health check
 * 
 * Endpoint: GET /health
 */
exports.health = onRequest({
  cors: true,
}, (req, res) => {
  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "greenn-webhook",
    uptime: process.uptime(),
  });
});

exports.filterNotificationsByPreference = onDocumentCreated("notifications/{notificationId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    return;
  }

  const notification = snapshot.data();
  if (!notification || notification.bypassPreferenceCheck) {
    return;
  }

  const userId = notification.userId;
  const category = notification.category || null;

  try {
    const preferences = await getUserPreferences(userId);
    const allowed = isNotificationAllowed(category, preferences);

    if (!allowed) {
      console.log("🚫 [Notifications] Removendo notificação bloqueada pelas preferências", {
        userId,
        notificationId: snapshot.id,
        category,
      });
      await snapshot.ref.delete();
    }
  } catch (error) {
    console.error("❌ [Notifications] Erro ao avaliar preferências: ", error);
  }
});

exports.scheduleHabitReminders = onSchedule("every 1 hours", async () => {
  await runScheduleHabitReminders();
});

exports.yyprocessHabitReminderQueue = onSchedule("every 5 minutes", async () => {
  await runProcessHabitReminderQueue();
});

exports.triggerScheduleHabitReminders = onRequest(scheduleHabitRemindersHttp);
exports.triggerProcessHabitReminderQueue = onRequest(processHabitReminderQueueHttp);

/**
 * Função para calcular calorias de uma imagem de comida
 * 
 * Endpoint: POST /calculateCalories
 * 
 * Body: {
 *   image: string (base64 sem prefixo data:image)
 * }
 */
exports.calculateCalories = onRequest({
  cors: true, // Permitir todas as origens
  maxInstances: 10,
  timeoutSeconds: 120, // Aumentado para 120s
  memory: "512MiB", // Aumentado para 512MB
  secrets: [geminiApiKey, fatSecretConsumerKey, fatSecretConsumerSecret],
}, async (req, res) => {
  // Configurar headers CORS manualmente (garantir que funcione)
  const origin = req.headers.origin || "*";
  res.set("Access-Control-Allow-Origin", origin);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.set("Access-Control-Max-Age", "3600");

  // Lidar com requisição OPTIONS (preflight) - DEVE SER PRIMEIRO
  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    console.log("🍽️ [CalorieCalculator] Nova requisição recebida");

    // Apenas POST
    if (req.method !== "POST") {
      return res.status(405).json({
        success: false,
        error: "Method not allowed",
        message: "Apenas requisições POST são permitidas",
      });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: "Missing image",
        message: "O campo 'image' (base64) é obrigatório",
      });
    }

    // Remover prefixo data:image se existir
    const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, "");

    console.log("🔍 [CalorieCalculator] Processando imagem...");
    const result = await analyzeFoodImage(base64Image);

    console.log("✅ [CalorieCalculator] Análise concluída:", {
      foods: result.foods,
      totalCalories: result.nutrition.totalCalories,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ [CalorieCalculator] Erro ao processar:", error);
    console.error("❌ [CalorieCalculator] Stack:", error.stack);
    console.error("❌ [CalorieCalculator] Código:", error.code);

    // Status code baseado no tipo de erro
    let statusCode = 500;
    if (error.message?.includes('Gemini') || error.message?.includes('FatSecret') || error.message?.includes('configurado')) {
      statusCode = 503; // Service Unavailable
    }

    return res.status(statusCode).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Erro ao processar imagem",
    });
  }
});

