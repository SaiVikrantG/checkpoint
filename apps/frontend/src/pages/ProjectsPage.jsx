import { useState } from 'react';

const projects = [
  {
    name: 'checkpoint',
    status: 'live',
    blurb:
      'this website. a self-hosted devlog + writing platform with a tree-style timeline, fuzzy finder, and theme picker.',
    stack: ['typescript', 'next.js', 'postgres', 'tailwind'],
    repo: 'https://github.com/SaiVikrantG/checkpoint',
  },
  {
    name: 'rust-rays',
    status: 'wip',
    blurb:
      'a tiny cpu raytracer. supports spheres, planes, refraction, soft shadows. 800 lines of safe rust, no deps.',
    stack: ['rust', 'raytracing', 'cli'],
    repo: '#',
  },
  {
    name: 'voxel-engine',
    status: 'paused',
    blurb:
      'greedy-meshing voxel renderer with infinite chunk streaming. trying to beat my own framerate every weekend.',
    stack: ['rust', 'wgpu', 'glam'],
    repo: '#',
  },
  {
    name: 'dotfiles',
    status: 'live',
    blurb:
      'nix-managed dotfiles. neovim, tmux, ghostty, hyprland. one command bootstrap on a fresh machine.',
    stack: ['nix', 'lua', 'bash'],
    repo: '#',
  },
  {
    name: 'todo-tree',
    status: 'live',
    blurb:
      'cli todo manager that organises tasks as a tree. infinite nesting, fuzzy jump, jsonl storage.',
    stack: ['go', 'cobra', 'bubbletea'],
    repo: '#',
  },
  {
    name: 'tinyhttp',
    status: 'archived',
    blurb:
      'an http/1.1 server written from scratch in c, no libc beyond syscalls. mostly an excuse to read rfcs.',
    stack: ['c', 'sockets', 'rfc-7230'],
    repo: '#',
  },
];

const filters = ['all', 'live', 'wip', 'paused', 'archived'];

export default function ProjectsPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered =
    activeFilter === 'all' ? projects : projects.filter((p) => p.status === activeFilter);

  return (
    <>
      <div className="proj-head">
        <h1 className="proj-h1">projects</h1>
        <div className="proj-sub">
          // {projects.length} repos ·{' '}
          {projects.filter((p) => p.status === 'live' || p.status === 'wip').length} currently in
          flight
        </div>
        <div className="proj-filters">
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
      </div>
      <div className="proj-grid">
        {filtered.map((p) => (
          <div key={p.name} className="proj-card">
            <div className="proj-card-head">
              <span className={'proj-status proj-status-' + p.status}>● {p.status}</span>
              <a className="proj-repo" href={p.repo} target="_blank" rel="noopener noreferrer">
                <span className="proj-repo-icon">&#8599;</span>
                <span>repo</span>
              </a>
            </div>
            <div className="proj-name">~/{p.name}</div>
            <div className="proj-blurb">{p.blurb}</div>
            <div className="proj-stack">
              {p.stack.map((s) => (
                <span key={s} className="proj-chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
