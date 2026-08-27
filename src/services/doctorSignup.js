import {
  collection,
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
  signOut,
} from "firebase/auth";
import { auth, db } from "../firebase";
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

/** Check Firestore + Auth before sending OTP (not after verify). */
async function assertEmailAvailable(email) {
  const normalized = email.trim().toLowerCase();

  try {
    const [usersSnap, doctorsSnap] = await Promise.all([
      getDocs(collection(db, "users")),
      getDocs(collection(db, "doctors")),
    ]);

    const inUsers = usersSnap.docs.some(
      (item) => String(item.data().email || "").toLowerCase() === normalized
    );
    const inDoctors = doctorsSnap.docs.some(
      (item) => String(item.data().email || "").toLowerCase() === normalized
    );
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

  try {
    const methods = await fetchSignInMethodsForEmail(auth, normalized);
    if (methods.length > 0) {
      throw emailInUseError();
    }
  } catch (err) {
    if (err?.code === "auth/email-already-in-use" || err?.message === "EMAIL_IN_USE") {
      throw err;
    }
    // Enumeration protection may hide Auth methods — Firestore check above is primary
  }
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

  try {
    await assertEmailAvailable(email);
  } catch (err) {
    clearPendingOtp();
    throw err;
  }

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(
      auth,
      email,
      details.password
    );
  } catch (err) {
    clearPendingOtp();
    throw err;
  }

  const uid = cred.user.uid;

  try {
    await setDoc(doc(db, "users", uid), {
      name: pending.name || details.name,
      email,
      role: "doctor",
      phone: pending.phone || details.phone || "",
      approvalStatus: "pending",
      emailVerified: true,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, "doctors", uid), {
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
  } catch (err) {
    console.error("Doctor profile write failed:", err);
    await signOut(auth);
    throw err;
  }

  clearPendingOtp();
  await signOut(auth);

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
