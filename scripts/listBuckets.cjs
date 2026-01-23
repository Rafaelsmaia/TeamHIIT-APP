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
  const [buckets] = await storage.getBuckets();
  console.log('Buckets disponíveis:');
  buckets.forEach((bucket) => console.log('-', bucket.name));
}

main().catch((error) => {
  console.error('Erro ao listar buckets:', error);
  process.exit(1);
});


