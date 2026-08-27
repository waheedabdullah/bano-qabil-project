import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, getSecondaryAuth, storage } from "../firebase";
import { defaultSchedule } from "../utils/slots";

export function doctorDefaults(userData) {
  return {
    name: userData.name || "",
    email: userData.email || "",
    phone: userData.phone || "",
    specialization: userData.specialization || "General Physician",
    experience: userData.experience || "",
    bio: userData.bio || "",
    fee: Number(userData.fee) || 0,
    photoURL: userData.photoURL || "",
    available: true,
    clinic: "Al Shifa Clinic",
    schedule: defaultSchedule(),
    createdAt: serverTimestamp(),
  };
}

export async function ensureDoctorDoc(uid, userData) {
  const refDoc = doc(db, "doctors", uid);
  const snap = await getDoc(refDoc);
  if (!snap.exists()) {
    await setDoc(refDoc, doctorDefaults(userData));
  } else {
    const data = snap.data();
    const patch = {};
    if (!data.schedule) patch.schedule = defaultSchedule();
    if (!data.clinic) patch.clinic = "Al Shifa Clinic";
    if (Object.keys(patch).length) await updateDoc(refDoc, patch);
  }
  return refDoc;
}

/** Admin creates a doctor login + profile without leaving admin session. */
export async function createDoctorAccount({
  name,
  email,
  password,
  specialization,
  phone = "",
}) {
  const secondaryAuth = getSecondaryAuth();
  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password
  );
  const uid = cred.user.uid;

  await setDoc(doc(db, "users", uid), {
    name,
    email,
    role: "doctor",
    phone,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    doc(db, "doctors", uid),
    doctorDefaults({ name, email, phone, specialization })
  );

  await signOut(secondaryAuth);
  return uid;
}

export async function getDoctors() {
  const snap = await getDocs(collection(db, "doctors"));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getDoctor(id) {
  const snap = await getDoc(doc(db, "doctors", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateDoctor(id, data) {
  await updateDoc(doc(db, "doctors", id), data);
}

/** Remove doctor profile, user doc, and related appointments. */
export async function deleteDoctor(id) {
  const appointments = await getDocs(collection(db, "appointments"));
  await Promise.all(
    appointments.docs
      .filter((item) => item.data().doctorId === id)
      .map((item) => deleteDoc(item.ref))
  );
  await deleteDoc(doc(db, "doctors", id));
  try {
    await deleteDoc(doc(db, "users", id));
  } catch {
    // user doc may already be missing
  }
}

export async function uploadDoctorPhoto(uid, file) {
  const photoRef = ref(storage, `doctors/${uid}/${Date.now()}_${file.name}`);
  await uploadBytes(photoRef, file);
  return getDownloadURL(photoRef);
}
