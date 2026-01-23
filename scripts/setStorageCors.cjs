const path = require('path');
const { Storage } = require('@google-cloud/storage');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT)
  : path.resolve(__dirname, '../serviceAccountKey.json');

const storage = new Storage({
  projectId: 'comunidade-team-hiit',
  keyFilename: serviceAccountPath,
});

async function main() {
  const bucket = storage.bucket('comunidade-team-hiit.firebasestorage.app');
  await bucket.setCorsConfiguration([
    {
      origin: ['http://localhost:5173', 'https://app.teamhiit.com.br'],
      method: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
      responseHeader: ['Authorization', 'Content-Type'],
      maxAgeSeconds: 3600,
    },
  ]);
  console.log('✅ CORS do Storage atualizado com sucesso');
}

main().catch((error) => {
  console.error('❌ Falha ao configurar CORS:', error);
  process.exit(1);
});


