/**
 * Script para enviar email de boas-vindas manualmente
 * 
 * Uso:
 *   node send-email-manually.js <email> <nome>
 * 
 * Exemplo:
 *   node send-email-manually.js usuario@exemplo.com "João Silva"
 * 
 * Requisitos:
 *   - Variáveis de ambiente configuradas (RESEND_API_KEY, RESEND_FROM_EMAIL, APP_LOGIN_URL)
 *   - Firebase Admin SDK configurado (via GOOGLE_APPLICATION_CREDENTIALS ou service account)
 */

require("dotenv").config();
const admin = require("firebase-admin");
const {createOrUpdateUser} = require("./src/utils");

// Inicializar Firebase Admin
// Tenta usar credenciais de várias formas
if (!admin.apps.length) {
  try {
    // Opção 1: Variável de ambiente GOOGLE_APPLICATION_CREDENTIALS
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin inicializado via GOOGLE_APPLICATION_CREDENTIALS");
    } 
    // Opção 2: Arquivo serviceAccount.json na pasta functions
    else if (require("fs").existsSync("./serviceAccount.json")) {
      const serviceAccount = require("./serviceAccount.json");
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase Admin inicializado via serviceAccount.json");
    }
    // Opção 3: Usar Application Default Credentials (gcloud auth application-default login)
    else {
      admin.initializeApp();
      console.log("✅ Firebase Admin inicializado via Application Default Credentials");
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:", error.message);
    console.error("\n💡 Dicas:");
    console.error("   1. Configure GOOGLE_APPLICATION_CREDENTIALS apontando para o arquivo de credenciais");
    console.error("   2. Ou coloque serviceAccount.json na pasta functions");
    console.error("   3. Ou execute: gcloud auth application-default login");
    process.exit(1);
  }
}

// Configurar variáveis de ambiente para o módulo de email
const resendApiKey = process.env.RESEND_API_KEY || "";
process.env.RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@teamhiit.com.br";
process.env.APP_LOGIN_URL = process.env.APP_LOGIN_URL || "https://app.teamhiit.com.br";

// Validar variáveis necessárias
if (!resendApiKey) {
  console.error("❌ Erro: RESEND_API_KEY não configurada");
  console.error("💡 Configure no arquivo .env ou como variável de ambiente");
  console.error("💡 Exemplo: RESEND_API_KEY=re_sua_chave_aqui");
  process.exit(1);
}

// Configurar o módulo de email (simular o que a Cloud Function faz)
// Como estamos em ambiente local, vamos passar diretamente via process.env
// O módulo de email já lê de process.env quando resendApiKeySecret não está definido

// Obter argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("❌ Uso incorreto!");
  console.error("\n📖 Uso:");
  console.error("   node send-email-manually.js <email> <nome>");
  console.error("\n📝 Exemplo:");
  console.error('   node send-email-manually.js usuario@exemplo.com "João Silva"');
  process.exit(1);
}

const [email, name] = args;

// Validar email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error(`❌ Email inválido: ${email}`);
  process.exit(1);
}

// Função principal
async function main() {
  try {
    console.log("\n📧 Iniciando envio manual de email...");
    console.log(`   Email: ${email}`);
    console.log(`   Nome: ${name}`);
    console.log("");

    // Simular dados de cliente (como se fosse uma compra)
    const mockClient = {
      email,
      name,
      id: `manual_${Date.now()}`,
      cellphone: "",
      cpf_cnpj: "",
    };

    // Simular dados de venda paga
    const mockSaleData = {
      sale: {
        id: `manual_${Date.now()}`,
        status: "paid",
        amount: 0,
      },
      currentStatus: "paid",
      product: {
        type: "SUBSCRIPTION",
      },
    };

    // Criar ou atualizar usuário
    console.log("👤 Criando/atualizando usuário...");
    const {user, isNew, password} = await createOrUpdateUser(
      mockClient,
      null,
      mockSaleData
    );

    if (!isNew) {
      console.log("⚠️  Usuário já existe. Email não será enviado.");
      console.log(`   User ID: ${user.uid}`);
      console.log(`   Email: ${user.email}`);
      process.exit(0);
    }

    console.log("✅ Usuário criado com sucesso!");
    console.log(`   User ID: ${user.uid}`);
    console.log(`   Senha temporária: ${password}`);
    console.log("");

    // O email já foi enviado pela função createOrUpdateUser
    // Buscar token de login automático do Firestore para exibir no resumo
    const userCredentialDoc = await admin.firestore()
      .collection("user_credentials")
      .doc(user.uid)
      .get();

    const autoLoginToken = userCredentialDoc.data()?.autoLoginToken || "";
    const baseUrl = process.env.APP_LOGIN_URL || "https://app.teamhiit.com.br";
    const autoLoginUrl = `${baseUrl}/#/auto-login?token=${autoLoginToken}&email=${encodeURIComponent(email)}`;

    console.log("✅ Email de boas-vindas enviado automaticamente!");
    console.log("");
    console.log("📋 Resumo:");
    console.log(`   Email: ${email}`);
    console.log(`   Nome: ${name}`);
    console.log(`   User ID: ${user.uid}`);
    console.log(`   Senha temporária: ${password}`);
    console.log(`   URL de login automático: ${autoLoginUrl}`);

    // Finalizar
    console.log("\n✅ Processo concluído com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Erro ao processar:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
main();

