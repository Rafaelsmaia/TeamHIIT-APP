const admin = require("firebase-admin");
const { sendWelcomeEmail } = require("./src/email");
const fs = require("fs");
const csv = require("csv-parser");

// Inicializar Firebase Admin
if (!admin.apps.length) {
  try {
    // Tenta usar o serviceAccount.json
    const serviceAccount = require("./serviceAccount.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase inicializado com serviceAccount.json");
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase:", error.message);
    process.exit(1);
  }
}

// Função para gerar senha aleatória
function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Função para migrar um usuário
async function migrateUser(userData) {
  const { email, name, cpf, telefone, codigo } = userData;

  try {
    console.log(`\n📧 Processando: ${email} (${name})`);

    // 1. Verificar se o usuário já existe
    let user;
    try {
      user = await admin.auth().getUserByEmail(email);
      console.log(`✅ Usuário já existe: ${user.uid}`);
    } catch (error) {
      // 2. Criar usuário no Firebase Auth
      const password = generatePassword();
      user = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
      console.log(`✅ Usuário criado: ${user.uid}`);

      // 3. Salvar credenciais no Firestore
      await admin.firestore().collection("user_credentials").doc(user.uid).set({
        email,
        password,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        sent: false,
        source: "migration_old_team_hiit",
      });
      console.log(`✅ Credenciais salvas`);
    }

    // 4. Criar/atualizar perfil do usuário no Firestore
    const userProfile = {
      name: name || email,
      email,
      cpf: cpf || null,
      phone: telefone || null,
      codigo: codigo || null,
      isSubscriber: true,
      hasCalorieCalculator: true,
      subscriptionStatus: "active",
      subscriptionPlan: "Team HIIT - Migração",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      source: "migration_old_team_hiit",
    };

    await admin.firestore().collection("users").doc(user.uid).set(userProfile, { merge: true });
    console.log(`✅ Perfil criado/atualizado no Firestore`);

    // 5. Buscar credenciais para enviar email
    const credDoc = await admin.firestore().collection("user_credentials").doc(user.uid).get();
    
    if (credDoc.exists && !credDoc.data().sent) {
      const { password } = credDoc.data();
      
      // 6. Enviar email de boas-vindas
      const autoLoginUrl = `https://app.teamhiit.com.br/#/auto-login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      
      const emailSent = await sendWelcomeEmail(email, name || email, password, autoLoginUrl);
      
      if (emailSent) {
        await admin.firestore().collection("user_credentials").doc(user.uid).update({
          sent: true,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Email enviado com sucesso!`);
        return { success: true, email, userId: user.uid };
      } else {
        console.log(`⚠️ Falha ao enviar email`);
        return { success: false, email, userId: user.uid, error: "Email não enviado" };
      }
    } else {
      console.log(`ℹ️ Email já foi enviado anteriormente`);
      return { success: true, email, userId: user.uid, alreadySent: true };
    }

  } catch (error) {
    console.error(`❌ Erro ao processar ${email}:`, error.message);
    return { success: false, email, error: error.message };
  }
}

// Função principal para ler CSV e migrar usuários
async function migrateFromCSV(csvFilePath) {
  const users = [];
  const results = {
    success: [],
    failed: [],
    alreadySent: [],
  };

  // Ler CSV
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        // Adaptar os nomes das colunas conforme sua planilha
        const email = row["E-mail"] || row["Email"] || row["email"];
        
        // Pular linhas sem email
        if (!email || email.trim() === "") {
          return;
        }
        
        users.push({
          email: email.trim(),
          name: (row["Nome"] || row["Name"] || row["name"] || "").trim(),
          cpf: (row["Cpf"] || row["CPF"] || row["cpf"] || "").trim(),
          telefone: (row["Telefone"] || row["Phone"] || row["phone"] || "").trim(),
          codigo: (row["Código"] || row["Codigo"] || row["codigo"] || "").trim(),
        });
      })
      .on("end", async () => {
        console.log(`\n📊 Total de usuários para migrar: ${users.length}\n`);
        
        // Processar usuários em sequência (para evitar rate limits)
        for (const userData of users) {
          const result = await migrateUser(userData);
          
          if (result.alreadySent) {
            results.alreadySent.push(result);
          } else if (result.success) {
            results.success.push(result);
          } else {
            results.failed.push(result);
          }
          
          // Aguardar 1 segundo entre cada usuário (para evitar rate limits)
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Exibir resultados
        console.log("\n\n=== RESUMO DA MIGRAÇÃO ===");
        console.log(`✅ Emails enviados com sucesso: ${results.success.length}`);
        console.log(`ℹ️ Emails já enviados anteriormente: ${results.alreadySent.length}`);
        console.log(`❌ Falhas: ${results.failed.length}`);

        if (results.failed.length > 0) {
          console.log("\n❌ Usuários com falha:");
          results.failed.forEach(r => console.log(`  - ${r.email}: ${r.error}`));
        }

        resolve(results);
      })
      .on("error", reject);
  });
}

// Executar migração
const csvFilePath = process.argv[2] || "./users.csv";

if (!fs.existsSync(csvFilePath)) {
  console.error(`❌ Arquivo não encontrado: ${csvFilePath}`);
  console.log("\n📝 Uso: node migrate-users.js <caminho_para_arquivo.csv>");
  process.exit(1);
}

console.log(`\n🚀 Iniciando migração de usuários de: ${csvFilePath}\n`);

migrateFromCSV(csvFilePath)
  .then(() => {
    console.log("\n✅ Migração concluída!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro durante a migração:", error);
    process.exit(1);
  });
