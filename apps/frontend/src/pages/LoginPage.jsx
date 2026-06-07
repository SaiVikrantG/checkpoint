import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-brand">
          <span className="accent">&#9612;</span>checkpoint
        </div>
        <div className="login-eyebrow">// auth · admin only</div>

        <label className="login-field">
          <span className="login-label">$ user</span>
          <input className="login-input" type="email" placeholder="user@checkpoint.dev" />
        </label>

        <label className="login-field">
          <span className="login-label">$ password</span>
          <input className="login-input" type="password" placeholder="••••••••••••" />
        </label>

        <div className="login-row">
          <label className="login-check">
            <span className="login-box">&times;</span>
            <span>remember this machine</span>
          </label>
          <span className="login-link">forgot?</span>
        </div>

        <button className="btn-primary login-btn">authenticate &rarr;</button>

        <div className="login-or">&mdash; or &mdash;</div>
        <div className="login-providers">
          <button className="btn-ghost" style={{ display: 'block', width: '100%', textAlign: 'left' }}>
            &#8599; continue with github
          </button>
          <button className="btn-ghost" style={{ display: 'block', width: '100%', textAlign: 'left' }}>
            &#8599; continue with google
          </button>
        </div>

        <div className="login-foot">
          <span className="dim">// not you? </span>
          <span className="login-link" onClick={() => navigate('/')}>go back home</span>
        </div>
      </div>
      <div className="login-aside">
        <div className="dim">checkpoint.dev</div>
        <div className="dim">v0.1.0 · build a3f9c2e</div>
      </div>
    </div>
  );
}
