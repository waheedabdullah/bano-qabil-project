import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PatientNav } from "../../components/RoleNav";
import { useAuth } from "../../context/AuthContext";
import { getAppointmentsFor } from "../../services/appointments";
import StatusBadge from "../../components/StatusBadge";

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const [upcoming, setUpcoming] = useState([]);

  useEffect(() => {
    if (!user) return;
    getAppointmentsFor("patientId", user.uid).then((items) => {
      setUpcoming(
        items.filter((item) => item.status === "pending" || item.status === "confirmed")
      );
    });
  }, [user]);

  return (
    <PatientNav>
      <p className="eyebrow">Al Shifa Clinic</p>
      <h1>Hello, {profile?.name}</h1>
      <p className="muted">Book an Al Shifa Clinic doctor or check upcoming visits.</p>
      <Link className="button-link" to="/patient/doctors">
        Browse clinic doctors
      </Link>

      <h2>Upcoming</h2>
      {upcoming.length === 0 && <p className="muted">No upcoming appointments.</p>}
      <ul className="list">
        {upcoming.map((item) => (
          <li key={item.id}>
            <strong>Dr. {item.doctorName}</strong> — {item.date} {item.time}{" "}
            <StatusBadge status={item.status} />
          </li>
        ))}
      </ul>
    </PatientNav>
  );
}
