/**
 * Cria um usuário comum (não admin) no Firebase Auth e Firestore.
 *
 * Uso:
 *   node scripts/create-user.cjs email@exemplo.com "Nome Completo" "+55 11 99999-9999" "00000000000"
 *
 * - isAdmin NÃO é definido (ou permanece false se já existir).
 * - Uma senha temporária é gerada automaticamente.
 */

const admin = require('firebase-admin');
const path = require('path');

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

const emailArg = process.argv[2];
const nameArg = process.argv[3];
const phoneArg = process.argv[4] || '';
const cpfArg = process.argv[5] || '';

if (!emailArg) {
  console.error('❌ Uso: node scripts/create-user.cjs email@exemplo.com "Nome Completo" "+telefone" "cpf"');
  process.exit(1);
}

const userData = {
  email: emailArg,
  name: nameArg || emailArg.split('@')[0],
  phone: phoneArg,
  cpf: cpfArg,
};

function generatePassword(name) {
  const base = (name || 'user').toLowerCase().replace(/\s+/g, '');
  const prefix = base.slice(0, 6) || 'user';
  const random = Math.random().toString(36).slice(-6);
  return `${prefix}${random}!Th1`;
}

async function createUser() {
  try {
    console.log('👤 Criando usuário:', userData.email);

    const tempPassword = generatePassword(userData.name);

    // 1. Firebase Auth
    console.log('\n1️⃣ Criando / atualizando no Firebase Auth...');
    let authUser;
    try {
      authUser = await admin.auth().getUserByEmail(userData.email);
      await admin.auth().updateUser(authUser.uid, {
        password: tempPassword,
        displayName: userData.name,
      });
      console.log('   ✅ Usuário já existia; senha e nome atualizados.');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        authUser = await admin.auth().createUser({
          email: userData.email,
          password: tempPassword,
          displayName: userData.name,
          emailVerified: false,
        });
        console.log('   ✅ Usuário criado! UID:', authUser.uid);
      } else {
        throw error;
      }
    }

    // 2. Firestore (users) SEM isAdmin
    console.log('\n2️⃣ Gravando documento em Firestore (users)...');
    const userDocRef = admin.firestore().collection('users').doc(authUser.uid);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const baseDoc = {
      email: userData.email,
      name: userData.name,
      displayName: userData.name,
      phone: userData.phone,
      cpf: userData.cpf,
      updatedAt: now,
    };

    await userDocRef.set(
      {
        ...baseDoc,
        createdAt: now,
      },
      { merge: true }
    );
    console.log('   ✅ Documento salvo (sem isAdmin).');

    // 3. Credenciais temporárias
    console.log('\n3️⃣ Salvando credenciais temporárias em user_credentials...');
    const credData = {
      uid: authUser.uid,
      email: userData.email,
      tempPassword: tempPassword,
      createdAt: now,
      updatedAt: now,
    };

    await admin.firestore().collection('user_credentials').doc(userData.email).set(credData);
    await admin.firestore().collection('user_credentials').doc(authUser.uid).set(credData);
    console.log('   ✅ Credenciais salvas.');

    console.log('\n========================================');
    console.log('USUÁRIO CRIADO / ATUALIZADO COM SUCESSO');
    console.log('========================================');
    console.log('Email:    ', userData.email);
    console.log('Nome:     ', userData.name);
    console.log('Telefone: ', userData.phone || '(não informado)');
    console.log('CPF:      ', userData.cpf || '(não informado)');
    console.log('Senha:    ', tempPassword);
    console.log('========================================');
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

createUser();


