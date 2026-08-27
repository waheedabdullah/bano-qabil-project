import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DoctorNav } from "../../components/RoleNav";
import StatusBadge from "../../components/StatusBadge";
import { APPOINTMENT_STATUS, getAppointments, updateAppointment } from "../../services/appointments";
import { addNotification } from "../../services/notifications";

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [notes, setNotes] = useState("");
  const [prescription, setPrescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAppointments().then((rows) => {
      const found = rows.find((row) => row.id === id);
      if (!found) return;
      setItem(found);
      setNotes(found.notes || "");
      setPrescription(found.prescription || "");
      setStatus(found.status || "pending");
    });
  }, [id]);

  async function save(e) {
    e.preventDefault();
    await updateAppointment(id, { notes, prescription, status });
    await addNotification(
      item.patientId,
      `Dr. ${item.doctorName} updated your appointment (${status}).`
    );
    setMessage("Saved.");
  }

  if (!item) {
    return (
      <DoctorNav>
        <p className="muted">Loading...</p>
      </DoctorNav>
    );
  }

  return (
    <DoctorNav>
      <Link to="/doctor/appointments">← All appointments</Link>
      <p className="eyebrow">Patient details</p>
      <h1>{item.patientName}</h1>
      <p className="muted">{item.patientEmail}</p>
      <p>
        {item.date} at {item.time} <StatusBadge status={status} />
      </p>

      <form onSubmit={save}>
        {message && <p className="muted">{message}</p>}
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {APPOINTMENT_STATUS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Medical notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
        </label>
        <label>
          Prescription
          <textarea
            value={prescription}
            onChange={(e) => setPrescription(e.target.value)}
            rows={4}
          />
        </label>
        <button type="submit">Save</button>
      </form>
    </DoctorNav>
  );
}
