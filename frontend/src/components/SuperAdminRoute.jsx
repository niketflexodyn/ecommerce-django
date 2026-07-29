import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Guards routes that only a super_admin may access (e.g. the admin-account
// approval workflow). Admins and customers are redirected away.
export default function SuperAdminRoute({ children, to = '/dashboard' }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-plum-950" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'super_admin') return <Navigate to={to} replace />;

  return children;
}