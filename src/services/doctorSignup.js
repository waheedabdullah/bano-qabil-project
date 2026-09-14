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
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db, getSecondaryAuth, getSecondaryDb } from "../firebase";
import { doctorDefaults } from "./doctors";
import { sendOtpEmail } from "./email";

const OTP_STORAGE_KEY = "alshifa_doctor_signup_otp";

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function savePendingOtp(payload) {
  sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(payload));
}

function readPendingOtp() {
  try {
    const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearPendingOtp() {
  sessionStorage.removeItem(OTP_STORAGE_KEY);
}

function emailInUseError() {
  const err = new Error("EMAIL_IN_USE");
  err.code = "auth/email-already-in-use";
  return err;
}

/** True when this email already belongs to a finished account (not pending doctor). */
function blocksDoctorSignup(data, fromCollection) {
  if (!data) return false;
  if (fromCollection === "users") {
    const role = String(data.role || "").toLowerCase();
    if (role === "patient" || role === "admin") return true;
    if (role === "doctor") {
      const status = data.approvalStatus;
      // Pending incomplete signup can be reclaimed after OTP.
      if (status === "pending") return false;
      return true;
    }
    return true;
  }
  const status = data.approvalStatus;
  if (status === "pending") return false;
  return true;
}

/** Check Firestore before sending OTP. Auth leftovers are reclaimed on verify. */
async function assertEmailAvailable(email) {
  const normalized = email.trim().toLowerCase();

  try {
    const [usersSnap, doctorsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "doctors")),
    ]);

    const inUsers = usersSnap.docs.some((item) => {
      const data = item.data();
      return (
        String(data.email || "").toLowerCase() === normalized &&
        blocksDoctorSignup(data, "users")
      );
    });
    const inDoctors = doctorsSnap.docs.some((item) => {
      const data = item.data();
      return (
        String(data.email || "").toLowerCase() === normalized &&
        blocksDoctorSignup(data, "doctors")
      );
    });
    if (inUsers || inDoctors) {
      throw emailInUseError();
    }
  } catch (err) {
    if (err?.code === "auth/email-already-in-use" || err?.message === "EMAIL_IN_USE") {
      throw err;
    }
    if (err?.code === "permission-denied") {
      const rulesErr = new Error(
        "Cannot check email. Publish Firestore rules from firestore.rules (users/doctors read: true)."
      );
      rulesErr.code = "permission-denied";
      throw rulesErr;
    }
    throw err;
  }

  // Auth-only leftovers are OK — verify step signs in and finishes profiles.
  try {
    await fetchSignInMethodsForEmail(auth, normalized);
  } catch {
    // ignore enumeration / network
  }
}

async function writePendingDoctorProfiles(uid, pending, details, email, firestore) {
  await setDoc(doc(firestore, "users", uid), {
    name: pending.name || details.name,
    email,
    role: "doctor",
    phone: pending.phone || details.phone || "",
    approvalStatus: "pending",
    emailVerified: true,
    createdAt: serverTimestamp(),
  });

  await setDoc(doc(firestore, "doctors", uid), {
    ...doctorDefaults({
      name: pending.name || details.name,
      email,
      phone: pending.phone || details.phone,
      specialization: pending.specialization || details.specialization,
      experience: pending.experience || details.experience,
      bio: pending.bio || details.bio,
      fee: pending.fee || details.fee,
    }),
    approvalStatus: "pending",
    available: false,
  });

  // Remove orphan pending profiles left by earlier failed attempts.
  const [usersSnap, doctorsSnap] = await Promise.all([
    getDocs(collection(firestore, "users")),
    getDocs(collection(firestore, "doctors")),
  ]);
  const removals = [];
  for (const item of usersSnap.docs) {
    if (item.id === uid) continue;
    const data = item.data();
    if (
      String(data.email || "").toLowerCase() === email &&
      data.approvalStatus === "pending"
    ) {
      removals.push(deleteDoc(item.ref));
    }
  }
  for (const item of doctorsSnap.docs) {
    if (item.id === uid) continue;
    const data = item.data();
    if (
      String(data.email || "").toLowerCase() === email &&
      data.approvalStatus === "pending"
    ) {
      removals.push(deleteDoc(item.ref));
    }
  }
  if (removals.length) await Promise.all(removals);
}

/** Public helper — call from signup form when doctor types email. */
export async function checkDoctorEmailAvailable(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) {
    return { available: true };
  }
  try {
    await assertEmailAvailable(normalized);
    return { available: true };
  } catch (err) {
    if (err?.code === "auth/email-already-in-use" || err?.message === "EMAIL_IN_USE") {
      return { available: false };
    }
    throw err;
  }
}

/**
 * Step 1 — No Auth account yet.
 * Reject used emails here (before OTP email is sent).
 */
export async function sendDoctorSignupOtp(details) {
  const email = details.email.trim().toLowerCase();
  if (!email || !details.password || details.password.length < 6) {
    const err = new Error("INVALID_DETAILS");
    err.code = "INVALID_DETAILS";
    throw err;
  }

  await assertEmailAvailable(email);

  const otp = makeOtp();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  try {
    await sendOtpEmail(email, details.name, otp);
  } catch (err) {
    clearPendingOtp();
    throw err;
  }

  savePendingOtp({
    email,
    name: details.name,
    phone: details.phone || "",
    specialization: details.specialization || "General Physician",
    experience: details.experience || "",
    bio: details.bio || "",
    fee: details.fee || "",
    otp,
    expiresAt,
  });

  return { email, emailSent: true };
}

/**
 * Step 2 — OTP correct → create Auth + Firestore account (pending admin).
 * Uses secondary Auth so primary session / AuthContext never races with writes.
 * If Auth already exists from a partial signup, sign in with the same password and finish profiles.
 */
export async function completeDoctorSignupAfterOtp(details, otpInput) {
  const email = details.email.trim().toLowerCase();
  const pending = readPendingOtp();

  if (!pending || pending.email !== email) {
    throw new Error("OTP_MISSING");
  }
  if (Date.now() > (pending.expiresAt || 0)) {
    clearPendingOtp();
    throw new Error("OTP_EXPIRED");
  }
  if (String(pending.otp) !== String(otpInput).trim()) {
    throw new Error("OTP_INVALID");
  }

  const secondaryAuth = getSecondaryAuth();
  const secondaryDb = getSecondaryDb();
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      details.password
    );
  } catch (err) {
    if (err?.code !== "auth/email-already-in-use") {
      clearPendingOtp();
      throw err;
    }
    // Partial signup leftover — reclaim if password matches.
    try {
      cred = await signInWithEmailAndPassword(
        secondaryAuth,
        email,
        details.password
      );
    } catch {
      clearPendingOtp();
      throw emailInUseError();
    }
  }

  const uid = cred.user.uid;

  try {
    await writePendingDoctorProfiles(uid, pending, details, email, secondaryDb);
  } catch (err) {
    console.error("Doctor profile write failed:", err);
    try {
      await signOut(secondaryAuth);
    } catch {
      // ignore
    }
    throw err;
  }

  clearPendingOtp();
  await signOut(secondaryAuth);

  return { uid, email, name: pending.name || details.name };
}

export async function getPendingDoctors() {
  const snap = await getDocs(collection(db, "doctors"));
  return snap.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => item.approvalStatus === "pending");
}

export async function approveDoctor(doctorId) {
  const doctorSnap = await getDoc(doc(db, "doctors", doctorId));
  if (!doctorSnap.exists()) throw new Error("NOT_FOUND");
  const doctor = { id: doctorSnap.id, ...doctorSnap.data() };

  await updateDoc(doc(db, "doctors", doctorId), {
    approvalStatus: "approved",
    available: true,
  });
  await updateDoc(doc(db, "users", doctorId), {
    approvalStatus: "approved",
  });

  return doctor;
}

/** Existing doctors without approvalStatus count as approved. */
export function isDoctorApproved(profileOrDoctor) {
  if (!profileOrDoctor) return false;
  const status = profileOrDoctor.approvalStatus;
  if (!status) return true;
  return status === "approved";
}

/** Login only after OTP (emailVerified) AND admin approved. */
export function canDoctorLogin(profile) {
  if (!profile || profile.role !== "doctor") return true;
  if (profile.emailVerified === false) return false;
  return isDoctorApproved(profile);
}
