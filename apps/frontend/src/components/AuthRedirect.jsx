import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function AuthRedirect() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;
  if (!user) return <Navigate to="/" replace />;

  const role = user.publicMetadata?.role;

  if (role === 'admin') return <Navigate to="/admin" replace />;
  if (role === 'author') return <Navigate to="/user" replace />;

  return <Navigate to="/" replace />;
}
