import { useEffect, useState } from "react";
import { DoctorNav } from "../../components/RoleNav";
import { SPECIALIZATIONS } from "../../data/specializations";
import {
  getDoctor,
  updateDoctor,
  uploadDoctorPhoto,
} from "../../services/doctors";
import { useAuth } from "../../context/AuthContext";

export default function DoctorProfileEdit() {
  const { user, saveProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    specialization: "General Physician",
    experience: "",
    bio: "",
    fee: "",
    phone: "",
    photoURL: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoctor(user.uid).then((data) => {
      if (!data) return;
      setForm({
        name: data.name || "",
        specialization: data.specialization || "General Physician",
        experience: data.experience || "",
        bio: data.bio || "",
        fee: data.fee || "",
        phone: data.phone || "",
        photoURL: data.photoURL || "",
      });
    });
  }, [user]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      let photoURL = form.photoURL;
      if (photoFile) {
        photoURL = await uploadDoctorPhoto(user.uid, photoFile);
      }
      const payload = {
        name: form.name,
        specialization: form.specialization,
        experience: form.experience,
        bio: form.bio,
        fee: Number(form.fee) || 0,
        phone: form.phone,
        photoURL,
      };
      await updateDoctor(user.uid, payload);
      await saveProfile({ name: form.name, phone: form.phone });
      setForm((prev) => ({ ...prev, photoURL }));
      setPhotoFile(null);
      setMessage("Profile saved. Patients can see your Al Shifa Clinic profile.");
    } catch {
      setMessage("Could not save profile. Check Storage is enabled in Firebase.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DoctorNav>
      <p className="eyebrow">Doctor</p>
      <h1>My clinic profile</h1>
      <p className="muted">
        Complete your Al Shifa Clinic profile so patients can choose you.
      </p>

      <form className="panel-form" onSubmit={handleSubmit}>
        {message && <p className="muted">{message}</p>}

        <div className="profile-photo-row">
          <div className="avatar-lg">
            {form.photoURL ? (
              <img src={form.photoURL} alt={form.name} />
            ) : (
              <span>Dr</span>
            )}
          </div>
          <label>
            Profile photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="form-grid">
          <label>
            Full name
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </label>
          <label>
            Specialization
            <select
              value={form.specialization}
              onChange={(e) => update("specialization", e.target.value)}
            >
              {SPECIALIZATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            Experience
            <input
              value={form.experience}
              onChange={(e) => update("experience", e.target.value)}
            />
          </label>
          <label>
            Consultation fee (Rs)
            <input
              type="number"
              min="0"
              value={form.fee}
              onChange={(e) => update("fee", e.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>
        </div>

        <label>
          About
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </label>

        <button type="submit" className="primary-btn" disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </DoctorNav>
  );
}
