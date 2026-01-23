/**
 * Script para reenviar email de boas-vindas manualmente
 * 
 * Uso: node resend-email.js email@cliente.com
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

async function resendWelcomeEmail(email) {
  try {
    console.log(`🔍 Buscando credenciais para: ${email}`);

    // Buscar credenciais do usuário
    const credDoc = await admin.firestore()
      .collection('user_credentials')
      .doc(email)
      .get();

    if (!credDoc.exists) {
      console.error('❌ Usuário não encontrado!');
      return;
    }

    const cred = credDoc.data();
    console.log(`✅ Usuário encontrado: ${cred.uid}`);

    // Buscar dados do usuário
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(cred.uid)
      .get();

    const userData = userDoc.data();
    const name = userData?.name || email.split('@')[0];
    const password = cred.tempPassword;
    const autoLoginToken = cred.autoLoginToken;
    const autoLoginUrl = `https://app.teamhiit.com.br/#/auto-login?token=${autoLoginToken}&email=${encodeURIComponent(email)}`;

    console.log(`📧 Enviando email para: ${email}`);
    console.log(`👤 Nome: ${name}`);
    console.log(`🔑 Senha: ${password}`);

    // Enviar email
    const result = await resend.emails.send({
      from: 'Team HIIT <noreply@noreply.teamhiit.com.br>',
      to: email,
      subject: 'Bem-vindo ao Team HIIT! Suas credenciais de acesso',
      html: getEmailTemplate(name, email, password, autoLoginUrl),
      text: getEmailText(name, email, password, autoLoginUrl)
    });

    if (result.error) {
      console.error('❌ Erro ao enviar email:', result.error);
      return;
    }

    console.log('✅ Email enviado com sucesso!');
    console.log('📨 ID:', result.data.id);

    // Atualizar status no Firestore
    await admin.firestore()
      .collection('user_credentials')
      .doc(cred.uid)
      .update({
        sent: true,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
        resentAt: admin.firestore.FieldValue.serverTimestamp()
      });

    console.log('✅ Status atualizado no Firestore');

  } catch (error) {
    console.error('❌ Erro:', error);
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
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                Team HIIT
              </h1>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Bem-vindo à sua jornada de transformação!
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">
                Olá, ${name}! 👋
              </h2>
              
              <p style="color: #666666; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                Seja muito bem-vindo(a) ao <strong>Team HIIT</strong>! Estamos muito felizes em tê-lo(a) conosco. 
                Sua assinatura foi confirmada e você já pode começar a treinar!
              </p>

              <!-- Credentials Box -->
              <table width="100%" cellpadding="20" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="color: #333333; margin: 0 0 15px 0; font-size: 18px; font-weight: bold;">
                      🔐 Suas credenciais de acesso:
                    </p>
                    
                    <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px;">
                      <strong>Email:</strong><br>
                      <span style="color: #667eea; font-size: 16px;">${email}</span>
                    </p>
                    
                    <p style="color: #666666; margin: 0; font-size: 14px;">
                      <strong>Senha temporária:</strong><br>
                      <span style="color: #667eea; font-size: 16px; font-family: monospace;">${password}</span>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 18px; font-weight: bold; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      Acessar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; margin: 20px 0; font-size: 14px; line-height: 1.6;">
                💡 <strong>Dica:</strong> Recomendamos que você altere sua senha após o primeiro acesso para uma senha personalizada.
              </p>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="color: #666666; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">
                Preparamos uma jornada incrível para você:
              </p>

              <ul style="color: #666666; font-size: 14px; line-height: 1.8; margin: 0 0 20px 0;">
                <li>✅ Acesso ilimitado a todos os treinos HIIT</li>
                <li>✅ Novos treinos adicionados semanalmente</li>
                <li>✅ Planos personalizados para todos os níveis</li>
                <li>✅ Comunidade exclusiva de apoio</li>
              </ul>

              <p style="color: #666666; margin: 20px 0; font-size: 14px; line-height: 1.6;">
                Caso tenha qualquer dúvida, nossa equipe está pronta para ajudar!
              </p>

              <p style="color: #667eea; margin: 0; font-size: 16px; font-weight: bold;">
                Bons treinos! 💪🔥
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; margin: 0 0 10px 0; font-size: 12px;">
                Team HIIT © ${new Date().getFullYear()}. Todos os direitos reservados.
              </p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                Este é um email automático, por favor não responda.
              </p>
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

Seja muito bem-vindo(a) ao Team HIIT! Estamos muito felizes em tê-lo(a) conosco.
Sua assinatura foi confirmada e você já pode começar a treinar!

🔐 SUAS CREDENCIAIS DE ACESSO:

Email: ${email}
Senha temporária: ${password}

Para acessar sua conta, clique no link abaixo:
${loginUrl}

💡 Dica: Recomendamos que você altere sua senha após o primeiro acesso.

PREPARE-SE PARA:
✅ Acesso ilimitado a todos os treinos HIIT
✅ Novos treinos adicionados semanalmente
✅ Planos personalizados para todos os níveis
✅ Comunidade exclusiva de apoio

Caso tenha qualquer dúvida, nossa equipe está pronta para ajudar!

Bons treinos! 💪🔥
Equipe Team HIIT

© ${new Date().getFullYear()} Team HIIT. Todos os direitos reservados.
Este é um email automático, por favor não responda.
  `;
}

// Executar
const email = process.argv[2];

if (!email) {
  console.error('❌ Uso: node resend-email.js email@cliente.com');
  process.exit(1);
}

resendWelcomeEmail(email);

