import { useState } from 'react';

const trend = [120, 180, 140, 210, 260, 190, 170, 250, 310, 240, 290, 220, 340, 280, 400, 330, 260, 360, 440, 380, 350, 420, 490, 410, 360, 470, 540, 460, 430, 510];
const top = [
  { name: 'raymarching, but slowly', views: 3214 },
  { name: 'designing a notch header in css', views: 3180 },
  { name: 'the case for plain markdown', views: 1884 },
  { name: 'shipping checkpoint v0', views: 1402 },
  { name: 'a tiny job queue in 200 lines', views: 982 },
  { name: 'voxel meshing without the pain', views: 742 },
  { name: 'why i rewrote my dotfiles (again)', views: 612 },
];
const refs = [
  { src: 'twitter.com', pct: 38 },
  { src: 'news.ycombinator.com', pct: 22 },
  { src: 'direct', pct: 18 },
  { src: 'google.com', pct: 14 },
  { src: 'lobste.rs', pct: 5 },
  { src: 'other', pct: 3 },
];

const periods = ['7d', '30d', '90d', 'all'];

export default function UserStatsPage() {
  const [activePeriod, setActivePeriod] = useState('30d');

  const max = Math.max(...trend);
  const w = 720;
  const h = 160;
  const n = trend.length;
  const maxBar = top[0].views;

  return (
    <>
      <div className="user-head">
        <div>
          <h1 className="user-h1">statistics</h1>
          <div className="user-sub">// your numbers · last 30 days · updates hourly</div>
        </div>
        <div className="user-head-actions">
          <div className="user-tabs">
            {periods.map((p) => (
              <button
                key={p}
                className={'chip' + (p === activePeriod ? ' chip-active' : '')}
                onClick={() => setActivePeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button className="btn-ghost">↓ export csv</button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stats-big">
          <div className="stats-big-label">total views</div>
          <div className="stats-big-value">12,847</div>
          <div className="stats-big-delta accent">↑ 18% vs prev. 30d</div>
        </div>
        <div className="stats-big stats-big-sm">
          <div className="stats-big-label">articles</div>
          <div className="stats-big-value">24</div>
          <div className="dim" style={{ fontSize: 11 }}>18 public · 6 drafts</div>
        </div>
        <div className="stats-big stats-big-sm">
          <div className="stats-big-label">devlogs</div>
          <div className="stats-big-value">213</div>
          <div className="dim" style={{ fontSize: 11 }}>+11 this week</div>
        </div>
        <div className="stats-big stats-big-sm">
          <div className="stats-big-label">projects</div>
          <div className="stats-big-value">12</div>
          <div className="dim" style={{ fontSize: 11 }}>4 active</div>
        </div>
        <div className="stats-big stats-big-sm">
          <div className="stats-big-label">avg / article</div>
          <div className="stats-big-value">535</div>
          <div className="dim" style={{ fontSize: 11 }}>views</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stats-panel stats-trend">
          <div className="panel-head">
            <span>// views · 30 days</span>
            <span className="dim">peak 540 on day 27</span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="trend-svg" preserveAspectRatio="none">
            {[0, 1, 2, 3].map((i) => (
              <line
                key={i}
                x1="0" x2={w}
                y1={(h - 20) * (i / 3) + 10}
                y2={(h - 20) * (i / 3) + 10}
                stroke="var(--border)" strokeOpacity="0.6" strokeDasharray="2,4"
              />
            ))}
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--main)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--main)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={
                'M 0 ' + h + ' ' +
                trend.map((v, i) => `L ${i * (w / (n - 1))} ${h - 10 - (v / max) * (h - 30)}`).join(' ') +
                ` L ${w} ${h} Z`
              }
              fill="url(#trendFill)"
            />
            <polyline
              points={trend.map((v, i) => `${i * (w / (n - 1))},${h - 10 - (v / max) * (h - 30)}`).join(' ')}
              fill="none" stroke="var(--main)" strokeWidth="2"
            />
            <circle
              cx={(n - 1) * (w / (n - 1))}
              cy={h - 10 - (trend[n - 1] / max) * (h - 30)}
              r="4" fill="var(--main)"
            />
          </svg>
          <div className="trend-axis">
            <span>30d ago</span><span>20d</span><span>10d</span><span>today</span>
          </div>
        </div>

        <div className="stats-panel stats-refs">
          <div className="panel-head"><span>// referrers</span></div>
          <ul className="refs-list">
            {refs.map((r) => (
              <li key={r.src} className="ref-row">
                <span className="ref-src">{r.src}</span>
                <span className="ref-bar"><span className="ref-bar-fill" style={{ width: r.pct + '%' }} /></span>
                <span className="ref-pct">{r.pct}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="stats-panel stats-top">
          <div className="panel-head">
            <span>// top articles · by views · 30d</span>
            <span className="dim">click any to open</span>
          </div>
          <ul className="topbar-list">
            {top.map((a, i) => (
              <li key={i} className="topbar-row">
                <span className="topbar-rank">{String(i + 1).padStart(2, '0')}</span>
                <span className="topbar-name">{a.name}</span>
                <span className="topbar-bar">
                  <span className="topbar-bar-fill" style={{ width: (a.views / maxBar * 100) + '%' }} />
                </span>
                <span className="topbar-num">{a.views.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
