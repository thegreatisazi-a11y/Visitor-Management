import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';

import Welcome from './pages/public/Welcome';
import CheckIn from './pages/public/CheckIn';
import CheckInSuccess from './pages/public/CheckInSuccess';
import CheckOut from './pages/public/CheckOut';
import CheckOutSuccess from './pages/public/CheckOutSuccess';

import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import VisitorEntries from './pages/admin/VisitorEntries';
import CurrentlyInside from './pages/admin/CurrentlyInside';
import OutSessions from './pages/admin/OutSessions';
import QrManagement from './pages/admin/QrManagement';
import Reports from './pages/admin/Reports';
import AuditTrail from './pages/admin/AuditTrail';
import AdminUsers from './pages/admin/AdminUsers';
import Settings from './pages/admin/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/visitor" replace />} />

      <Route element={<PublicLayout />}>
        <Route path="/visitor" element={<Welcome />} />
        <Route path="/visitor/checkin" element={<CheckIn />} />
        <Route path="/visitor/checkin-success" element={<CheckInSuccess />} />
        <Route path="/visitor/checkout" element={<CheckOut />} />
        <Route path="/visitor/checkout-success" element={<CheckOutSuccess />} />
      </Route>

      <Route path="/admin/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/visitor-entries" element={<VisitorEntries />} />
        <Route path="/admin/currently-inside" element={<CurrentlyInside />} />
        <Route path="/admin/out-sessions" element={<OutSessions />} />
        <Route path="/admin/qr-management" element={<QrManagement />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/audit-trail" element={<AuditTrail />} />
        <Route path="/admin/admin-users" element={<AdminUsers />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/visitor" replace />} />
    </Routes>
  );
}
