const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const email = process.argv[2] || 'nilzaxxx3@gmail.com';

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário:', email, '\n');
    
    // 1. Verificar no Firebase Auth
    console.log('1️⃣ Firebase Authentication:');
    try {
      const authUser = await admin.auth().getUserByEmail(email);
      console.log('   ✅ Usuário existe no Auth');
      console.log('   UID:', authUser.uid);
      console.log('   Nome:', authUser.displayName || '(não definido)');
      console.log('   Email verificado:', authUser.emailVerified ? 'Sim' : 'Não');
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log('   ❌ Usuário NÃO existe no Firebase Auth');
      } else {
        console.log('   ❌ Erro:', error.message);
      }
    }
    
    // 2. Verificar no Firestore (coleção users)
    console.log('\n2️⃣ Firestore (coleção users):');
    const usersQuery = await admin.firestore().collection('users').where('email', '==', email).limit(1).get();
    if (!usersQuery.empty) {
      const userData = usersQuery.docs[0].data();
      console.log('   ✅ Usuário existe no Firestore');
      console.log('   Doc ID:', usersQuery.docs[0].id);
      console.log('   Nome:', userData.name || userData.displayName || '(não definido)');
    } else {
      console.log('   ❌ Usuário NÃO existe no Firestore');
    }
    
    // 3. Verificar credenciais temporárias
    console.log('\n3️⃣ Credenciais temporárias:');
    const credDoc = await admin.firestore().collection('user_credentials').doc(email).get();
    if (credDoc.exists) {
      const credData = credDoc.data();
      console.log('   ✅ Credenciais encontradas');
      console.log('   Senha temporária:', credData.tempPassword);
    } else {
      const credQuery = await admin.firestore().collection('user_credentials').where('email', '==', email).limit(1).get();
      if (!credQuery.empty) {
        const credData = credQuery.docs[0].data();
        console.log('   ✅ Credenciais encontradas');
        console.log('   Senha temporária:', credData.tempPassword);
      } else {
        console.log('   ❌ Nenhuma senha temporária gerada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  process.exit(0);
}

checkUser();
