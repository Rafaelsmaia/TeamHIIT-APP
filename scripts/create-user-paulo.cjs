/**
 * Cria usuário pauloschmidt387@gmail.com no Firebase Auth e Firestore.
 * Uso: node scripts/create-user-paulo.cjs
 */

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

const userData = {
  email: 'pauloschmidt387@gmail.com',
  name: 'Paulo Schmidt',
  phone: '',
  cpf: ''
};

function generatePassword(name) {
  const namePart = (name || 'user').toLowerCase().replace(/\s+/g, '').slice(0, 6);
  const randomPart = Math.random().toString(36).slice(-6);
  return namePart + randomPart + '123';
}

async function createUser() {
  try {
    console.log('Criando usuário:', userData.email);

    const tempPassword = generatePassword(userData.name);

    // 1. Firebase Auth
    console.log('\n1. Criando no Firebase Auth...');
    const authUser = await admin.auth().createUser({
      email: userData.email,
      password: tempPassword,
      displayName: userData.name,
      emailVerified: false
    });
    console.log('   Usuário criado! UID:', authUser.uid);

    // 2. Firestore (users)
    console.log('\n2. Criando no Firestore (users)...');
    const userDoc = {
      email: userData.email,
      name: userData.name,
      displayName: userData.name,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (userData.phone) userDoc.phone = userData.phone;
    if (userData.cpf) userDoc.cpf = userData.cpf;
    await admin.firestore().collection('users').doc(authUser.uid).set(userDoc);
    console.log('   Documento criado.');

    // 3. Credenciais temporárias
    console.log('\n3. Salvando credenciais...');
    const credData = {
      uid: authUser.uid,
      email: userData.email,
      tempPassword,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    await admin.firestore().collection('user_credentials').doc(userData.email).set(credData);
    await admin.firestore().collection('user_credentials').doc(authUser.uid).set(credData);
    console.log('   Credenciais salvas.');

    console.log('\n========================================');
    console.log('USUÁRIO CRIADO COM SUCESSO');
    console.log('========================================');
    console.log('Email:    ', userData.email);
    console.log('Nome:     ', userData.name);
    console.log('Senha:    ', tempPassword);
    console.log('========================================');
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

createUser();
