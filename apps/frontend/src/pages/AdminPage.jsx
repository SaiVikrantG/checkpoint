import { useState, useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { getThemeSettings, updateThemeSettings } from '../data/settings';
import { useToast } from '../context/ToastContext';

const presetThemes = [
  { name: 'serika dark', bg: '#323437', fg: '#d1d0c5', ac: '#e2b714' },
  { name: 'nord', bg: '#2e3440', fg: '#d8dee9', ac: '#88c0d0' },
  { name: 'rose pine', bg: '#191724', fg: '#e0def4', ac: '#eb6f92' },
  { name: 'gruvbox', bg: '#282828', fg: '#ebdbb2', ac: '#b8bb26' },
  { name: 'tokyo night', bg: '#1a1b26', fg: '#c0caf5', ac: '#7aa2f7' },
  { name: 'catppuccin', bg: '#1e1e2e', fg: '#cdd6f4', ac: '#cba6f7' },
];

const activityLog = [
  { time: '14s ago', msg: 'published article "designing a notch header"' },
  { time: '2m  ago', msg: 'theme changed → serika dark' },
  { time: '12m ago', msg: '3 new visitors from twitter' },
  { time: '1h  ago', msg: 'devlog added → checkpoint/2026-06-04/15:22' },
  { time: '3h  ago', msg: 'project "newsletter" added to board' },
  { time: '8h  ago', msg: 'daily backup ok · 84 MB' },
];

const topPages = [
  { rank: '01', name: '/articles/raymarching-but-slowly', num: '3,214' },
  { rank: '02', name: '/projects/rust-rays', num: '1,847' },
  { rank: '03', name: '/', num: '1,402' },
  { rank: '04', name: '/articles/tiny-job-queue', num: '982' },
  { rank: '05', name: '/about', num: '617' },
];

export default function AdminPage() {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [activeTheme, setActiveTheme] = useState('serika dark');
  const [customBg, setCustomBg] = useState('#323437');
  const [customFg, setCustomFg] = useState('#d1d0c5');
  const [customAc, setCustomAc] = useState('#e2b714');
  const { showToast } = useToast();

  useEffect(() => {
    getThemeSettings()
      .then((theme) => {
        setActiveTheme(theme.name || 'custom');
        setCustomBg(theme.bg);
        setCustomFg(theme.fg);
        setCustomAc(theme.ac);
      })
      .catch((err) => {
        console.error('Failed to load theme settings:', err);
        showToast(err.message);
      });
  }, [showToast]);

  const applyTheme = (bg, fg, ac, name) => {
    document.documentElement.style.setProperty('--bg', bg);
    document.documentElement.style.setProperty('--bg-2', adjustColor(bg, 6));
    document.documentElement.style.setProperty('--bg-3', adjustColor(bg, -10));
    document.documentElement.style.setProperty('--fg', fg);
    document.documentElement.style.setProperty('--main', ac);
    updateThemeSettings({ name: name || 'custom', bg, fg, ac }).catch((err) => {
      console.error('Failed to save theme settings:', err);
      showToast(err.message);
    });
  };

  const spark = [
    4, 7, 5, 9, 12, 8, 6, 11, 14, 10, 13, 9, 15, 12, 18, 14, 11, 16, 20, 17, 15, 19, 22, 18, 16, 21,
    24, 20, 19, 23,
  ];
  const sparkPath = spark.map((v, i) => `${i * (320 / 29)},${64 - (v / 24) * 54}`).join(' ');

  return (
    <>
      <div className="admin-head">
        <div>
          <h1 className="admin-h1">admin</h1>
          <div className="admin-sub">// last sync 14s ago · all systems nominal</div>
        </div>
        <button className="btn-ghost" onClick={() => signOut(() => navigate('/'))}>
          logout
        </button>
      </div>

      <div className="admin-grid">
        <div className="metric metric-wide">
          <div>
            <div className="metric-label">visitors · 30d</div>
            <div className="metric-value">
              12,847 <span className="metric-delta">↑ 18%</span>
            </div>
          </div>
          <svg viewBox="0 0 320 70" className="metric-spark" preserveAspectRatio="none">
            <polyline points={sparkPath} fill="none" stroke="var(--main)" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="metric">
          <div className="metric-label">articles</div>
          <div className="metric-value">24</div>
          <div className="metric-foot">
            <span className="dim">drafts</span> 6
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">projects</div>
          <div className="metric-value">12</div>
          <div className="metric-foot">
            <span className="dim">active</span> 4
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">devlogs</div>
          <div className="metric-value">213</div>
          <div className="metric-foot">
            <span className="dim">this week</span> 11
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">avg session</div>
          <div className="metric-value">3:42</div>
          <div className="metric-foot">
            <span className="dim">bounce</span> 32%
          </div>
        </div>

        <div className="admin-panel admin-theme">
          <div className="panel-head">// theme · 3-color · applies site-wide</div>
          <div className="theme-grid">
            {presetThemes.map((t) => (
              <div
                key={t.name}
                className={'theme-card' + (t.name === activeTheme ? ' active' : '')}
                onClick={() => {
                  setActiveTheme(t.name);
                  setCustomBg(t.bg);
                  setCustomFg(t.fg);
                  setCustomAc(t.ac);
                  applyTheme(t.bg, t.fg, t.ac, t.name);
                }}
              >
                <div className="theme-preview" style={{ background: t.bg }}>
                  <span className="theme-sw" style={{ background: t.fg }} />
                  <span className="theme-sw" style={{ background: t.ac }} />
                  <span
                    className="theme-sw"
                    style={{ background: t.bg, border: '1px solid ' + t.fg }}
                  />
                </div>
                <div className="theme-name">
                  {t.name}
                  {t.name === activeTheme && <span className="accent"> ✓</span>}
                </div>
                <div className="theme-hex">
                  <span>{t.bg}</span>
                  <span>{t.fg}</span>
                  <span>{t.ac}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="theme-custom">
            <span className="dim">// custom</span>
            <div className="theme-customrow">
              <span>bg</span>
              <input
                className="hex-input"
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
              />
              <span>fg</span>
              <input
                className="hex-input"
                value={customFg}
                onChange={(e) => setCustomFg(e.target.value)}
              />
              <span>ac</span>
              <input
                className="hex-input"
                value={customAc}
                onChange={(e) => setCustomAc(e.target.value)}
              />
              <button
                className="btn-ghost"
                style={{ padding: '5px 12px', fontSize: 11, marginLeft: 'auto' }}
                onClick={() => {
                  setActiveTheme('custom');
                  applyTheme(customBg, customFg, customAc, 'custom');
                }}
              >
                apply
              </button>
            </div>
          </div>
        </div>

        <div className="admin-panel admin-activity">
          <div className="panel-head">// recent · audit_log</div>
          <ul className="activity-list">
            {activityLog.map((a, i) => (
              <li key={i}>
                <span className="dim">{a.time}</span> <span className="accent">●</span> {a.msg}
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-panel admin-top">
          <div className="panel-head">// top_pages · 30d</div>
          <ul className="top-list">
            {topPages.map((p) => (
              <li key={p.rank}>
                <span className="top-rank">{p.rank}</span>
                <span className="top-name">{p.name}</span>
                <span className="top-num">{p.num}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function adjustColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}
