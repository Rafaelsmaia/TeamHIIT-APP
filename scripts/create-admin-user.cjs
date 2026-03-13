/**
 * Cria um usuário admin (isAdmin: true) no Firebase Auth e Firestore.
 *
 * Uso:
 *   node scripts/create-admin-user.cjs email@exemplo.com "Nome Completo"
 *
 * Se o nome não for informado, usa a parte antes do @ do email.
 * A senha temporária é gerada automaticamente (forte, mas simples de comunicar).
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

if (!emailArg) {
  console.error('❌ Uso: node scripts/create-admin-user.cjs email@exemplo.com "Nome Completo"');
  process.exit(1);
}

const userData = {
  email: emailArg,
  name: nameArg || emailArg.split('@')[0],
};

function generatePassword(name) {
  const base = (name || 'admin').toLowerCase().replace(/\s+/g, '');
  const prefix = base.slice(0, 6) || 'admin';
  const random = Math.random().toString(36).slice(-6);
  return `${prefix}${random}!Admin1`;
}

async function createAdminUser() {
  try {
    console.log('👤 Criando usuário administrador:', userData.email);

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

    // 2. Firestore (users) com flag de admin
    console.log('\n2️⃣ Gravando documento em Firestore (users)...');
    const userDocRef = admin.firestore().collection('users').doc(authUser.uid);
    const now = admin.firestore.FieldValue.serverTimestamp();

    const userDoc = {
      email: userData.email,
      name: userData.name,
      displayName: userData.name,
      isAdmin: true,
      role: 'admin',
      updatedAt: now,
    };

    await userDocRef.set(
      {
        ...userDoc,
        createdAt: now,
      },
      { merge: true }
    );
    console.log('   ✅ Documento salvo com isAdmin: true.');

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
    console.log('USUÁRIO ADMIN CRIADO / ATUALIZADO COM SUCESSO');
    console.log('========================================');
    console.log('Email:    ', userData.email);
    console.log('Nome:     ', userData.name);
    console.log('Senha:    ', tempPassword);
    console.log('========================================');
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error.message);
    process.exit(1);
  }
  process.exit(0);
}

createAdminUser();

