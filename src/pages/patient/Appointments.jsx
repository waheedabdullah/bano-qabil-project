import { useEffect, useState } from "react";
import { PatientNav } from "../../components/RoleNav";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { getAppointmentsFor, updateAppointment } from "../../services/appointments";
import { addNotification } from "../../services/notifications";

export default function PatientAppointments() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  function load() {
    if (!user) return;
    getAppointmentsFor("patientId", user.uid).then(setItems);
  }

  useEffect(load, [user]);

  async function cancel(item) {
    await updateAppointment(item.id, { status: "cancelled" });
    await addNotification(
      item.doctorId,
      `${item.patientName} cancelled ${item.date} at ${item.time}.`
    );
    load();
  }

  return (
    <PatientNav>
      <p className="eyebrow">Patient</p>
      <h1>Appointment history</h1>

      {items.length === 0 && <p className="muted">No appointments yet.</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>Dr. {item.doctorName}</td>
                <td>{item.date}</td>
                <td>{item.time}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td>
                  {(item.status === "pending" || item.status === "confirmed") && (
                    <button type="button" className="ghost" onClick={() => cancel(item)}>
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PatientNav>
  );
}
