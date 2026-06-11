import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const groups = [
  {
    proj: 'checkpoint', count: 86, entries: [
      { t: '2026-06-04 15:22', msg: 'wired theme picker into css vars' },
      { t: '2026-06-04 11:08', msg: 'fuzzy finder modal opens on cmd+k' },
      { t: '2026-06-04 09:14', msg: 'rewrote header as floating notch' },
      { t: '2026-06-03 22:40', msg: 'shipped articles category filter' },
    ],
  },
  {
    proj: 'rust-rays', count: 64, entries: [
      { t: '2026-06-01 23:14', msg: 'got soft shadows working, finally' },
      { t: '2026-06-01 18:30', msg: 'bvh traversal is the bottleneck after all' },
      { t: '2026-05-30 12:00', msg: 'switched to f32x4 simd for ray packets' },
    ],
  },
  {
    proj: 'dotfiles', count: 38, entries: [
      { t: '2026-05-28 08:42', msg: 'ghostty config + theme toggle macro' },
      { t: '2026-05-21 14:17', msg: 'nix flake update + neovim plugin pin' },
    ],
  },
  {
    proj: 'voxel-engine', count: 25, entries: [
      { t: '2026-05-19 14:11', msg: 'paused — coming back next month' },
    ],
  },
];

const viewModes = ['by project', 'by date', 'timeline'];

export default function UserDevlogsPage() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('by project');
  const [collapsed, setCollapsed] = useState({});

  const toggleGroup = (proj) => {
    setCollapsed((prev) => ({ ...prev, [proj]: !prev[proj] }));
  };

  return (
    <>
      <div className="user-head">
        <div>
          <h1 className="user-h1">devlogs</h1>
          <div className="user-sub">// {groups.reduce((s, g) => s + g.count, 0)} total · grouped by project · short-form notes</div>
        </div>
        <div className="user-head-actions">
          <div className="user-tabs">
            {viewModes.map((m) => (
              <button
                key={m}
                className={'chip' + (m === activeView ? ' chip-active' : '')}
                onClick={() => setActiveView(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => navigate('/user/devlogs/new')}>+ new devlog</button>
        </div>
      </div>

      <div className="dl-note">
        <span className="accent">i</span>
        <span>devlogs always belong to a project. you'll pick one when creating.</span>
      </div>

      <div className="dl-groups">
        {groups.map((g, gi) => (
          <div key={gi} className="dl-group">
            <div className="dl-group-head" onClick={() => toggleGroup(g.proj)}>
              <span className={'dl-group-glyph' + (collapsed[g.proj] ? ' collapsed' : '')}>▼</span>
              <span className="dl-group-name">~/{g.proj}</span>
              <span className="dl-group-count">{g.count} entries</span>
              <span className="dl-group-spacer" />
              <button className="btn-ghost dl-group-add" onClick={(e) => { e.stopPropagation(); navigate('/user/devlogs/new'); }}>+ entry</button>
            </div>
            {!collapsed[g.proj] && (
              <div className="dl-entries">
                {g.entries.map((e, ei) => (
                  <div key={ei} className="dl-entry">
                    <span className="dl-time">{e.t}</span>
                    <span className="dl-msg">{e.msg}</span>
                    <span className="dl-actions">
                      <span className="dim">edit</span>
                      <span className="dim">···</span>
                    </span>
                  </div>
                ))}
                <div className="dl-entry dl-more">
                  <span className="dim">↓ show {g.count - g.entries.length} older</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
