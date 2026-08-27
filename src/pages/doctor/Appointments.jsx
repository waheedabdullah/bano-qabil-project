import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorNav } from "../../components/RoleNav";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { getAppointmentsFor } from "../../services/appointments";

export default function DoctorAppointments() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!user) return;
    getAppointmentsFor("doctorId", user.uid).then(setItems);
  }, [user]);

  return (
    <DoctorNav>
      <p className="eyebrow">Doctor</p>
      <h1>All appointments</h1>
      {items.length === 0 && <p className="muted">No appointments yet.</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.patientName}</td>
                <td>{item.date}</td>
                <td>{item.time}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td>
                  <Link to={`/doctor/appointments/${item.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DoctorNav>
  );
}
