import "./pages/style_page/ViewerPanel.css";
import React, { Suspense, lazy, useMemo, memo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Ленивая загрузка страниц
const Login = lazy(() => import('./pages/Login'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const DeveloperPanel = lazy(() => import('./pages/DeveloperPanel'));
const ViewerPanel = lazy(() => import('./pages/ViewerPanel'));
const AccountantPage = lazy(() => import('./pages/AccountantPage'));
const AccountantPanel = lazy(() => import('./pages/AccountantPanel'));

type UserRole = 'ADMIN' | 'DEVELOPER' | 'ACCOUNTANT' | 'DASHBOARD_USER' | 'USER';

const LoadingScreen = memo<{ text?: string }>(({ text = 'Загрузка...' }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div className="text-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-purple-500 mx-auto mb-6"></div>
        <div className="animate-ping absolute inset-0 rounded-full h-20 w-20 border-4 border-purple-400 opacity-20 mx-auto"></div>
      </div>
      <p className="text-white text-xl font-semibold animate-pulse">{text}</p>
    </div>
  </div>
));
LoadingScreen.displayName = 'LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}
const ProtectedRoute = memo<ProtectedRouteProps>(({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen text="Проверка доступа..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role as UserRole)) return <Navigate to="/" replace />;
  return <>{children}</>;
});
ProtectedRoute.displayName = 'ProtectedRoute';

function App() {
  const { user, loading } = useAuth();
  const defaultRoute = useMemo(() => {
    if (!user) return '/login';
    const roleRoutes: Record<UserRole, string> = {
      ADMIN: '/admin',
      DEVELOPER: '/developer',
      ACCOUNTANT: '/accountant',
      DASHBOARD_USER: '/viewer',
      USER: '/viewer'
    };
    return roleRoutes[user.role as UserRole] || '/viewer';
  }, [user]);

  if (loading) return <LoadingScreen text="Инициализация..." />;

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen text="Загрузка страницы..." />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/developer" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}><DeveloperPanel /></ProtectedRoute>} />
          <Route path="/developer/sandbox" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER']}><DeveloperPanel /></ProtectedRoute>} />
          <Route path="/viewer" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER', 'DASHBOARD_USER', 'USER', 'ACCOUNTANT']}><ViewerPanel /></ProtectedRoute>} />
          {/* Главная бухгалтерская страница — квадраты */}
          <Route
            path="/accountant"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
                <AccountantPage />
              </ProtectedRoute>
            }
          />
          {/* Страница анализа Эскроу при клике на квадрат */}
          <Route
            path="/accountant/escrow"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTANT']}>
                <Suspense fallback={<LoadingScreen text="Загрузка анализа..." />}>
                  <AccountantPanel />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="/dashboard/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER', 'DASHBOARD_USER', 'USER', 'ACCOUNTANT']}><ViewerPanel /></ProtectedRoute>} />
          <Route path="/dashboards/:id" element={<ProtectedRoute allowedRoles={['ADMIN', 'DEVELOPER', 'DASHBOARD_USER', 'USER', 'ACCOUNTANT']}><ViewerPanel /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to={defaultRoute} replace />} />
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default memo(App);
