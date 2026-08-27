import { useEffect, useState } from "react";
import { AdminNav } from "../../components/RoleNav";
import DeleteIconButton from "../../components/DeleteIconButton";
import { deletePatient, getUsers } from "../../services/users";

export default function AdminPatients() {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState("");

  function load() {
    getUsers().then((rows) => setItems(rows.filter((item) => item.role === "patient")));
  }

  useEffect(load, []);

  async function handleDelete(item) {
    const ok = window.confirm(
      `Delete patient "${item.name}"? Their appointments will also be removed.`
    );
    if (!ok) return;
    setBusyId(item.id);
    try {
      await deletePatient(item.id);
      load();
    } catch (err) {
      console.error(err);
      window.alert("Could not delete patient.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <AdminNav>
      <p className="eyebrow">Admin</p>
      <h1>Patient management</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone || "—"}</td>
                <td>
                  <div className="row-actions">
                    <DeleteIconButton
                      disabled={busyId === item.id}
                      onClick={() => handleDelete(item)}
                      label={`Delete ${item.name}`}
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
