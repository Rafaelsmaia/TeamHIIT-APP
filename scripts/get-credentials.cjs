const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const email = process.argv[2] || 'nilzaxxx3@gmail.com';

async function getCredentials() {
  try {
    console.log('Buscando credenciais para:', email);
    
    // Buscar na coleção user_credentials por documento com ID = email
    const doc = await admin.firestore().collection('user_credentials').doc(email).get();
    if (doc.exists) {
      const data = doc.data();
      console.log('\n✅ Credenciais encontradas:');
      console.log('   Email:', data.email);
      console.log('   Senha temporária:', data.tempPassword);
      process.exit(0);
      return;
    }
    
    // Se não encontrou por email como ID, buscar por query
    const query = await admin.firestore().collection('user_credentials').where('email', '==', email).limit(1).get();
    if (!query.empty) {
      const data = query.docs[0].data();
      console.log('\n✅ Credenciais encontradas:');
      console.log('   Email:', data.email);
      console.log('   Senha temporária:', data.tempPassword);
      process.exit(0);
      return;
    }
    
    console.log('\n❌ Credenciais não encontradas para:', email);
    console.log('   O usuário pode não ter uma senha temporária gerada.');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
  process.exit(0);
}

getCredentials();
