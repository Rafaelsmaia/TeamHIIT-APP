const admin = require('firebase-admin');
const path = require('path');

// Caminho para a serviceAccountKey.json na raiz do projeto
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('❌ Coloque o arquivo serviceAccountKey.json na raiz do projeto (mesmo nível de package.json).');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// Dados genéricos do administrador para freelancer
// Ajuste o email/senha se preferir antes de rodar o script
const userData = {
  email: 'freelancer.admin@teamhiit.app',
  name: 'TeamHIIT Admin Freelancer',
  phone: '',
  cpf: ''
};

// Senha temporária fixa para facilitar o envio ao freelancer
const TEMP_PASSWORD = 'TeamHIIT#Admin2025';

async function createAdminUser() {
  try {
    console.log('👤 Criando usuário administrador (freelancer):', userData.email);

    // 1. Firebase Auth
    console.log('\n1️⃣ Criando no Firebase Auth...');
    const authUser = await admin.auth().createUser({
      email: userData.email,
      password: TEMP_PASSWORD,
      displayName: userData.name,
      emailVerified: false
    });
    console.log('   ✅ Usuário criado! UID:', authUser.uid);

    // 2. Firestore (users) com flag de admin
    console.log('\n2️⃣ Criando documento em Firestore (users)...');
    const userDoc = {
      email: userData.email,
      name: userData.name,
      displayName: userData.name,
      isAdmin: true,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (userData.phone) userDoc.phone = userData.phone;
    if (userData.cpf) userDoc.cpf = userData.cpf;

    await admin.firestore().collection('users').doc(authUser.uid).set(userDoc);
    console.log('   ✅ Documento criado com isAdmin: true.');

    // 3. Credenciais temporárias
    console.log('\n3️⃣ Salvando credenciais temporárias...');
    const credData = {
      uid: authUser.uid,
      email: userData.email,
      tempPassword: TEMP_PASSWORD,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await admin.firestore().collection('user_credentials').doc(userData.email).set(credData);
    await admin.firestore().collection('user_credentials').doc(authUser.uid).set(credData);
    console.log('   ✅ Credenciais salvas.');

    console.log('\n========================================');
    console.log('USUÁRIO ADMIN (FREELANCER) CRIADO COM SUCESSO');
    console.log('========================================');
    console.log('Email:    ', userData.email);
    console.log('Nome:     ', userData.name);
    console.log('Senha:    ', TEMP_PASSWORD);
    console.log('========================================');
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

createAdminUser();

