import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps protected routes.
 * - Shows a loading spinner while verifying the stored JWT.
 * - Redirects to /login (preserving the attempted URL) if not authenticated.
 * - Renders child routes via <Outlet /> if authenticated.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        {/* Spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-primary-500 animate-spin" />
        </div>
        <p className="text-slate-500 text-sm font-medium animate-pulse">
          Verifying session…
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Save the URL they tried to visit so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
