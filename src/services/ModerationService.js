// Serviço de moderação: denúncias e bloqueio de usuários
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs } from 'firebase/firestore';

export async function reportContent({ reporterId, targetId, targetAuthorId, type, reason = 'inappropriate', context = {} }) {
  await addDoc(collection(db, 'reports'), {
    reporterId,
    targetId,
    targetAuthorId,
    type, // 'post' | 'comment' | 'video_comment'
    reason,
    context,
    createdAt: serverTimestamp(),
  });
}

export async function blockUser({ userId, blockedUserId }) {
  // userBlocks/{userId}/blocked/{blockedUserId}
  await setDoc(doc(db, 'userBlocks', userId, 'blocked', blockedUserId), {
    blockedUserId,
    createdAt: serverTimestamp(),
  });
}

export async function loadBlockedUserIds(userId) {
  const snap = await getDocs(collection(db, 'userBlocks', userId, 'blocked'));
  return new Set(snap.docs.map(d => d.id));
}







