import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";

export async function addNotification(userId, message) {
  if (!userId) return;
  await addDoc(collection(db, "notifications"), {
    userId,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function getNotifications(userId) {
  const snap = await getDocs(collection(db, "notifications"));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => item.userId === userId)
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function markRead(id) {
  await updateDoc(doc(db, "notifications", id), { read: true });
}
