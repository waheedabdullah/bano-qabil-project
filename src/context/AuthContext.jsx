import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ensureDoctorDoc } from "../services/doctors";
import { normalizeRole } from "../utils/roles";
import { canDoctorLogin } from "../services/doctorSignup";

const AuthContext = createContext(null);

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) {
      setProfile(null);
      return null;
    }
    const data = { ...snap.data(), role: normalizeRole(snap.data().role) };
    if (data.role === "doctor") {
      await ensureDoctorDoc(uid, data);
    }
    setProfile(data);
    return data;
  }

  async function signup(name, email, password, role = "patient") {
    if (role === "doctor") {
      throw new Error("Use doctor signup flow with OTP verification.");
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const newProfile = {
      name,
      email,
      role: "patient",
      phone: "",
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, "users", cred.user.uid), newProfile);
    setProfile({ ...newProfile, createdAt: new Date() });
    return newProfile;
  }

  async function login(email, password) {
    setProfile(null);
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const data = await loadProfile(cred.user.uid);

    if (data?.role === "doctor" && !canDoctorLogin(data)) {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      const pendingEmail = data.emailVerified === false;
      const err = new Error(
        pendingEmail ? "EMAIL_NOT_VERIFIED" : "PENDING_APPROVAL"
      );
      err.code = pendingEmail ? "EMAIL_NOT_VERIFIED" : "PENDING_APPROVAL";
      throw err;
    }
    return data;
  }

  function logout() {
    return signOut(auth);
  }

  async function saveProfile(data) {
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), data);
    setProfile((prev) => ({ ...prev, ...data }));
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      try {
        if (currentUser) {
          const data = await loadProfile(currentUser.uid);
          // Pending doctors must wait for admin — do not stay logged in.
          if (data?.role === "doctor" && data.approvalStatus === "pending") {
            await signOut(auth);
            setUser(null);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error(err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signup, login, logout, saveProfile }}
    >
      {loading ? (
        <div className="page-center">
          <p>Loading Al Shifa Clinic...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
