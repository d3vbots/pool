import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
