import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ForgotPasswordPage from './pages/ForgotPassword';

import DashboardLayout from './components/layout/DashboardLayout';
import Calendario from './pages/Calendario';
import NewReservationPage from './pages/NewReservation';
import MyReservationsPage from './pages/MyReservations';
import AdminReservationsPage from './pages/admin/AdminReservations';
import AdminAreasPage from './pages/admin/AdminAreas';
import AdminUsersPage from './pages/admin/AdminUsers';
import ProfilePage from './pages/Profile';
import MaintenancePage from './pages/Maintenance';
import PaymentMockPage from './pages/PaymentMock';

const PrivateRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  if (!profile) return <Navigate to="/login" />;
  if (adminOnly && profile.role !== 'admin') return <Navigate to="/dashboard" />;

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />


          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <Calendario />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reservations/new"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <NewReservationPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reservations/my"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <MyReservationsPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/reservations/edit/:id"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <NewReservationPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <DashboardLayout>
                  <Calendario />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/reservations"
            element={
              <PrivateRoute adminOnly>
                <DashboardLayout>
                  <AdminReservationsPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/areas"
            element={
              <PrivateRoute adminOnly>
                <DashboardLayout>
                  <AdminAreasPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute adminOnly>
                <DashboardLayout>
                  <AdminUsersPage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/maintenance"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <MaintenancePage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <DashboardLayout>
                  <ProfilePage />
                </DashboardLayout>
              </PrivateRoute>
            }
          />

          <Route
            path="/payment/:id"
            element={
              <PrivateRoute>
                <PaymentMockPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
