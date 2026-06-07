import { useState } from 'react';

const treeData = [
  {
    proj: 'checkpoint',
    days: [
      {
        day: '2026-06-04',
        entries: [
          { t: '15:22', msg: 'wired theme picker into <body> css vars' },
          { t: '11:08', msg: 'fuzzy finder modal opens on cmd+k' },
          { t: '09:14', msg: 'rewrote header as floating notch' },
        ],
      },
      {
        day: '2026-06-03',
        entries: [
          { t: '22:40', msg: 'shipped articles category filter' },
          { t: '17:55', msg: 'decided on roboto mono globally' },
        ],
      },
      {
        day: '2026-06-02',
        entries: [
          { t: '20:01', msg: 'first pass at idea graph layout' },
        ],
      },
    ],
  },
  {
    proj: 'rust-rays',
    days: [
      {
        day: '2026-06-01',
        entries: [
          { t: '23:14', msg: 'got soft shadows working, finally' },
          { t: '18:30', msg: 'bvh traversal is the bottleneck after all' },
        ],
      },
      {
        day: '2026-05-30',
        entries: [
          { t: '12:00', msg: 'switched to f32x4 simd for ray packets' },
        ],
      },
    ],
  },
  {
    proj: 'voxel-engine',
    days: [
      {
        day: '2026-05-19',
        entries: [{ t: '14:11', msg: 'paused — coming back next month' }],
      },
    ],
  },
  {
    proj: 'dotfiles',
    days: [
      {
        day: '2026-05-28',
        entries: [
          { t: '08:42', msg: 'ghostty config + theme toggle macro' },
        ],
      },
    ],
  },
];

const viewOptions = ['tree', 'list', 'cal'];
const rangeOptions = ['7d', '30d', 'all'];

export default function DevlogsPage() {
  const [openProjects, setOpenProjects] = useState(
    new Set(treeData.map((p) => p.proj))
  );
  const [activeView, setActiveView] = useState('tree');
  const [activeRange, setActiveRange] = useState('30d');

  const toggleProject = (proj) => {
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(proj)) next.delete(proj);
      else next.add(proj);
      return next;
    });
  };

  const rows = [];
  treeData.forEach((p, pi) => {
    const isOpen = openProjects.has(p.proj);
    const lastProj = pi === treeData.length - 1;
    const totalEntries = p.days.reduce((s, d) => s + d.entries.length, 0);

    rows.push({
      kind: 'proj',
      glyph: isOpen ? '▼' : '▶',
      text: '~/' + p.proj,
      count: totalEntries,
      proj: p.proj,
    });

    if (!isOpen) return;

    p.days.forEach((d, di) => {
      const lastDay = di === p.days.length - 1;
      const projGutter = lastProj ? '  ' : '│ ';
      const dayElbow = lastDay ? '└─' : '├─';
      rows.push({
        kind: 'day',
        prefix: projGutter + dayElbow + ' ',
        text: d.day,
        count: d.entries.length,
      });

      d.entries.forEach((e, ei) => {
        const lastEntry = ei === d.entries.length - 1;
        const dayGutter = lastDay ? '   ' : '│  ';
        const entryElbow = lastEntry ? '└─' : '├─';
        rows.push({
          kind: 'entry',
          prefix: projGutter + dayGutter + entryElbow + ' ',
          time: e.t,
          text: e.msg,
        });
      });
    });
    if (!lastProj) rows.push({ kind: 'spacer', prefix: '│' });
  });

  return (
    <div className="dev-layout">
      <aside className="dev-rail">
        <div className="rail-eyebrow">// projects</div>
        <ul className="rail-list">
          {treeData.map((p) => (
            <li
              key={p.proj}
              className={'rail-item' + (openProjects.has(p.proj) ? ' active' : '')}
              onClick={() => toggleProject(p.proj)}
            >
              <span className="rail-bullet">{openProjects.has(p.proj) ? '▾' : '▸'}</span>
              <span className="rail-name">{p.proj}</span>
              <span className="rail-count">
                {p.days.reduce((s, d) => s + d.entries.length, 0)}
              </span>
            </li>
          ))}
        </ul>
        <div className="rail-eyebrow rail-eyebrow-2">// view</div>
        <div className="rail-sort">
          {viewOptions.map((v) => (
            <button
              key={v}
              className={'chip' + (v === activeView ? ' chip-active' : '')}
              onClick={() => setActiveView(v)}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="rail-eyebrow rail-eyebrow-2">// range</div>
        <div className="rail-sort">
          {rangeOptions.map((r) => (
            <button
              key={r}
              className={'chip' + (r === activeRange ? ' chip-active' : '')}
              onClick={() => setActiveRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </aside>

      <section className="dev-main">
        <div className="dev-head">
          <h1 className="dev-h1">devlogs</h1>
          <div className="dev-subhead">
            <span>// 213 entries · 4 active projects</span>
            <button className="btn-primary dev-add">+ new entry</button>
          </div>
        </div>
        <div className="dev-tree">
          {rows.map((r, i) => {
            if (r.kind === 'proj') {
              return (
                <div
                  key={i}
                  className="tree-row tree-proj"
                  onClick={() => toggleProject(r.proj)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="tree-glyph">{r.glyph}</span>
                  <span className="tree-projname">{r.text}</span>
                  <span className="tree-count">{r.count} entries</span>
                </div>
              );
            }
            if (r.kind === 'day') {
              return (
                <div key={i} className="tree-row tree-day">
                  <span className="tree-pre">{r.prefix}</span>
                  <span className="tree-date">{r.text}</span>
                  <span className="tree-count">· {r.count}</span>
                </div>
              );
            }
            if (r.kind === 'entry') {
              return (
                <div key={i} className="tree-row tree-entry">
                  <span className="tree-pre">{r.prefix}</span>
                  <span className="tree-time">{r.time}</span>
                  <span className="tree-msg">{r.text}</span>
                </div>
              );
            }
            return (
              <div key={i} className="tree-row tree-spacer">
                <span className="tree-pre">{r.prefix}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
