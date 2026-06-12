import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

const recent = [
  { kind: 'article', title: 'designing a notch header in css', meta: '2h ago · draft', state: 'draft' },
  { kind: 'devlog', title: 'wired theme picker into css vars', meta: '5h ago · checkpoint', state: '' },
  { kind: 'article', title: 'the case for plain markdown', meta: 'yesterday · public', state: 'public' },
  { kind: 'devlog', title: 'soft shadows working, finally', meta: 'yesterday · rust-rays', state: '' },
  { kind: 'project', title: 'newsletter (new)', meta: '2d ago', state: '' },
];

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const name = user?.firstName || user?.username || 'user';

  const hour = new Date().getHours();
  let greeting;
  switch (true) {
    case hour < 12:  greeting = 'good morning'; break;
    case hour < 17:  greeting = 'good afternoon'; break;
    default:         greeting = 'good evening'; break;
  }

  return (
    <>
      <div className="dash-hero">
        <div className="dash-eyebrow">// {greeting},</div>
        <div className="dash-hello">@{name}.</div>
        <div className="dash-sub">
          you have <span className="accent">3 drafts</span>, <span className="accent">11 devlogs this week</span>, and{' '}
          <span className="accent">↑ 18%</span> views on the last 30 days.
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat-label">total views</div>
            <div className="dash-stat-value">12.8k <span className="dash-stat-delta">↑ 18%</span></div>
            <div className="dash-stat-foot dim">last 30d</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">articles</div>
            <div className="dash-stat-value">24 <span className="dim" style={{ fontSize: 12 }}>/ 18 public</span></div>
            <div className="dash-stat-foot dim">6 drafts</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">devlogs</div>
            <div className="dash-stat-value">213</div>
            <div className="dash-stat-foot dim">+11 this week</div>
          </div>
          <div className="dash-stat">
            <div className="dash-stat-label">projects</div>
            <div className="dash-stat-value">12</div>
            <div className="dash-stat-foot dim">4 active</div>
          </div>
        </div>

        <div className="dash-panel dash-recent">
          <div className="dash-panel-head">
            <span>// recent</span>
            <span className="dim" style={{ cursor: 'pointer' }} onClick={() => navigate('/user/articles')}>view all →</span>
          </div>
          <ul className="dash-recent-list">
            {recent.map((r, i) => (
              <li key={i} className="dash-recent-row">
                <span className={'finder-kind finder-kind-' + r.kind}>{r.kind}</span>
                <span className="dash-recent-title">{r.title}</span>
                <span className="dash-recent-meta">{r.meta}</span>
                {r.state === 'public' && <span className="badge badge-public">public</span>}
                {r.state === 'draft' && <span className="badge badge-draft">draft</span>}
                {!r.state && <span className="badge badge-none">—</span>}
                <span className="dash-arrow">→</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash-panel dash-streak">
          <div className="dash-panel-head"><span>// streak</span></div>
          <div className="dash-streak-value">14 <span className="dim">days</span></div>
          <div className="dash-streak-grid">
            {Array.from({ length: 30 }).map((_, i) => {
              const v = (i * 7 + 3) % 10;
              const cls = v > 7 ? 'g4' : v > 5 ? 'g3' : v > 3 ? 'g2' : v > 1 ? 'g1' : 'g0';
              return <span key={i} className={'streak-dot ' + cls} />;
            })}
          </div>
          <div className="dim" style={{ fontSize: 11, marginTop: 10 }}>
            ← 30 days ago · today →
          </div>
        </div>
      </div>
    </>
  );
}
