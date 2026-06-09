import { SignUp } from '@clerk/clerk-react';

export default function RegisterPage() {
  return (
    <div className="login-wrap">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        afterSignUpUrl="/"
      />
      <div className="login-aside">
        <div className="dim">checkpoint.dev</div>
        <div className="dim">v0.1.0</div>
      </div>
    </div>
  );
}
