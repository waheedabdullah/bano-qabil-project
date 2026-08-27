import { useEffect, useState } from "react";
import { AdminNav } from "../../components/RoleNav";
import DeleteIconButton from "../../components/DeleteIconButton";
import { deleteDoctor, getDoctors, updateDoctor } from "../../services/doctors";
import {
  approveDoctor,
  getPendingDoctors,
} from "../../services/doctorSignup";

export default function AdminDoctors() {
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  function load() {
    getDoctors().then(setItems);
    getPendingDoctors().then(setPending);
  }

  useEffect(load, []);

  async function toggle(item) {
    if (item.approvalStatus === "pending") return;
    await updateDoctor(item.id, { available: item.available === false });
    load();
  }

  async function handleApprove(id) {
    setMessage("");
    try {
      await approveDoctor(id);
      setMessage("Doctor approved. They can log in now.");
      load();
    } catch {
      setMessage("Could not approve doctor.");
    }
  }

  async function handleDelete(item) {
    const ok = window.confirm(
      `Delete Dr. ${item.name}? Their appointments will also be removed.`
    );
    if (!ok) return;
    setBusyId(item.id);
    setMessage("");
    try {
      await deleteDoctor(item.id);
      setMessage(`Dr. ${item.name} deleted.`);
      load();
    } catch (err) {
      console.error(err);
      setMessage("Could not delete doctor.");
    } finally {
      setBusyId("");
    }
  }

  const approved = items.filter(
    (item) => !item.approvalStatus || item.approvalStatus === "approved"
  );

  return (
    <AdminNav>
      <p className="eyebrow">Al Shifa Clinic</p>
      <h1>Doctors</h1>
      <p className="muted">Approve new doctor signups and manage clinic doctors.</p>
      {message && <p className="success">{message}</p>}

      <h2>Pending approval</h2>
      {pending.length === 0 && (
        <p className="muted">No pending doctor signups.</p>
      )}
      {pending.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Specialization</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.map((item) => (
                <tr key={item.id}>
                  <td>Dr. {item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.specialization || "General Physician"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => handleApprove(item.id)}
                      >
                        Approve
                      </button>
                      <DeleteIconButton
                        disabled={busyId === item.id}
                        onClick={() => handleDelete(item)}
                        label={`Delete Dr. ${item.name}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Approved doctors</h2>
      {approved.length === 0 && (
        <p className="muted">No approved doctors yet.</p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Specialization</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {approved.map((item) => (
              <tr key={item.id}>
                <td>Dr. {item.name}</td>
                <td>{item.email}</td>
                <td>{item.specialization || "General Physician"}</td>
                <td>{item.available === false ? "Hidden" : "Visible"}</td>
                <td>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => toggle(item)}
                    >
                      {item.available === false ? "Show" : "Hide"}
                    </button>
                    <DeleteIconButton
                      disabled={busyId === item.id}
                      onClick={() => handleDelete(item)}
                      label={`Delete Dr. ${item.name}`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminNav>
  );
}
