import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Notifications from "./pages/Notifications";
import PatientDashboard from "./pages/patient/Dashboard";
import Doctors from "./pages/patient/Doctors";
import DoctorProfile from "./pages/patient/DoctorProfile";
import PatientAppointments from "./pages/patient/Appointments";
import PatientProfile from "./pages/patient/Profile";
import DoctorDashboard from "./pages/doctor/Dashboard";
import DoctorProfileEdit from "./pages/doctor/Profile";
import DoctorAppointments from "./pages/doctor/Appointments";
import DoctorAppointmentDetail from "./pages/doctor/AppointmentDetail";
import DoctorSchedule from "./pages/doctor/Schedule";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAppointments from "./pages/admin/Appointments";
import AdminAnalytics from "./pages/admin/Analytics";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/patient"
          element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/doctors"
          element={
            <ProtectedRoute role="patient">
              <Doctors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/doctors/:id"
          element={
            <ProtectedRoute role="patient">
              <DoctorProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/appointments"
          element={
            <ProtectedRoute role="patient">
              <PatientAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/profile"
          element={
            <ProtectedRoute role="patient">
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/notifications"
          element={
            <ProtectedRoute role="patient">
              <Notifications role="patient" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <ProtectedRoute role="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/profile"
          element={
            <ProtectedRoute role="doctor">
              <DoctorProfileEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments"
          element={
            <ProtectedRoute role="doctor">
              <DoctorAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/appointments/:id"
          element={
            <ProtectedRoute role="doctor">
              <DoctorAppointmentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/schedule"
          element={
            <ProtectedRoute role="doctor">
              <DoctorSchedule />
            </ProtectedRoute>
          }
        />
        <Route
          path="/doctor/notifications"
          element={
            <ProtectedRoute role="doctor">
              <Notifications role="doctor" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/patients"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="/admin/doctors"
          element={<Navigate to="/admin" replace />}
        />
        <Route
          path="/admin/appointments"
          element={
            <ProtectedRoute role="admin">
              <AdminAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute role="admin">
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
