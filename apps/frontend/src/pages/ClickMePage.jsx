import { useNavigate } from 'react-router-dom';

export default function ClickMePage() {
  const navigate = useNavigate();

  return (
    <div className="wip">
      <div className="wip-card">
        <div className="wip-eyebrow">// 503 · under_construction</div>
        <div className="wip-title">
          <span className="accent">&#9612;</span>click_me!
        </div>
        <div className="wip-sub">
          this is a work in progress. come back soon — or don't, that's also fine.
        </div>

        <div className="wip-bar">
          <div className="wip-bar-fill" />
          <span className="wip-bar-meta">progress · 34% · eta unknown</span>
        </div>

        <div className="wip-log">
          <div><span className="dim">2026-05-30</span> scaffolded the page</div>
          <div><span className="dim">2026-05-31</span> decided what it does (?)</div>
          <div><span className="dim">2026-06-01</span> deleted half of it</div>
          <div><span className="dim">2026-06-02</span> still thinking</div>
          <div>
            <span className="dim">2026-06-04</span>{' '}
            <span className="accent">&#9612;</span>
            <span style={{ color: 'var(--main)' }}>_</span>
          </div>
        </div>

        <div className="wip-actions">
          <button className="btn-ghost" onClick={() => navigate('/')}>
            &larr; back to home
          </button>
          <button className="btn-primary">notify me</button>
        </div>
      </div>
    </div>
  );
}
