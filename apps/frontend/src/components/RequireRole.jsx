import { useUser } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

export default function RequireRole({ role, children }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (!user || user.publicMetadata?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
