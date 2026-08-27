import { collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { normalizeRole } from "../utils/roles";

export async function getUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((item) => ({
    id: item.id,
    ...item.data(),
    role: normalizeRole(item.data().role),
  }));
}

export async function updateUser(id, data) {
  await updateDoc(doc(db, "users", id), data);
}

/** Remove patient profile + their appointments from Firestore. */
export async function deletePatient(id) {
  const appointments = await getDocs(collection(db, "appointments"));
  await Promise.all(
    appointments.docs
      .filter((item) => item.data().patientId === id)
      .map((item) => deleteDoc(item.ref))
  );
  await deleteDoc(doc(db, "users", id));
}
