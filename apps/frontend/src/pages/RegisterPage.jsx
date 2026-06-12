import { SignUp } from '@clerk/clerk-react';
import { useMemo } from 'react';
import { getClerkAppearance } from '../utils/clerkAppearance';

export default function RegisterPage() {
  const appearance = useMemo(() => getClerkAppearance(), []);

  return (
    <div className="login-wrap">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        afterSignUpUrl="/auth-redirect"
        appearance={appearance}
      />
      <div className="login-aside">
        <div className="dim">checkpoint.dev</div>
        <div className="dim">v0.1.0</div>
      </div>
    </div>
  );
}
