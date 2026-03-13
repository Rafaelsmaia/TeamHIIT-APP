const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.error('❌ Coloque serviceAccountKey.json na raiz do projeto para rodar este script.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

// Lista completa dos 32 vídeos INTENSO/ADAPTADO
const videos = [
  { title: 'Treino 01', youtubeId: 'MK_euelFr64' },
  { title: 'Treino 02', youtubeId: 'kux1WLgvcsA' },
  { title: 'Treino 03', youtubeId: 'CD1bMHOEceo' },
  { title: 'Treino 04', youtubeId: 'DDqzC1r74iw' },
  { title: 'Treino 05', youtubeId: 'xpuYoPFugVE' },
  { title: 'Treino 06', youtubeId: 'TzTpA2se6N0' },
  { title: 'Treino 07', youtubeId: 'tKo0IKM7Ysg' },
  { title: 'Treino 08', youtubeId: 'BWJVzM6a3y0' },
  { title: 'Treino 09', youtubeId: 'LSjodBKFg4M' },
  { title: 'Treino 10', youtubeId: 'i5-6S2mqebc' },
  { title: 'Treino 11', youtubeId: 'hk4FRMNc7SE' },
  { title: 'Treino 12', youtubeId: 'Mvno454KQLU' },
  { title: 'Treino 13', youtubeId: 'Z1Vzj5VHG_0' },
  { title: 'Treino 14', youtubeId: 'rq6nT58Unas' },
  { title: 'Treino 15', youtubeId: 'tppTT0CLbDs' },
  { title: 'Treino 16', youtubeId: 'Yc3MQ68xDlA' },
  { title: 'Treino 17', youtubeId: 'SZ7XHjJtV1g' },
  { title: 'Treino 18', youtubeId: '403IJnvnzDk' },
  { title: 'Treino 19', youtubeId: 'Fgy_mDLDj1c' },
  { title: 'Treino 20', youtubeId: '3e1iTkgkUlM' },
  { title: 'Treino 21', youtubeId: 'PpclnXQN15s' },
  { title: 'Treino 22', youtubeId: 'fb_bEVN49_s' },
  { title: 'Treino 23', youtubeId: 'QFFUzSp9Gbc' },
  { title: 'Treino 24', youtubeId: 'ZQu3RSb-o_g' },
  { title: 'Treino 25', youtubeId: 'ebG8qlOU6BQ' },
  { title: 'Treino 26', youtubeId: 'Y1TPqaX0LQg' },
  { title: 'Treino 27', youtubeId: '41x2UKDAJZQ' },
  { title: 'Treino 28', youtubeId: 'bIh7IjCvAK8' },
  { title: 'Treino 29', youtubeId: 'JwjLdxhVOCg' },
  { title: 'Treino 30', youtubeId: 'wthODRQLaB0' },
  { title: 'Treino 31', youtubeId: 'efeiRXDNSA4' },
  { title: 'Treino 32', youtubeId: 'eOpgIj2kvbY' },
];

async function run() {
  try {
    console.log('🔍 Procurando treino "intenso-adaptado" no Firestore...');
    const snap = await db
      .collection('trainings')
      .where('id', '==', 'intenso-adaptado')
      .limit(1)
      .get();

    if (snap.empty) {
      console.error('❌ Nenhum treino com id "intenso-adaptado" encontrado na coleção "trainings".');
      process.exit(1);
    }

    const docRef = snap.docs[0].ref;
    console.log('✅ Treino encontrado. Documento:', docRef.id);

    const modules = videos.map(v => ({
      title: v.title,
      videoUrl: `https://youtu.be/${v.youtubeId}`,
      youtubeId: v.youtubeId,
    }));

    await docRef.update({
      modules,
      duration: '32 treinos',
      comingSoon: false,
    });

    console.log('✅ Treino "INTENSO ADAPTADO" atualizado com', modules.length, 'módulos.');
  } catch (err) {
    console.error('❌ Erro ao atualizar treino:', err);
    process.exit(1);
  }

  process.exit(0);
}

run();

