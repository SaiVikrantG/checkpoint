import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const projects = [
  { name: 'checkpoint', status: 'live', blurb: 'this website. devlog + writing platform.', stack: ['typescript', 'next.js', 'postgres'], a: 6, d: 86, isPublic: true },
  { name: 'rust-rays', status: 'wip', blurb: 'tiny cpu raytracer in safe rust.', stack: ['rust', 'cli'], a: 4, d: 64, isPublic: true },
  { name: 'voxel-engine', status: 'paused', blurb: 'greedy-meshing voxel renderer.', stack: ['rust', 'wgpu'], a: 3, d: 25, isPublic: true },
  { name: 'dotfiles', status: 'live', blurb: 'nix-managed dotfiles. one-command bootstrap.', stack: ['nix', 'lua'], a: 5, d: 38, isPublic: true },
  { name: 'todo-tree', status: 'live', blurb: 'cli todo manager that organises as a tree.', stack: ['go', 'bubbletea'], a: 2, d: 12, isPublic: true },
  { name: 'tinyhttp', status: 'archived', blurb: 'http/1.1 from scratch in c.', stack: ['c', 'sockets'], a: 1, d: 4, isPublic: false },
  { name: 'newsletter', status: 'wip', blurb: 'small newsletter on writing tools.', stack: ['astro', 'markdown'], a: 0, d: 3, isPublic: false },
];

const filters = ['all', 'live', 'wip', 'paused', 'archived'];

export default function UserProjectsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = activeFilter === 'all'
    ? projects
    : projects.filter((p) => p.status === activeFilter);

  return (
    <>
      <div className="user-head">
        <div>
          <h1 className="user-h1">projects</h1>
          <div className="user-sub">// {projects.length} total · {projects.filter((p) => p.status === 'live' || p.status === 'wip').length} active · devlogs and articles can attach here</div>
        </div>
        <div className="user-head-actions">
          <div className="user-tabs">
            {filters.map((f) => (
              <button
                key={f}
                className={'chip' + (f === activeFilter ? ' chip-active' : '')}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="btn-primary">+ new project</button>
        </div>
      </div>

      <div className="up-grid">
        <div className="up-card up-new">
          <div className="up-new-icon">+</div>
          <div className="up-new-title">new project</div>
          <div className="up-new-sub dim">name, blurb, repo, stack</div>
        </div>

        {filtered.map((p) => (
          <div key={p.name} className="up-card">
            <div className="up-card-head">
              <span className={'proj-status proj-status-' + p.status}>● {p.status}</span>
              <span className={'toggle toggle-sm' + (p.isPublic ? ' toggle-on' : '')}>
                <span className="toggle-knob" />
              </span>
            </div>
            <div className="up-name">~/{p.name}</div>
            <div className="up-blurb">{p.blurb}</div>
            <div className="up-stack">
              {p.stack.map((s) => <span key={s} className="proj-chip">{s}</span>)}
            </div>
            <div className="up-foot">
              <span><span className="dim">articles </span><span className="accent">{p.a}</span></span>
              <span><span className="dim">devlogs </span><span className="accent">{p.d}</span></span>
              <span className="up-menu dim">···</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
