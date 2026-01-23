/**
 * Script para reenviar emails para todos os usuários que não receberam
 * 
 * USO:
 * node resend-all-failed.js [API_KEY]
 * 
 * Se não fornecer a API_KEY, o script tentará ler do .env
 */

const admin = require('firebase-admin');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Buscar API Key (argumento ou .env)
let apiKey = process.argv[2];

if (!apiKey) {
  // Tentar ler do .env
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/RESEND_API_KEY=(.+)/);
    if (match) {
      apiKey = match[1].trim();
    }
  }
}

if (!apiKey) {
  console.error('❌ API Key não encontrada!');
  console.log('\n💡 USO:');
  console.log('   node resend-all-failed.js re_sua_api_key_aqui');
  console.log('\nOU crie um arquivo .env com:');
  console.log('   RESEND_API_KEY=re_sua_api_key_aqui\n');
  process.exit(1);
}

// Inicializar Resend
const resend = new Resend(apiKey);

async function resendAllFailed() {
  console.log('🔍 Buscando usuários que não receberam email...\n');
  
  try {
    // Buscar credenciais não enviadas
    const credSnapshot = await admin.firestore()
      .collection('user_credentials')
      .where('sent', '==', false)
      .get();
    
    console.log(`📊 Total de usuários sem email: ${credSnapshot.size}\n`);
    
    let success = 0;
    let failed = 0;
    const errors = [];
    
    for (const doc of credSnapshot.docs) {
      const credData = doc.data();
      const uid = doc.id;
      
      try {
        // Tentar buscar o usuário no Firebase Auth
        let userRecord;
        try {
          userRecord = await admin.auth().getUser(uid);
        } catch (authError) {
          // Se o UID não existe no Auth, talvez seja o email
          // Tentar buscar pelo email
          try {
            userRecord = await admin.auth().getUserByEmail(uid);
          } catch (e) {
            console.log(`❌ ${uid} - Usuário não encontrado no Auth`);
            failed++;
            errors.push({ uid, error: 'Usuário não encontrado' });
            continue;
          }
        }
        
        const email = userRecord.email;
        const tempPassword = credData.tempPassword;
        
        if (!tempPassword) {
          console.log(`❌ ${email} - Senha não encontrada`);
          failed++;
          errors.push({ email, error: 'Senha não encontrada' });
          continue;
        }
        
        // Enviar email
        console.log(`📧 Enviando para: ${email}...`);
        
        const { error } = await resend.emails.send({
          from: 'noreply@noreply.teamhiit.com.br',
          to: email,
          subject: 'Bem-vindo ao Team HIIT! 🔥',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
              <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h1 style="color: #FF6B00; text-align: center; margin-bottom: 30px;">🔥 Bem-vindo ao Team HIIT!</h1>
                
                <p style="font-size: 16px; color: #333; line-height: 1.6;">
                  Olá! Sua conta foi criada com sucesso. Use as credenciais abaixo para fazer login:
                </p>
                
                <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 10px 0;"><strong>🔐 Email:</strong> ${email}</p>
                  <p style="margin: 10px 0;"><strong>🔑 Senha:</strong> ${tempPassword}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://app.teamhiit.com.br" style="background-color: #FF6B00; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Acessar o App
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px;">
                  💡 <strong>Dica:</strong> Recomendamos que você altere sua senha após o primeiro login.
                </p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                  Se você não solicitou esta conta, ignore este email.
                </p>
              </div>
            </div>
          `
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        // Atualizar o documento com o status de enviado
        await admin.firestore().collection('user_credentials').doc(userRecord.uid).update({
          sent: true,
          sentAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ ${email} - Email enviado com sucesso!\n`);
        success++;
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${uid}:`, error.message, '\n');
        failed++;
        errors.push({ uid, error: error.message });
      }
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO FINAL:');
    console.log(`   ✅ Sucesso: ${success}`);
    console.log(`   ❌ Falhas: ${failed}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (errors.length > 0) {
      console.log('⚠️  ERROS DETALHADOS:');
      errors.forEach(err => {
        console.log(`   - ${err.uid || err.email}: ${err.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
  
  process.exit(0);
}

resendAllFailed();


