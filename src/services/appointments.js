import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export const APPOINTMENT_STATUS = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export async function createAppointment(data) {
  const ref = await addDoc(collection(db, "appointments"), {
    ...data,
    status: "pending",
    notes: "",
    prescription: "",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getAppointments() {
  const snap = await getDocs(collection(db, "appointments"));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .sort((a, b) => `${b.date || ""} ${b.time || ""}`.localeCompare(`${a.date || ""} ${a.time || ""}`));
}

export async function getAppointmentsFor(field, value) {
  const all = await getAppointments();
  return all.filter((item) => item[field] === value);
}

export async function bookedTimes(doctorId, date) {
  const all = await getAppointments();
  return all
    .filter(
      (item) =>
        item.doctorId === doctorId &&
        item.date === date &&
        item.status !== "cancelled"
    )
    .map((item) => item.time);
}

export async function updateAppointment(id, data) {
  await updateDoc(doc(db, "appointments", id), data);
}

export async function deleteAppointment(id) {
  await deleteDoc(doc(db, "appointments", id));
}
