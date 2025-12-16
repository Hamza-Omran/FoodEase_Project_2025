import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // Redirect based on user role
    if (user.role === 'customer') return <Navigate to="/restaurants" replace />;
    if (user.role === 'restaurant_owner') return <Navigate to="/admin" replace />;
    if (user.role === 'driver') return <Navigate to="/delivery" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/system" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}
