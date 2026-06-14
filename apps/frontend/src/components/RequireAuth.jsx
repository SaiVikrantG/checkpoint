import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { setGetToken } from '../data/auth';

export default function RequireAuth({ children }) {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    if (getToken) setGetToken(getToken);
    return () => setGetToken(null);
  }, [getToken]);

  if (!isLoaded) return null;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.publicMetadata?.role;
  if (role !== 'author' && role !== 'admin') return <Navigate to="/" replace />;

  return children;
}
