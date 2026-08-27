import { useEffect, useState } from "react";
import { PatientNav, DoctorNav } from "../components/RoleNav";
import { useAuth } from "../context/AuthContext";
import { getNotifications, markRead } from "../services/notifications";

export default function Notifications({ role }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const Nav = role === "doctor" ? DoctorNav : PatientNav;

  function load() {
    if (!user) return;
    getNotifications(user.uid).then(setItems);
  }

  useEffect(load, [user]);

  async function open(item) {
    if (!item.read) {
      await markRead(item.id);
      load();
    }
  }

  return (
    <Nav>
      <p className="eyebrow">Alerts</p>
      <h1>Notifications</h1>
      {items.length === 0 && <p className="muted">No notifications yet.</p>}
      <ul className="list">
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" className="ghost" onClick={() => open(item)}>
              {item.read ? "" : "• "}
              {item.message}
            </button>
          </li>
        ))}
      </ul>
    </Nav>
  );
}
