/**
 * Funções utilitárias para o webhook da Greenn
 */

const admin = require("firebase-admin");
const {sendWelcomeEmail} = require("./email");

/**
 * Valida o webhook recebido
 * 
 * @param {Object} req - Requisição HTTP
 * @returns {Object} - {valid: boolean, error?: string}
 */
function validateWebhook(req) {
  // Verificar se há body
  if (!req.body) {
    return {
      valid: false,
      error: "Corpo da requisição vazio",
    };
  }

  // Verificar estrutura básica
  if (!req.body.type || !req.body.event) {
    return {
      valid: false,
      error: "Payload deve conter 'type' e 'event'",
    };
  }

  // Validar token do webhook (se fornecido pela Greenn)
  const webhookToken = req.headers["x-webhook-token"];
  if (webhookToken) {
    // Verificar se o token corresponde ao configurado
    const expectedToken = process.env.GREENN_WEBHOOK_TOKEN;
    
    if (expectedToken && webhookToken !== expectedToken) {
      console.warn("⚠️ [Webhook] Token inválido recebido");
      // Não bloquear por enquanto, apenas logar
    }
  }

  return {valid: true};
}

/**
 * Gera senha simples baseada no nome do usuário
 * Formato: "nome do usuário123" (sem espaços, tudo minúsculo)
 * 
 * @param {string} userName - Nome do usuário
 * @returns {string} - Senha gerada
 */
function generateRandomPassword(userName = "") {
  // Se não tiver nome, usar "usuario" como padrão
  if (!userName || userName.trim() === "") {
    userName = "usuario";
  }
  
  // Remover espaços, acentos e caracteres especiais
  // Converter para minúsculas
  let cleanName = userName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove acentos
    .replace(/[^a-z0-9]/g, ""); // Remove caracteres especiais e espaços
  
  // Se o nome limpo estiver vazio, usar "usuario"
  if (cleanName === "") {
    cleanName = "usuario";
  }
  
  // Adicionar "123" no final
  return cleanName + "123";
}

/**
 * Gera token único para criação de senha
 * 
 * @returns {string} - Token único
 */
function generatePasswordToken() {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Cria ou atualiza usuário no Firebase Authentication
 * 
 * @param {Object} client - Dados do cliente
 * @param {Object} contractData - Dados do contrato (opcional)
 * @param {Object} saleData - Dados da venda (opcional)
 * @returns {Object} - {user: UserRecord, isNew: boolean, password?: string}
 */
async function createOrUpdateUser(client, contractData = null, saleData = null) {
  const {email, name} = client;

  if (!email) {
    throw new Error("Email do cliente é obrigatório");
  }

  try {
    // Verificar se usuário já existe
    let user;
    let isNew = false;
    let password = null;

    try {
      user = await admin.auth().getUserByEmail(email);
      console.log("👤 [User] Usuário já existe:", user.uid);

      // Para usuários existentes, gerar nova senha para enviar por email
      password = generateRandomPassword(name || email.split("@")[0]);
      
      // Atualizar informações do usuário E a senha
      await admin.auth().updateUser(user.uid, {
        displayName: name || user.displayName,
        password: password, // Atualizar senha para a nova gerada
      });
      
      console.log("🔄 [User] Senha atualizada para usuário existente:", user.uid);

      // Gerar token único para login automático
      const autoLoginToken = generatePasswordToken();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // Token válido por 24 horas

      // Atualizar credenciais no Firestore
      await admin.firestore().collection("user_credentials").doc(user.uid).set({
        email,
        tempPassword: password,
        autoLoginToken: autoLoginToken,
        autoLoginTokenExpiresAt: admin.firestore.Timestamp.fromDate(tokenExpiresAt),
        sent: false,
        sentAt: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

      // Também salvar por email para facilitar busca
      await admin.firestore().collection("user_credentials").doc(email).set({
        uid: user.uid,
        email,
        tempPassword: password,
        autoLoginToken: autoLoginToken,
        autoLoginTokenExpiresAt: admin.firestore.Timestamp.fromDate(tokenExpiresAt),
        sent: false,
        sentAt: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, {merge: true});

    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // Usuário não existe, criar novo
        isNew = true;
        password = generateRandomPassword(name || email.split("@")[0]);
        console.log("🆕 [User] Criando novo usuário:", email);

        user = await admin.auth().createUser({
          email,
          password,
          displayName: name,
          emailVerified: false,
        });

        console.log("✅ [User] Usuário criado:", user.uid);

        // Gerar token único para login automático
        const autoLoginToken = generatePasswordToken();
        const tokenExpiresAt = new Date();
        tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24); // Token válido por 24 horas

        // Salvar senha temporária e token de login automático no Firestore
        await admin.firestore().collection("user_credentials").doc(user.uid).set({
          email,
          tempPassword: password,
          autoLoginToken: autoLoginToken,
          autoLoginTokenExpiresAt: admin.firestore.Timestamp.fromDate(tokenExpiresAt),
          sent: false,
          sentAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Também salvar por email para facilitar busca
        await admin.firestore().collection("user_credentials").doc(email).set({
          uid: user.uid,
          email,
          tempPassword: password,
          autoLoginToken: autoLoginToken,
          autoLoginTokenExpiresAt: admin.firestore.Timestamp.fromDate(tokenExpiresAt),
          sent: false,
          sentAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, {merge: true});
      } else {
        throw error;
      }
    }

    // Preparar dados do usuário para Firestore
    const userData = {
      uid: user.uid,
      email,
      name: name || user.displayName || "",
      cellphone: client.cellphone || "",
      cpfCnpj: client.cpf_cnpj || "",
      address: {
        street: client.street || "",
        number: client.number || "",
        complement: client.complement || "",
        neighborhood: client.neighborhood || "",
        city: client.city || "",
        uf: client.uf || "",
        zipcode: client.zipcode || "",
      },
      // Dados da Greenn (consolidados em users)
      greenNClientId: client.id || null,
      lastPurchase: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Verificar se o contrato/venda está pago
    const isPaid = (contractData?.currentStatus === "paid" || 
                    contractData?.contract?.status === "paid" ||
                    saleData?.currentStatus === "paid" ||
                    saleData?.sale?.status === "paid");

    // Adicionar dados de assinatura se houver contrato
    if (contractData) {
      userData.subscription = {
        contractId: contractData.contract?.id || contractData.contractId,
        status: contractData.contract?.status || contractData.currentStatus,
        startDate: contractData.contract?.start_date || null,
        currentPeriodEnd: contractData.contract?.current_period_end || null,
        product: contractData.product || null,
      };
    }

    // Adicionar dados de venda se houver
    if (saleData) {
      userData.sale = {
        saleId: saleData.sale?.id || saleData.saleId,
        status: saleData.sale?.status || saleData.currentStatus,
        amount: saleData.sale?.amount || saleData.product?.amount || 0,
        method: saleData.sale?.method || "",
      };
    }

    // Definir status de assinatura se estiver pago
    if (isPaid) {
      userData.isSubscriber = true;
      // BÔNUS DE LANÇAMENTO: Todos os novos assinantes ganham acesso à calculadora de calorias
      // Para desativar no futuro, mude para false
      userData.hasCalorieCalculator = true;
    } else {
      // Se não estiver pago, garantir que não é assinante
      userData.isSubscriber = false;
    }

    // Salvar/atualizar no Firestore
    await admin.firestore().collection("users").doc(user.uid).set(userData, {merge: true});

    if (isPaid) {
      const customClaims = {
        hasSubscription: true,
        subscriptionStatus: "active",
        contractId: contractData?.contract?.id || contractData?.contractId || null,
      };

      await admin.auth().setCustomUserClaims(user.uid, customClaims);
      console.log("✅ [User] Claims customizados definidos:", user.uid);
    }

    // Enviar email de boas-vindas SEMPRE que houver compra paga (novo ou existente)
    if (isPaid && password) {
      try {
        console.log("📧 [Email] Preparando envio de email para:", email, "| Novo:", isNew);
        
        // Obter URL base da variável de ambiente ou config
        const baseUrl = process.env.APP_LOGIN_URL || 
                        (typeof require !== "undefined" && 
                         require("firebase-functions").config()?.app?.login_url) ||
                        "https://app.teamhiit.com.br";

        // Buscar token de login automático
        const userCredentialDoc = await admin.firestore()
          .collection("user_credentials")
          .doc(user.uid)
          .get();
        
        const autoLoginToken = userCredentialDoc.data()?.autoLoginToken || "";
        // Usar hash router format: /#/auto-login
        const autoLoginUrl = `${baseUrl}/#/auto-login?token=${autoLoginToken}&email=${encodeURIComponent(email)}`;

        console.log("📧 [Email] Enviando email de boas-vindas...");
        const emailSent = await sendWelcomeEmail(
          email,
          name || email,
          password,
          autoLoginUrl
        );

        if (emailSent) {
          // Marcar email como enviado
          await admin.firestore().collection("user_credentials").doc(user.uid).update({
            sent: true,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          console.log("✅ [Email] Email de boas-vindas enviado:", email);
        } else {
          console.warn("⚠️ [Email] Falha ao enviar email:", email);
        }
      } catch (emailError) {
        console.error("❌ [Email] Erro ao enviar email:", emailError);
        // Não falhar o webhook se o email falhar (usuário já foi criado)
      }
    } else {
      console.log("⏭️ [Email] Email não enviado - isPaid:", isPaid, "| password:", !!password);
    }

    return {
      user,
      isNew,
      password,
    };
  } catch (error) {
    console.error("❌ [User] Erro ao criar/atualizar usuário:", error);
    throw error;
  }
}

module.exports = {
  validateWebhook,
  generateRandomPassword,
  createOrUpdateUser,
};

