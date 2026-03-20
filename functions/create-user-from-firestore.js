/**
 * Script para criar credenciais para usuário que existe no Firestore mas não tem conta no Firebase Auth
 * 
 * Uso: node create-user-from-firestore.js rosana-lobato@hotmail.com
 */

const admin = require('firebase-admin');
const { Resend } = require('resend');
const serviceAccount = require('../serviceAccountKey.json');

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const resend = new Resend('re_Hxg6wmLV_EavGLhtS5cMdQfxyvEb8pHX5');

// Função para gerar senha aleatória
function generateRandomPassword(name) {
  const namePart = name ? name.toLowerCase().replace(/\s+/g, '').slice(0, 6) : 'user';
  const randomPart = Math.random().toString(36).slice(-6);
  return `${namePart}${randomPart}123`;
}

// Função para gerar token
function generatePasswordToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

async function createUserFromFirestore(email) {
  try {
    console.log(`🔍 Processando: ${email}\n`);

    // 1. Buscar dados do usuário no Firestore (coleção 'users')
    console.log("1️⃣ Buscando dados no Firestore (coleção 'users')...");
    const usersQuery = await admin.firestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersQuery.empty) {
      console.error('❌ Usuário não encontrado no Firestore!');
      return;
    }

    const userDoc = usersQuery.docs[0];
    const userData = userDoc.data();
    const existingUid = userDoc.id;
    const name = userData.name || userData.displayName || email.split('@')[0];

    console.log(`✅ Usuário encontrado no Firestore:`);
    console.log(`   ID do documento: ${existingUid}`);
    console.log(`   Nome: ${name}`);
    console.log(`   Email: ${email}`);

    // 2. Verificar se já existe no Firebase Auth
    console.log("\n2️⃣ Verificando Firebase Authentication...");
    let firebaseUser;

    try {
      firebaseUser = await admin.auth().getUserByEmail(email);
      console.log(`✅ Usuário já existe no Firebase Auth: ${firebaseUser.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Criar novo usuário
        const tempPassword = generateRandomPassword(name);
        firebaseUser = await admin.auth().createUser({
          email: email,
          password: tempPassword,
          displayName: name,
          emailVerified: false
        });
        console.log(`✅ Usuário criado no Firebase Auth: ${firebaseUser.uid}`);
      } else {
        throw error;
      }
    }

    // 3. Gerar senha temporária
    console.log("\n3️⃣ Gerando senha temporária...");
    const tempPassword = generateRandomPassword(name);
    
    // Atualizar senha no Firebase Auth
    await admin.auth().updateUser(firebaseUser.uid, {
      password: tempPassword,
      displayName: name
    });
    console.log(`✅ Senha temporária gerada: ${tempPassword}`);

    // 4. Gerar token de login automático
    const autoLoginToken = generatePasswordToken();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    // 5. Salvar credenciais no Firestore (por UID e por email)
    const credentialsData = {
      uid: firebaseUser.uid,
      email: email,
      tempPassword: tempPassword,
      autoLoginToken: autoLoginToken,
      autoLoginTokenExpiresAt: admin.firestore.Timestamp.fromDate(tokenExpiresAt),
      sent: false,
      sentAt: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('user_credentials').doc(firebaseUser.uid).set(credentialsData);
    await admin.firestore().collection('user_credentials').doc(email).set(credentialsData);
    console.log(`✅ Credenciais salvas no Firestore`);

    // 6. Atualizar documento do usuário no Firestore com o UID correto (se necessário)
    if (existingUid !== firebaseUser.uid) {
      console.log(`\n4️⃣ Atualizando documento do usuário no Firestore...`);
      // Copiar dados para o novo documento com o UID correto
      await admin.firestore().collection('users').doc(firebaseUser.uid).set(userData, { merge: true });
      console.log(`✅ Documento atualizado com UID do Firebase Auth`);
    }

    // 7. Enviar email
    console.log("\n5️⃣ Enviando email...");
    const autoLoginUrl = `https://app.teamhiit.com.br/#/auto-login?token=${autoLoginToken}&email=${encodeURIComponent(email)}`;

    const emailResult = await resend.emails.send({
      from: 'Team HIIT <noreply@noreply.teamhiit.com.br>',
      to: email,
      subject: 'Bem-vindo ao Team HIIT! Suas credenciais de acesso',
      html: getEmailTemplate(name, email, tempPassword, autoLoginUrl),
      text: getEmailText(name, email, tempPassword, autoLoginUrl)
    });

    if (emailResult.error) {
      console.error('❌ Erro ao enviar email:', emailResult.error);
      return;
    }

    console.log(`✅ Email enviado com sucesso!`);
    console.log(`📨 ID do email: ${emailResult.data.id}`);

    // 8. Atualizar status no Firestore
    await admin.firestore().collection('user_credentials').doc(firebaseUser.uid).update({
      sent: true,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await admin.firestore().collection('user_credentials').doc(email).update({
      sent: true,
      sentAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("\n✅ Processo concluído com sucesso!");
    console.log(`\n📋 Resumo:`);
    console.log(`   Email: ${email}`);
    console.log(`   Nome: ${name}`);
    console.log(`   🔑 Senha temporária: ${tempPassword}`);
    console.log(`   🔗 Link de login: ${autoLoginUrl}`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

function getEmailTemplate(name, email, password, loginUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Team HIIT</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Team HIIT</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Olá, ${name}! 👋</h2>
              <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                Suas credenciais de acesso foram geradas com sucesso!
              </p>
              <table width="100%" cellpadding="20" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="color: #333333; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">🔐 Suas credenciais:</p>
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;"><strong>Email:</strong><br><span style="color: #667eea; font-size: 16px;">${email}</span></p>
                    <p style="color: #666666; margin: 0; font-size: 14px;"><strong>Senha temporária:</strong><br><span style="color: #667eea; font-size: 16px; font-family: monospace;">${password}</span></p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold;">Acessar Minha Conta</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getEmailText(name, email, password, loginUrl) {
  return `
Olá, ${name}!

Suas credenciais de acesso foram geradas com sucesso!

🔐 SUAS CREDENCIAIS:
Email: ${email}
Senha temporária: ${password}

Para acessar sua conta, clique no link abaixo:
${loginUrl}

Bons treinos! 💪🔥
Equipe Team HIIT
  `;
}

// Executar
const email = process.argv[2];

if (!email) {
  console.error('❌ Uso: node create-user-from-firestore.js email@exemplo.com');
  process.exit(1);
}

createUserFromFirestore(email);
