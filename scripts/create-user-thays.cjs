const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('❌ Coloque serviceAccountKey.json na raiz do projeto.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

// Dados fixos da Thays
const userData = {
  email: 'thays.45barcellos@gmail.com',
  name: 'Thays Barcellos',
  phone: '+553389683017',
  cpf: '124.622.426-78'
};

// Senha temporária definida aqui para você poder informar à cliente
const TEMP_PASSWORD = 'Thays#2025fit';

async function createUser() {
  try {
    console.log('Criando usuária:', userData.email);

    // 1. Firebase Auth
    console.log('\n1. Criando no Firebase Auth...');
    const authUser = await admin.auth().createUser({
      email: userData.email,
      password: TEMP_PASSWORD,
      displayName: userData.name,
      emailVerified: false
    });
    console.log('   Usuária criada! UID:', authUser.uid);

    // 2. Firestore (users)
    console.log('\n2. Criando no Firestore (users)...');
    await admin.firestore().collection('users').doc(authUser.uid).set({
      email: userData.email,
      name: userData.name,
      displayName: userData.name,
      phone: userData.phone,
      cpf: userData.cpf,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('   Documento criado no Firestore.');

    // 3. Credenciais temporárias
    console.log('\n3. Salvando credenciais...');
    const credData = {
      uid: authUser.uid,
      email: userData.email,
      tempPassword: TEMP_PASSWORD,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await admin.firestore().collection('user_credentials').doc(userData.email).set(credData);
    await admin.firestore().collection('user_credentials').doc(authUser.uid).set(credData);
    console.log('   Credenciais salvas.');

    console.log('\n========================================');
    console.log('USUÁRIA CRIADA COM SUCESSO');
    console.log('========================================');
    console.log('Email:    ', userData.email);
    console.log('Nome:     ', userData.name);
    console.log('Senha:    ', TEMP_PASSWORD);
    console.log('========================================');
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

createUser();

