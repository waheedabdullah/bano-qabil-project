import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homeForRole, normalizeRole } from "../utils/roles";
import { canDoctorLogin } from "../services/doctorSignup";

export default function ProtectedRoute({ role, children }) {
  const { user, profile, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <div className="page-center">
        <p>Profile not found. Please signup again.</p>
        <button type="button" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  const userRole = normalizeRole(profile.role);

  if (userRole === "doctor" && !canDoctorLogin(profile)) {
    return (
      <div className="page-center">
        <p>
          {profile.emailVerified === false
            ? "Complete the 6-digit email code on signup first."
            : "Waiting for admin approval. You can log in after approval."}
        </p>
        <button type="button" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  if (role && userRole !== role) {
    const home = homeForRole(userRole);
    if (home) {
      return <Navigate to={home} replace />;
    }
    return (
      <div className="page-center">
        <p>Unknown role in Firestore: {String(profile.role || "empty")}</p>
        <p className="muted">Set role to patient, doctor, or admin.</p>
        <button type="button" onClick={logout}>
          Log out
        </button>
      </div>
    );
  }

  return children;
}
