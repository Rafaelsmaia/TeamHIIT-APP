/**
 * Funções para envio de emails via Resend
 */

const {Resend} = require("resend");

// Secret será passado pela função principal
let resendApiKeySecret = null;

// Inicializar Resend (será inicializado quando necessário)
let resend = null;

/**
 * Define o secret da API key do Resend (chamado pela função principal)
 * 
 * @param {Secret} secret - Secret do Firebase Functions
 */
function setResendApiKeySecret(secret) {
  resendApiKeySecret = secret;
}

/**
 * Envia email de boas-vindas com credenciais de login
 * 
 * @param {string} email - Email do destinatário
 * @param {string} name - Nome do destinatário
 * @param {string} password - Senha temporária
 * @param {string} loginUrl - URL de login do app
 * @returns {boolean} - true se enviado com sucesso
 */
async function sendWelcomeEmail(email, name, password, loginUrl) {
  // Obter API key do secret ou variável de ambiente
  const apiKey = resendApiKeySecret?.value() || process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ [Email] RESEND_API_KEY não configurada, email não será enviado");
    return false;
  }

  // Obter email remetente de variável de ambiente ou usar padrão
  const fromEmail = process.env.RESEND_FROM_EMAIL || 
                    (typeof require !== "undefined" && 
                     require("firebase-functions").config()?.resend?.from_email) ||
                    "Team HIIT <noreply@noreply.teamhiit.com.br>";

  if (!fromEmail) {
    console.warn("⚠️ [Email] RESEND_FROM_EMAIL não configurada, email não será enviado");
    return false;
  }

  // Inicializar Resend se necessário
  if (!resend) {
    resend = new Resend(apiKey);
  }

  try {
    const emailHtml = getWelcomeEmailTemplate(name, email, password, loginUrl);
    const emailText = getWelcomeEmailText(name, email, password, loginUrl);

    const {data, error} = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Bem-vindo ao Team HIIT! Suas credenciais de acesso",
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error("❌ [Email] Erro ao enviar email:", error);
      return false;
    }

    console.log("✅ [Email] Email enviado com sucesso:", data?.id);
    return true;
  } catch (error) {
    console.error("❌ [Email] Erro ao enviar email:", error);
    return false;
  }
}

/**
 * Template HTML do email de boas-vindas
 * 
 * @param {string} name - Nome do destinatário
 * @param {string} email - Email do destinatário
 * @param {string} password - Senha temporária
 * @param {string} loginUrl - URL de login
 * @returns {string} - HTML do email
 */
function getWelcomeEmailTemplate(name, email, password, loginUrl) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Team HIIT</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Bem-vindo ao Team HIIT!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Olá <strong>${name}</strong>,
              </p>
              
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Estamos muito felizes em tê-lo(a) conosco! Sua assinatura foi ativada com sucesso e você já pode acessar todos os treinos exclusivos do Team HIIT.
              </p>
              
              <!-- Credentials Box -->
              <div style="background-color: #f8f9fa; border: 2px solid #ff6b35; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #ff6b35; font-size: 20px; margin: 0 0 20px 0; text-align: center;">Suas Credenciais de Acesso</h2>
                
                <table width="100%" cellpadding="10" cellspacing="0">
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 5px; padding: 15px; margin-bottom: 10px;">
                      <strong style="color: #333333; display: block; margin-bottom: 5px;">Email:</strong>
                      <span style="color: #666666; font-size: 14px;">${email}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #ffffff; border-radius: 5px; padding: 15px; margin-top: 10px;">
                      <strong style="color: #333333; display: block; margin-bottom: 5px;">Senha Temporária:</strong>
                      <span style="color: #ff6b35; font-size: 16px; font-weight: bold; letter-spacing: 2px;">${password}</span>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- CTA Buttons -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3); margin-bottom: 15px;">
                  Login Automático
                </a>
                <br>
                <a href="${loginUrl.includes('?') ? loginUrl + '&install=true' : loginUrl + '?install=true'}" style="display: inline-block; background-color: #ffffff; color: #ff6b35; text-decoration: none; padding: 12px 35px; border-radius: 8px; font-size: 14px; font-weight: bold; border: 2px solid #ff6b35; margin-top: 10px;">
                  📱 Instalar App no Celular
                </a>
              </div>
              
              <!-- Security Warning -->
              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 5px;">
                <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                  <strong>💡 Dica:</strong> Clique no botão "Login Automático" para fazer login automaticamente. Você também pode usar as credenciais acima para fazer login manualmente no site.
                </p>
                <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>📱 Instalar App:</strong> Clique no botão "Instalar App no Celular" para instalar o Team HIIT na tela inicial do seu celular e ter acesso rápido aos treinos!
                </p>
              </div>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe está sempre à disposição.
              </p>
              
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Bons treinos!<br>
                <strong>Equipe Team HIIT</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} Team HIIT. Todos os direitos reservados.
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
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

/**
 * Versão texto do email de boas-vindas
 * 
 * @param {string} name - Nome do destinatário
 * @param {string} email - Email do destinatário
 * @param {string} password - Senha temporária
 * @param {string} loginUrl - URL de login
 * @returns {string} - Texto do email
 */
function getWelcomeEmailText(name, email, password, loginUrl) {
  return `
Bem-vindo ao Team HIIT!

Olá ${name},

Estamos muito felizes em tê-lo(a) conosco! Sua assinatura foi ativada com sucesso e você já pode acessar todos os treinos exclusivos do Team HIIT.

SUAS CREDENCIAIS DE ACESSO:

Email: ${email}
Senha: ${password}

Email: ${email}
Senha Temporária: ${password}

Login Automático: ${loginUrl}

💡 DICA: Clique no link acima para fazer login automaticamente. Você também pode usar as credenciais acima para fazer login manualmente no site.

Se você tiver alguma dúvida ou precisar de ajuda, nossa equipe está sempre à disposição.

Bons treinos!
Equipe Team HIIT

© ${new Date().getFullYear()} Team HIIT. Todos os direitos reservados.
Este é um email automático, por favor não responda.
  `;
}

module.exports = {
  sendWelcomeEmail,
  setResendApiKeySecret,
};

