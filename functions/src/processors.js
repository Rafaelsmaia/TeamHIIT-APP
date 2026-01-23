/**
 * Processadores de eventos do webhook da Greenn
 */

const admin = require("firebase-admin");
const {createOrUpdateUser} = require("./utils");

/**
 * Processa evento de venda reembolsada
 * Remove acesso do usuário (define isSubscriber: false)
 *
 * @param {Object} data - Dados do webhook
 * @returns {Object} - Resultado do processamento
 */
async function processSaleRefundedWebhook(data) {
  console.log("💰 [Refund] Processando reembolso:", data.sale?.id);

  const saleId = data.sale?.id || `sale_${Date.now()}`;

  // Atualizar status da venda no Firestore
  const saleData = {
    saleId: data.sale?.id,
    status: data.currentStatus || data.sale?.status || "refunded",
    amount: data.sale?.amount || 0,
    method: data.sale?.method || "",
    refundedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await admin.firestore().collection("sales").doc(saleId.toString()).set(saleData, {merge: true});
  console.log("✅ [Refund] Venda reembolsada salva no Firestore:", saleId);

  // Remover acesso do usuário se houver cliente com email
  if (data.client?.email) {
    try {
      // Buscar usuário pelo email
      const userRecord = await admin.auth().getUserByEmail(data.client.email);
      
      // Atualizar Firestore para remover acesso
      await admin.firestore().collection("users").doc(userRecord.uid).update({
        isSubscriber: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Remover claims customizados
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        hasSubscription: false,
        subscriptionStatus: "inactive",
      });

      console.log("✅ [Refund] Acesso removido do usuário:", userRecord.uid);

      return {
        success: true,
        saleId,
        userId: userRecord.uid,
        message: "Reembolso processado - acesso removido",
      };
    } catch (userError) {
      if (userError.code === "auth/user-not-found") {
        console.log("⚠️ [Refund] Usuário não encontrado para email:", data.client.email);
        return {
          success: true,
          saleId,
          message: "Reembolso processado - usuário não encontrado",
        };
      }
      console.error("❌ [Refund] Erro ao processar reembolso:", userError);
      return {
        success: true,
        saleId,
        error: userError?.message || "Erro ao processar reembolso",
      };
    }
  }

  return {
    success: true,
    saleId,
    message: "Reembolso processado (sem email do cliente)",
  };
}

/**
 * Processa evento de venda atualizada
 * 
 * @param {Object} data - Dados do webhook
 * @returns {Object} - Resultado do processamento
 */
async function processSaleWebhook(data) {
  console.log("🛒 [Sale] Processando venda:", data.sale?.id);

  const saleId = data.sale?.id || `sale_${Date.now()}`;

  // Salvar venda no Firestore
  const saleData = {
    saleId: data.sale?.id,
    status: data.currentStatus || data.sale?.status,
    amount: data.sale?.amount || data.product?.amount || 0,
    method: data.sale?.method || "",
    installments: data.sale?.installments || 1,
    type: data.sale?.type || data.product?.type || "",
    greenNClientId: data.client?.id, // ID do cliente na Greenn (para referência)
    sellerId: data.seller?.id,
    coupon: data.sale?.coupon || null,
    product: {
      id: data.product?.id,
      name: data.product?.name,
      amount: data.product?.amount,
      type: data.product?.type,
      method: data.product?.method,
    },
    client: {
      id: data.client?.id,
      name: data.client?.name,
      email: data.client?.email,
      cellphone: data.client?.cellphone,
    },
    createdAt: data.sale?.created_at ? 
      admin.firestore.Timestamp.fromDate(new Date(data.sale.created_at)) : 
      admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: data.sale?.updated_at ?
      admin.firestore.Timestamp.fromDate(new Date(data.sale.updated_at)) :
      admin.firestore.FieldValue.serverTimestamp(),
  };

  // Se status for 'paid' e produto for 'SUBSCRIPTION', criar usuário primeiro
  let userId = null;
  let userCreated = false;
  if ((data.currentStatus === "paid" || data.sale?.status === "paid") &&
      (data.product?.type === "SUBSCRIPTION" || data.sale?.type === "SUBSCRIPTION")) {
    console.log("💳 [Sale] Venda paga detectada, criando usuário...");
    
    try {
      const userResult = await createOrUpdateUser(data.client, null, data);
      userId = userResult.user.uid;
      userCreated = userResult.isNew;
      console.log("✅ [Sale] Usuário criado/atualizado:", userId, "| Novo:", userCreated);
    } catch (userError) {
      console.error("❌ [Sale] Erro ao criar usuário:", userError);
      // Continuar mesmo se falhar (venda será salva sem userId)
    }
  }

  // Adicionar userId à venda se o usuário foi criado
  if (userId) {
    saleData.userId = userId;
  }

  await admin.firestore().collection("sales").doc(saleId.toString()).set(saleData, {merge: true});
  console.log("✅ [Sale] Venda salva no Firestore:", saleId);

  if (userId) {
    return {
      success: true,
      saleId,
      userId,
      userCreated,
    };
  }

  return {
    success: true,
    saleId,
    message: "Venda processada (não é assinatura paga ou usuário não foi criado)",
  };
}

/**
 * Processa evento de contrato atualizado
 * 
 * @param {Object} data - Dados do webhook
 * @returns {Object} - Resultado do processamento
 */
async function processContractWebhook(data) {
  console.log("📋 [Contract] Processando contrato:", data.contract?.id);

  const contractId = data.contract?.id || `contract_${Date.now()}`;

  // Salvar contrato no Firestore
  const contractData = {
    contractId: data.contract?.id,
    status: data.currentStatus || data.contract?.status,
    startDate: data.contract?.start_date ?
      admin.firestore.Timestamp.fromDate(new Date(data.contract.start_date)) :
      null,
    currentPeriodEnd: data.contract?.current_period_end ?
      admin.firestore.Timestamp.fromDate(new Date(data.contract.current_period_end)) :
      null,
    product: {
      id: data.product?.id,
      name: data.product?.name,
      amount: data.product?.amount,
      type: data.product?.type,
    },
    currentSale: {
      id: data.currentSale?.id,
      status: data.currentSale?.status,
      amount: data.currentSale?.amount,
      method: data.currentSale?.method,
      coupon: data.currentSale?.coupon || null,
    },
    greenNClientId: data.client?.id, // ID do cliente na Greenn (para referência)
    client: {
      id: data.client?.id,
      name: data.client?.name,
      email: data.client?.email,
      cellphone: data.client?.cellphone,
    },
    createdAt: data.contract?.created_at ?
      admin.firestore.Timestamp.fromDate(new Date(data.contract.created_at)) :
      admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: data.contract?.updated_at ?
      admin.firestore.Timestamp.fromDate(new Date(data.contract.updated_at)) :
      admin.firestore.FieldValue.serverTimestamp(),
  };

  // Se status for 'paid', criar/atualizar usuário primeiro
  let userId = null;
  let userCreated = false;
  if (data.currentStatus === "paid" || data.contract?.status === "paid") {
    console.log("💳 [Contract] Contrato pago detectado, criando/atualizando usuário...");
    
    try {
      const userResult = await createOrUpdateUser(data.client, data, null);
      userId = userResult.user.uid;
      userCreated = userResult.isNew;
      console.log("✅ [Contract] Usuário criado/atualizado:", userId);
    } catch (userError) {
      console.error("❌ [Contract] Erro ao criar usuário:", userError);
      // Continuar mesmo se falhar (contrato será salvo sem userId)
    }
  }

  // Se status for 'canceled', 'cancelled', 'expired' ou 'inactive', remover acesso do usuário
  const cancelStatuses = ["canceled", "cancelled", "expired", "inactive", "refunded"];
  const currentStatus = (data.currentStatus || data.contract?.status || "").toLowerCase();
  
  if (cancelStatuses.includes(currentStatus) && data.client?.email) {
    console.log("🚫 [Contract] Contrato cancelado/expirado, removendo acesso...");
    
    try {
      const userRecord = await admin.auth().getUserByEmail(data.client.email);
      userId = userRecord.uid;
      
      // Remover acesso no Firestore
      await admin.firestore().collection("users").doc(userRecord.uid).update({
        isSubscriber: false,
        subscriptionStatus: "inactive",
        canceledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      // Atualizar claims
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        hasSubscription: false,
        subscriptionStatus: "inactive",
      });
      
      console.log("✅ [Contract] Acesso removido para:", data.client.email);
    } catch (cancelError) {
      console.error("❌ [Contract] Erro ao remover acesso:", cancelError.message);
    }
  }

  // Adicionar userId ao contrato se o usuário foi criado
  if (userId) {
    contractData.userId = userId;
  }

  await admin.firestore().collection("contracts").doc(contractId.toString()).set(contractData, {merge: true});
  console.log("✅ [Contract] Contrato salvo no Firestore:", contractId);

  if (userId) {
    return {
      success: true,
      contractId,
      userId,
      userCreated,
      emailSent: userCreated,
    };
  }

  return {
    success: true,
    contractId,
    message: "Contrato processado (não está pago)",
  };
}

/**
 * Processa evento de carrinho abandonado
 * 
 * @param {Object} data - Dados do webhook
 * @returns {Object} - Resultado do processamento
 */
async function processCheckoutAbandonedWebhook(data) {
  console.log("🛒 [Abandoned] Processando carrinho abandonado:", data.lead?.id);

  const leadId = data.lead?.id || `lead_${Date.now()}`;
  const cartId = `cart_${Date.now()}`;

  // Salvar carrinho abandonado
  const cartData = {
    leadId: data.lead?.id,
    step: data.lead?.step || 0,
    product: {
      id: data.product?.id,
      name: data.product?.name,
      amount: data.product?.amount,
    },
    client: {
      name: data.lead?.name,
      email: data.lead?.email,
      cellphone: data.lead?.cellphone,
      cpfCnpj: data.lead?.cpf_cnpj || "",
      city: data.lead?.city || "",
      street: data.lead?.street || "",
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await admin.firestore().collection("abandoned_carts").doc(cartId).set(cartData, {merge: true});
  console.log("✅ [Abandoned] Carrinho abandonado salvo:", cartId);

  // Salvar como lead
  const leadData = {
    id: data.lead?.id,
    name: data.lead?.name,
    email: data.lead?.email,
    cellphone: data.lead?.cellphone,
    cpfCnpj: data.lead?.cpf_cnpj || "",
    city: data.lead?.city || "",
    street: data.lead?.street || "",
    step: data.lead?.step || 0,
    source: "checkout_abandoned",
    productId: data.product?.id,
    productName: data.product?.name,
    productAmount: data.product?.amount,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await admin.firestore().collection("leads").doc(leadId.toString()).set(leadData, {merge: true});
  console.log("✅ [Lead] Lead salvo:", leadId);

  return {
    success: true,
    leadId,
    cartId,
    message: "Carrinho abandonado processado",
  };
}

module.exports = {
  processSaleWebhook,
  processSaleRefundedWebhook,
  processContractWebhook,
  processCheckoutAbandonedWebhook,
};

