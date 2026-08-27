import { useEffect, useState } from "react";
import { AdminNav } from "../../components/RoleNav";
import DeleteIconButton from "../../components/DeleteIconButton";
import StatusBadge from "../../components/StatusBadge";
import {
  APPOINTMENT_STATUS,
  deleteAppointment,
  getAppointments,
  updateAppointment,
} from "../../services/appointments";
import { addNotification } from "../../services/notifications";

export default function AdminAppointments() {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      const rows = await getAppointments();
      setItems(rows);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function changeStatus(item, status) {
    setBusyId(item.id);
    try {
      await updateAppointment(item.id, { status });
      await addNotification(
        item.patientId,
        `Admin set your appointment on ${item.date} to ${status}.`
      );
      await addNotification(
        item.doctorId,
        `Admin set ${item.patientName}'s appointment to ${status}.`
      );
      await load();
    } finally {
      setBusyId("");
    }
  }

  async function handleDelete(item) {
    const ok = window.confirm(
      `Delete appointment for ${item.patientName} with Dr. ${item.doctorName} on ${item.date}?`
    );
    if (!ok) return;
    setBusyId(item.id);
    try {
      await deleteAppointment(item.id);
      await load();
    } catch (err) {
      console.error(err);
      window.alert("Could not delete appointment.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <AdminNav>
      <p className="eyebrow">Admin</p>
      <h1>Appointment management</h1>

      {loading ? (
        <div className="table-wrap admin-appointments-table table-loading-area">
          <div className="table-loader" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <p className="muted">Loading appointments...</p>
          </div>
        </div>
      ) : error ? (
        <div className="table-wrap admin-appointments-table table-loading-area">
          <p className="error">{error}</p>
        </div>
      ) : (
        <div className="table-wrap admin-appointments-table">
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Update</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    No appointments yet.
                  </td>
                </tr>
              )}
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.patientName}</td>
                  <td>Dr. {item.doctorName}</td>
                  <td>{item.date}</td>
                  <td>{item.time}</td>
                  <td className="appt-status-col">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="appt-update-col">
                    <select
                      value={item.status}
                      disabled={busyId === item.id}
                      onChange={(e) => changeStatus(item, e.target.value)}
                    >
                      {APPOINTMENT_STATUS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="appt-delete-col">
                    <DeleteIconButton
                      disabled={busyId === item.id}
                      onClick={() => handleDelete(item)}
                      label={`Delete appointment for ${item.patientName}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminNav>
  );
}
