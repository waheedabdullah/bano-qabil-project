import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PatientNav } from "../../components/RoleNav";
import { useAuth } from "../../context/AuthContext";
import { getDoctor } from "../../services/doctors";
import { bookedTimes, createAppointment } from "../../services/appointments";
import { addNotification } from "../../services/notifications";
import { openSlots, todayISO } from "../../utils/slots";

export default function DoctorProfile() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getDoctor(id).then(setDoctor);
  }, [id]);

  useEffect(() => {
    if (!doctor) return;
    bookedTimes(doctor.id, date).then((taken) => {
      setSlots(openSlots(date, doctor.schedule, taken));
    });
  }, [doctor, date]);

  async function book(time) {
    setSaving(true);
    setMessage("");
    try {
      await createAppointment({
        patientId: user.uid,
        patientName: profile.name,
        patientEmail: profile.email,
        doctorId: doctor.id,
        doctorName: doctor.name,
        specialization: doctor.specialization || "General Physician",
        date,
        time,
        clinic: "Al Shifa Clinic",
      });
      await addNotification(
        doctor.id,
        `${profile.name} booked ${date} at ${time} at Al Shifa Clinic.`
      );
      await addNotification(
        user.uid,
        `Appointment requested with Dr. ${doctor.name} on ${date} at ${time}.`
      );
      const taken = await bookedTimes(doctor.id, date);
      setSlots(openSlots(date, doctor.schedule, taken));
      setMessage("Appointment requested. Wait for doctor confirmation.");
    } catch {
      setMessage("Could not book this slot.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PatientNav>
      <Link to="/patient/doctors">← Back to doctors</Link>

      {!doctor && <p className="muted">Loading profile...</p>}

      {doctor && (
        <div className="doctor-detail">
          <div className="doctor-detail-head">
            <div className="avatar-lg">
              {doctor.photoURL ? (
                <img src={doctor.photoURL} alt={doctor.name} />
              ) : (
                <span>Dr</span>
              )}
            </div>
            <div>
              <p className="eyebrow">{doctor.specialization || "General Physician"}</p>
              <h1>Dr. {doctor.name}</h1>
              <p className="muted">Al Shifa Clinic</p>
            </div>
          </div>

          <div className="detail-grid">
            <section className="panel">
              <h2>About</h2>
              <p>{doctor.bio || "No bio added yet."}</p>
              <p>
                <strong>Experience:</strong> {doctor.experience || "Not added"}
              </p>
              <p>
                <strong>Fee:</strong>{" "}
                {doctor.fee ? `Rs ${doctor.fee}` : "Not set"}
              </p>
            </section>

            <section className="panel">
              <h2>Available slots</h2>
              <label>
                Date
                <input
                  type="date"
                  min={todayISO()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              {message && <p className="muted">{message}</p>}
              {slots.length === 0 && (
                <p className="muted">No slots on this date. Try another day.</p>
              )}
              <div className="slot-grid">
                {slots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className="ghost slot-btn"
                    disabled={saving}
                    onClick={() => book(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </PatientNav>
  );
}
