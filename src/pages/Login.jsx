import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import PasswordField from "../components/PasswordField";
import { homeForRole } from "../utils/roles";

function errorMessage(code) {
  if (code === "PENDING_APPROVAL") {
    return "Your account is waiting for admin approval. Try again after approval.";
  }
  if (code === "EMAIL_NOT_VERIFIED") {
    return "Please complete the 6-digit email verification from signup first.";
  }
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Incorrect email or password.";
  }
  if (code === "auth/user-not-found") return "No account found with this email.";
  return "Login failed. Please try again.";
}

export default function Login() {
  const { user, profile, login, logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [switching, setSwitching] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (user) {
        await logout();
      }
      const data = await login(form.email, form.password);
      navigate(homeForRole(data?.role) || "/patient");
    } catch (err) {
      setError(errorMessage(err.code));
    } finally {
      setSaving(false);
    }
  }

  async function switchAccount() {
    setSwitching(true);
    await logout();
    setSwitching(false);
  }

  if (user && profile && !switching) {
    return (
      <AuthShell
        title="Already signed in"
        subtitle={`${profile.name} is logged in as ${profile.role}.`}
      >
        <div className="auth-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => navigate(homeForRole(profile.role) || "/login")}
          >
            Continue to {profile.role} panel
          </button>
          <button type="button" className="ghost" onClick={switchAccount}>
            Use another account
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to Al Shifa Clinic as patient, doctor, or admin."
      footer={
        <p className="auth-footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} autoComplete="off">
        {error && <p className="error">{error}</p>}

        <label>
          Email
          <input
            type="text"
            placeholder="Enter your email"
            inputMode="email"
            name="clinic-email"
            autoComplete="off"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            readOnly
            onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
            required
          />
        </label>

        <label>
          Password
          <PasswordField
            placeholder="character 1-8"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? "Signing in..." : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
