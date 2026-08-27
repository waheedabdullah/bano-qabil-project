import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../services/notifications";

function useUnread() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.uid).then((items) => {
      setCount(items.filter((item) => !item.read).length);
    });
  }, [user]);

  return count;
}

function AppShell({ roleLabel, links, children }) {
  const { profile, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark sm">+</span>
          <div>
            <strong>Al Shifa Clinic</strong>
            <p>{roleLabel} portal</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="ghost sidebar-logout" onClick={logout}>
          Log out
        </button>
      </aside>
      <div className="app-main">
        <header className="app-header">
          <p className="muted">Welcome back</p>
          <strong>{profile?.name || roleLabel}</strong>
        </header>
        <section className="app-content">{children}</section>
      </div>
    </div>
  );
}

export function PatientNav({ children }) {
  const unread = useUnread();
  return (
    <AppShell
      roleLabel="Patient"
      links={[
        { to: "/patient", label: "Home", end: true },
        { to: "/patient/doctors", label: "Doctors" },
        { to: "/patient/appointments", label: "Appointments" },
        { to: "/patient/profile", label: "Profile" },
        { to: "/patient/notifications", label: unread ? `Alerts (${unread})` : "Alerts" },
      ]}
    >
      {children}
    </AppShell>
  );
}

export function DoctorNav({ children }) {
  const unread = useUnread();
  return (
    <AppShell
      roleLabel="Doctor"
      links={[
        { to: "/doctor", label: "Today", end: true },
        { to: "/doctor/appointments", label: "Appointments" },
        { to: "/doctor/schedule", label: "Schedule" },
        { to: "/doctor/profile", label: "Profile" },
        { to: "/doctor/notifications", label: unread ? `Alerts (${unread})` : "Alerts" },
      ]}
    >
      {children}
    </AppShell>
  );
}

export function AdminNav({ children }) {
  return (
    <AppShell
      roleLabel="Admin"
      links={[
        { to: "/admin", label: "Dashboard", end: true },
        { to: "/admin/appointments", label: "Appointments" },
        { to: "/admin/analytics", label: "Analytics" },
      ]}
    >
      {children}
    </AppShell>
  );
}
