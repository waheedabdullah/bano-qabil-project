import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DoctorNav } from "../../components/RoleNav";
import StatusBadge from "../../components/StatusBadge";
import { useAuth } from "../../context/AuthContext";
import { getAppointmentsFor } from "../../services/appointments";
import { todayISO } from "../../utils/slots";

export default function DoctorDashboard() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState([]);
  const today = todayISO();

  useEffect(() => {
    if (!user) return;
    getAppointmentsFor("doctorId", user.uid).then((rows) => {
      setItems(rows.filter((item) => item.date === today && item.status !== "cancelled"));
    });
  }, [user, today]);

  return (
    <DoctorNav>
      <p className="eyebrow">Al Shifa Clinic</p>
      <h1>Hello, Dr. {profile?.name}</h1>
      <p className="muted">Today&apos;s clinic appointments — {today}</p>

      {items.length === 0 && <p className="muted">No appointments today.</p>}
      <ul className="list">
        {items.map((item) => (
          <li key={item.id}>
            <Link to={`/doctor/appointments/${item.id}`}>
              {item.time} — {item.patientName} <StatusBadge status={item.status} />
            </Link>
          </li>
        ))}
      </ul>
    </DoctorNav>
  );
}
