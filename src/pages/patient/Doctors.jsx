import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PatientNav } from "../../components/RoleNav";
import { SPECIALIZATIONS } from "../../data/specializations";
import { getDoctors } from "../../services/doctors";

function softIncludes(text, query) {
  if (!query) return true;
  const value = String(text || "").toLowerCase();
  if (value.includes(query)) return true;
  const stem = (s) =>
    s
      .toLowerCase()
      .replace(/(ologists|ologist|ologies|ology|icians|ician|ists|ist|s)$/g, "");
  const a = stem(value);
  const b = stem(query);
  return Boolean(a && b && (a.includes(b) || b.includes(a)));
}

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch(() => setError("Could not load doctors."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return doctors.filter((doc) => {
      if (doc.available === false) return false;
      const matchesSearch =
        softIncludes(doc.name, q) || softIncludes(doc.specialization, q);
      const matchesSpec =
        specialization === "all" || doc.specialization === specialization;
      return matchesSearch && matchesSpec;
    });
  }, [doctors, search, specialization]);

  const visibleDoctors = doctors.filter((doc) => doc.available !== false);

  return (
    <PatientNav>
      <header className="page-hero">
        <div>
          <p className="eyebrow">Al Shifa Clinic</p>
          <h1>Our doctors</h1>
          <p className="muted">
            Choose a specialist for your health concern and book an available slot.
          </p>
        </div>
      </header>

      <div className="toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search doctors"
        />
        <select
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
        >
          <option value="all">All specializations</option>
          {SPECIALIZATIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="muted">Loading doctors...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="muted">
          {visibleDoctors.length === 0
            ? "No doctors listed yet. Clinic admin will add Al Shifa doctors soon."
            : "No doctor matched your search. Try name or specialization."}
        </p>
      )}

      <div className="card-grid">
        {filtered.map((doc) => (
          <article className="card doctor-card" key={doc.id}>
            <div className="doctor-card-top">
              <div className="avatar-md">
                {doc.photoURL ? (
                  <img src={doc.photoURL} alt={doc.name} />
                ) : (
                  <span>Dr</span>
                )}
              </div>
              <div>
                <p className="eyebrow">{doc.specialization || "General Physician"}</p>
                <h2>Dr. {doc.name}</h2>
              </div>
            </div>
            <p className="muted">{doc.experience || "Experience updating soon"}</p>
            <p className="fee-line">
              {doc.fee ? `Fee: Rs ${doc.fee}` : "Fee not set"}
            </p>
            <Link className="button-link" to={`/patient/doctors/${doc.id}`}>
              View profile & book
            </Link>
          </article>
        ))}
      </div>
    </PatientNav>
  );
}
