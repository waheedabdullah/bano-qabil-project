import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminNav } from "../../components/RoleNav";
import { getAppointments } from "../../services/appointments";
import { getUsers } from "../../services/users";

const COLORS = ["#0f766e", "#14b8a6", "#0ea5e9", "#f59e0b"];

export default function AdminAnalytics() {
  const [statusData, setStatusData] = useState([]);
  const [roleData, setRoleData] = useState([]);

  useEffect(() => {
    Promise.all([getAppointments(), getUsers()]).then(([appointments, users]) => {
      const statuses = ["pending", "confirmed", "completed", "cancelled"];
      setStatusData(
        statuses.map((status) => ({
          name: status,
          count: appointments.filter((item) => item.status === status).length,
        }))
      );
      const roles = ["patient", "doctor", "admin"];
      setRoleData(
        roles.map((role) => ({
          name: role,
          value: users.filter((item) => item.role === role).length,
        }))
      );
    });
  }, []);

  return (
    <AdminNav>
      <p className="eyebrow">Admin</p>
      <h1>Analytics</h1>

      <div className="chart-grid">
        <section className="card">
          <h2>Appointments by status</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" radius={6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card">
          <h2>Users by role</h2>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {roleData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </AdminNav>
  );
}
