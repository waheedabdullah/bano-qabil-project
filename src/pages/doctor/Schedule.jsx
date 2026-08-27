import { useEffect, useState } from "react";
import { DoctorNav } from "../../components/RoleNav";
import { useAuth } from "../../context/AuthContext";
import { getDoctor, updateDoctor } from "../../services/doctors";
import { DEFAULT_TIMES, WEEK_DAYS, defaultSchedule } from "../../utils/slots";

export default function DoctorSchedule() {
  const { user } = useAuth();
  const [days, setDays] = useState(defaultSchedule().days);
  const [times, setTimes] = useState(defaultSchedule().times);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    getDoctor(user.uid).then((data) => {
      if (!data?.schedule) return;
      setDays(data.schedule.days || defaultSchedule().days);
      setTimes(data.schedule.times || defaultSchedule().times);
    });
  }, [user]);

  function toggleDay(value) {
    setDays((prev) =>
      prev.includes(value) ? prev.filter((day) => day !== value) : [...prev, value].sort()
    );
  }

  function toggleTime(value) {
    setTimes((prev) =>
      prev.includes(value)
        ? prev.filter((time) => time !== value)
        : [...prev, value].sort()
    );
  }

  async function save(e) {
    e.preventDefault();
    await updateDoctor(user.uid, { schedule: { days, times } });
    setMessage("Schedule saved. Patients will see these slots.");
  }

  return (
    <DoctorNav>
      <p className="eyebrow">Al Shifa Clinic</p>
      <h1>My schedule</h1>
      <p className="muted">Set days and times patients can book at the clinic.</p>
      <form onSubmit={save}>
        {message && <p className="muted">{message}</p>}
        <p className="field-label">Working days</p>
        <div className="slot-grid">
          {WEEK_DAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              className={days.includes(day.value) ? "role-card active" : "role-card"}
              onClick={() => toggleDay(day.value)}
            >
              {day.label}
            </button>
          ))}
        </div>
        <p className="field-label">Time slots</p>
        <div className="slot-grid">
          {DEFAULT_TIMES.map((time) => (
            <button
              key={time}
              type="button"
              className={times.includes(time) ? "role-card active" : "ghost"}
              onClick={() => toggleTime(time)}
            >
              {time}
            </button>
          ))}
        </div>
        <button type="submit">Save schedule</button>
      </form>
    </DoctorNav>
  );
}
