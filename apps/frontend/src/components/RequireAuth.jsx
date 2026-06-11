import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function RequireAuth({ children }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.publicMetadata?.role;
  if (role !== 'author' && role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
