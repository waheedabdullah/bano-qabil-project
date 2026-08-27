import { useState } from "react";
import { PatientNav } from "../../components/RoleNav";
import { useAuth } from "../../context/AuthContext";

export default function PatientProfile() {
  const { profile, saveProfile } = useAuth();
  const [form, setForm] = useState({
    name: profile?.name || "",
    phone: profile?.phone || "",
  });
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await saveProfile(form);
    setMessage("Profile saved.");
  }

  return (
    <PatientNav>
      <p className="eyebrow">Patient</p>
      <h1>My profile</h1>
      <form onSubmit={handleSubmit}>
        {message && <p className="muted">{message}</p>}
        <label>
          Full name
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label>
          Email
          <input value={profile?.email || ""} disabled />
        </label>
        <button type="submit">Save</button>
      </form>
    </PatientNav>
  );
}
