import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import PasswordField from "../components/PasswordField";
import { homeForRole } from "../utils/roles";
import { SPECIALIZATIONS } from "../data/specializations";
import {
  checkDoctorEmailAvailable,
  completeDoctorSignupAfterOtp,
  sendDoctorSignupOtp,
} from "../services/doctorSignup";

function patientError(code) {
  if (code === "auth/email-already-in-use") return "This email is already registered.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  return "Signup failed. Please try again.";
}

function doctorError(err) {
  const code = err?.code || "";
  const msg = err?.message || "";
  if (msg === "OTP_INVALID") return "Wrong 6-digit code.";
  if (msg === "OTP_EXPIRED") return "Code expired. Request a new one.";
  if (msg === "OTP_MISSING") return "No code found. Start signup again.";
  if (code === "INVALID_DETAILS" || msg === "INVALID_DETAILS") {
    return "Name, valid email, and password (6+ chars) required.";
  }
  if (msg === "EMAIL_IN_USE" || code === "auth/email-already-in-use") {
    return "This email is already registered.";
  }
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "permission-denied") {
    return "Permission error. Check Firestore rules, then refresh and try again.";
  }
  if (code === "unavailable" || code === "auth/network-request-failed") {
    return "Network error. Check your internet connection and try again.";
  }
  if (code === "EMAIL_NOT_CONFIGURED" || msg === "EMAIL_NOT_CONFIGURED") {
    return "Email is not set up. Add GMAIL_USER and GMAIL_APP_PASSWORD in .env, then restart npm run dev.";
  }
  if (code === "EMAIL_SEND_FAILED" || msg === "EMAIL_SEND_FAILED") {
    return "Could not send OTP email. Check Gmail App Password, spam folder, or .env values.";
  }
  console.error("Doctor signup error:", code, msg, err);
  return code
    ? `Signup failed (${code}). Try again.`
    : "Could not complete doctor signup. Try again.";
}

function ReqMark() {
  return (
    <span className="req-star" aria-hidden="true">
      *
    </span>
  );
}

const emptyDoctor = {
  name: "",
  email: "",
  password: "",
  phone: "",
  specialization: "General Physician",
  experience: "",
  bio: "",
  fee: "",
};

export default function Signup() {
  const { user, profile, signup } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("patient");
  const [patient, setPatient] = useState({ name: "", email: "", password: "" });
  const [doctor, setDoctor] = useState(emptyDoctor);
  const [step, setStep] = useState("form");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [emailTaken, setEmailTaken] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const emailCheckTimer = useRef(null);
  const emailCheckId = useRef(0);

  useEffect(() => {
    return () => {
      if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    };
  }, []);

  if (user && profile && canShowLoggedIn(profile, step)) {
    return <Navigate to={homeForRole(profile.role) || "/login"} replace />;
  }

  function updatePatient(field, value) {
    setPatient((prev) => ({ ...prev, [field]: value }));
  }

  function updateDoctor(field, value) {
    setDoctor((prev) => ({ ...prev, [field]: value }));
    if (field === "email") {
      setEmailTaken(false);
      setError("");
      scheduleEmailCheck(value);
    }
  }

  function scheduleEmailCheck(rawEmail) {
    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!email || !email.includes("@") || !email.includes(".")) {
      setCheckingEmail(false);
      setEmailTaken(false);
      return;
    }
    emailCheckTimer.current = setTimeout(() => {
      validateDoctorEmail(email);
    }, 450);
  }

  async function validateDoctorEmail(rawEmail) {
    const email = String(rawEmail || "").trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setEmailTaken(false);
      return true;
    }
    const requestId = ++emailCheckId.current;
    setCheckingEmail(true);
    try {
      const result = await checkDoctorEmailAvailable(email);
      if (requestId !== emailCheckId.current) return true;
      if (!result.available) {
        setEmailTaken(true);
        setError("This email is already registered.");
        return false;
      }
      setEmailTaken(false);
      setError("");
      return true;
    } catch (err) {
      if (requestId !== emailCheckId.current) return false;
      setEmailTaken(false);
      setError(doctorError(err));
      return false;
    } finally {
      if (requestId === emailCheckId.current) {
        setCheckingEmail(false);
      }
    }
  }

  async function handlePatientSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const created = await signup(
        patient.name,
        patient.email,
        patient.password,
        "patient"
      );
      navigate(homeForRole(created.role) || "/patient");
    } catch (err) {
      setError(patientError(err.code));
    } finally {
      setSaving(false);
    }
  }

  async function handleDoctorDetails(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSaving(true);
    try {
      const ok = await validateDoctorEmail(doctor.email);
      if (!ok) {
        return;
      }
      await sendDoctorSignupOtp(doctor);
      setOtp("");
      setStep("otp");
    } catch (err) {
      setError(doctorError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSaving(true);
    try {
      await completeDoctorSignupAfterOtp(doctor, otp);
      setStep("done");
    } catch (err) {
      const code = err?.code || "";
      const msg = err?.message || "";
      if (msg === "EMAIL_IN_USE" || code === "auth/email-already-in-use") {
        setStep("form");
        setOtp("");
      }
      setError(doctorError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setInfo("");
    setSaving(true);
    try {
      await sendDoctorSignupOtp(doctor);
      setOtp("");
      setInfo("New code sent to your email. Check inbox and spam.");
    } catch (err) {
      setError(doctorError(err));
    } finally {
      setSaving(false);
    }
  }

  if (step === "done") {
    return (
      <AuthShell
        title="Account created"
        subtitle="You can log in after an admin approves your account."
        footer={
          <p className="auth-footer">
            <Link to="/login">Go to login</Link>
          </p>
        }
      >
        <div className="success-box">
          <p>
            Your email was verified and your account was created. It is now
            waiting for admin approval. Log in after you are approved.
          </p>
        </div>
      </AuthShell>
    );
  }

  if (role === "doctor" && step === "otp") {
    return (
      <AuthShell
        title="Enter verification code"
        subtitle={`A 6-digit code was sent to ${doctor.email}`}
      >
        <form onSubmit={handleVerifyOtp} autoComplete="off">
          {error && <p className="error">{error}</p>}
          {info && <p className="success">{info}</p>}
          <p className="muted hint-text">
            Check your inbox and spam folder. After you enter the code, your
            account will be created.
          </p>
          <label>
            6-digit code
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
            />
          </label>
          <button type="submit" className="primary-btn" disabled={saving || otp.length !== 6}>
            {saving ? "Creating account..." : "Verify & create account"}
          </button>
          <button
            type="button"
            className="ghost"
            disabled={saving}
            onClick={handleResendOtp}
            style={{ marginTop: "0.75rem" }}
          >
            Resend code
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create account"
      subtitle={
        role === "doctor"
          ? "Doctor signup — verify with a 6-digit email code, then create your account."
          : "Sign up as a patient for Al Shifa Clinic."
      }
      footer={
        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      }
    >
      {role === "patient" ? (
        <form onSubmit={handlePatientSubmit} autoComplete="off">
          {error && <p className="error">{error}</p>}

          <label>
            <span>Full name <ReqMark /></span>
            <input
              name="clinic-name"
              autoComplete="off"
              value={patient.name}
              onChange={(e) => updatePatient("name", e.target.value)}
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
              required
            />
          </label>

          <label>
            <span>Email <ReqMark /></span>
            <input
              type="text"
              inputMode="email"
              name="clinic-signup-email"
              autoComplete="off"
              value={patient.email}
              onChange={(e) => updatePatient("email", e.target.value)}
              readOnly
              onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
              required
            />
          </label>

          <label>
            <span>Password <ReqMark /></span>
            <PasswordField
              value={patient.password}
              onChange={(e) => updatePatient("password", e.target.value)}
              minLength={6}
              name="clinic-signup-password"
            />
          </label>

          <label>
            <span>Role <ReqMark /></span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError("");
                setInfo("");
                setEmailTaken(false);
                setStep("form");
                setOtp("");
              }}
              required
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </label>

          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? "Creating..." : "Create patient account"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleDoctorDetails} autoComplete="off">
          {error && <p className="error">{error}</p>}

          <div className="form-grid">
            <label>
              <span>Full name <ReqMark /></span>
              <input
                value={doctor.name}
                onChange={(e) => updateDoctor("name", e.target.value)}
                required
              />
            </label>
            <label>
              <span>Email <ReqMark /></span>
              <input
                type="email"
                value={doctor.email}
                onChange={(e) => updateDoctor("email", e.target.value)}
                onBlur={(e) => validateDoctorEmail(e.target.value)}
                required
              />
            </label>
            <label>
              <span>Password <ReqMark /></span>
              <PasswordField
                value={doctor.password}
                onChange={(e) => updateDoctor("password", e.target.value)}
                minLength={6}
                name="doctor-signup-password"
              />
            </label>
            <label>
              <span>Phone <ReqMark /></span>
              <input
                value={doctor.phone}
                onChange={(e) => updateDoctor("phone", e.target.value)}
                required
              />
            </label>
            <label>
              <span>Specialization <ReqMark /></span>
              <select
                value={doctor.specialization}
                onChange={(e) => updateDoctor("specialization", e.target.value)}
                required
              >
                {SPECIALIZATIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Experience <ReqMark /></span>
              <input
                value={doctor.experience}
                onChange={(e) => updateDoctor("experience", e.target.value)}
                required
              />
            </label>
            <label>
              <span>Fee (Rs) <ReqMark /></span>
              <input
                type="number"
                min="0"
                value={doctor.fee}
                onChange={(e) => updateDoctor("fee", e.target.value)}
                required
              />
            </label>
          </div>

          <label>
            About
            <textarea
              rows={3}
              value={doctor.bio}
              onChange={(e) => updateDoctor("bio", e.target.value)}
            />
          </label>

          <label>
            <span>Role <ReqMark /></span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setError("");
                setInfo("");
                setEmailTaken(false);
                setStep("form");
                setOtp("");
              }}
              required
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </label>

          <button
            type="submit"
            className="primary-btn"
            disabled={saving || checkingEmail || emailTaken}
          >
            {saving ? "Sending code..." : "Send 6-digit code"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

function canShowLoggedIn(profile, step) {
  if (step === "otp") return false;
  if (profile.role === "doctor" && profile.approvalStatus === "pending") {
    return false;
  }
  return true;
}
