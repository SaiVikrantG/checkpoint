import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { setGetToken } from '../data/auth';

export default function RequireRole({ role, children }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (getToken) setGetToken(getToken);
    return () => setGetToken(null);
  }, [getToken]);

  if (!isLoaded) return null;

  if (!user || user.publicMetadata?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
