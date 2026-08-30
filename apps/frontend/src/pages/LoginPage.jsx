import { SignIn } from '@clerk/clerk-react';
import { useMemo } from 'react';
import { getClerkAppearance } from '../utils/clerkAppearance';

export default function LoginPage() {
  const appearance = useMemo(() => getClerkAppearance(), []);

  return (
    <div className="login-wrap">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/register"
        afterSignInUrl="/auth-redirect"
        appearance={appearance}
      />
      <div className="login-aside">
        <div className="dim">checkpoint.dev</div>
        <div className="dim">{__APP_VERSION__}</div>
      </div>
    </div>
  );
}
