import { useEffect, useState } from "react";
import { AdminNav } from "../../components/RoleNav";
import DeleteIconButton from "../../components/DeleteIconButton";
import { deleteDoctor } from "../../services/doctors";
import { approveDoctor } from "../../services/doctorSignup";
import { deletePatient, getUsers } from "../../services/users";
import { useAuth } from "../../context/AuthContext";

function statusLabel(user) {
  if (user.role === "admin") return "Admin";
  if (user.role === "doctor") {
    if (user.emailVerified === false) return "Email pending";
    if (user.approvalStatus === "pending") return "Pending approval";
    if (user.approvalStatus === "approved" || !user.approvalStatus) return "Approved";
    return String(user.approvalStatus);
  }
  return "Active";
}

export default function AdminDashboard() {
  const { user: authUser } = useAuth();
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const users = await getUsers();
      const list = users
        .filter((item) => item.role === "patient" || item.role === "doctor")
        .sort((a, b) => {
          const roleOrder = { doctor: 0, patient: 1 };
          const ra = roleOrder[a.role] ?? 2;
          const rb = roleOrder[b.role] ?? 2;
          if (ra !== rb) return ra - rb;
          return String(a.name || "").localeCompare(String(b.name || ""));
        });
      setRows(list);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id) {
    setMessage("");
    setBusyId(id);
    try {
      await approveDoctor(id);
      setMessage("Doctor approved.");
      await load();
    } catch {
      setMessage("Could not approve doctor.");
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(item) {
    if (item.id === authUser?.uid) {
      window.alert("You cannot delete your own account.");
      return;
    }
    const label = item.role === "doctor" ? `Dr. ${item.name}` : item.name;
    const ok = window.confirm(
      `Delete ${label}? Related appointments will also be removed.`
    );
    if (!ok) return;
    setBusyId(item.id);
    setMessage("");
    try {
      if (item.role === "doctor") {
        await deleteDoctor(item.id);
      } else {
        await deletePatient(item.id);
      }
      setMessage(`${label} deleted.`);
      await load();
    } catch (err) {
      console.error(err);
      setMessage("Could not delete user.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <AdminNav>
      <p className="eyebrow">Al Shifa Clinic</p>
      <h1>Users</h1>
      <p className="muted">
        Manage patients and doctors — name, email, role, status, and delete.
      </p>
      {message && <p className="success">{message}</p>}

      {loading ? (
        <div className="table-wrap admin-users-table table-loading-area">
          <div className="table-loader" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p className="muted">Loading users...</p>
          </div>
        </div>
      ) : error ? (
        <div className="table-wrap admin-users-table table-loading-area">
          <p className="error">{error}</p>
        </div>
      ) : (
        <div className="table-wrap admin-users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    No patients or doctors yet.
                  </td>
                </tr>
              )}
              {rows.map((item) => {
                const pendingDoctor =
                  item.role === "doctor" && item.approvalStatus === "pending";
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.role === "doctor" ? `Dr. ${item.name}` : item.name}
                      </strong>
                    </td>
                    <td>{item.email || "—"}</td>
                    <td>
                      <span className={`role-pill role-${item.role}`}>
                        {item.role === "doctor" ? "Doctor" : "Patient"}
                      </span>
                    </td>
                    <td>
                      <div className="status-cell">
                        <span>{statusLabel(item)}</span>
                        {pendingDoctor && (
                          <button
                            type="button"
                            className="primary-btn approve-btn"
                            disabled={busyId === item.id}
                            onClick={() => handleApprove(item.id)}
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <DeleteIconButton
                        disabled={busyId === item.id}
                        onClick={() => handleDelete(item)}
                        label={`Delete ${item.name}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminNav>
  );
}
