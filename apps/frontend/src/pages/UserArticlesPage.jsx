import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const articles = [
  { date: '2026-05-28', title: 'designing a notch header in css', proj: 'checkpoint', views: '3,214', isPublic: true, draft: false },
  { date: '2026-05-19', title: 'the case for plain markdown', proj: '—', views: '1,884', isPublic: true, draft: false },
  { date: '2026-05-02', title: 'raymarching, but slowly', proj: 'rust-rays', views: '3,180', isPublic: true, draft: false },
  { date: '2026-04-21', title: 'a tiny job queue in 200 lines', proj: '—', views: '982', isPublic: true, draft: false },
  { date: '2026-04-04', title: 'why i rewrote my dotfiles (again)', proj: 'dotfiles', views: '612', isPublic: true, draft: false },
  { date: '2026-06-04', title: '[draft] writing about writing', proj: '—', views: '—', isPublic: false, draft: true },
  { date: '2026-06-02', title: '[draft] notes on bvh traversal', proj: 'rust-rays', views: '—', isPublic: false, draft: true },
  { date: '2026-03-12', title: 'voxel meshing without the pain', proj: 'voxel-engine', views: '742', isPublic: true, draft: false },
  { date: '2026-02-28', title: 'shipping checkpoint v0', proj: 'checkpoint', views: '1,402', isPublic: true, draft: false },
];

const filters = ['all', 'public', 'drafts', 'scheduled'];

export default function UserArticlesPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');

  const filtered = activeFilter === 'all'
    ? articles
    : activeFilter === 'public'
      ? articles.filter((a) => a.isPublic)
      : activeFilter === 'drafts'
        ? articles.filter((a) => a.draft)
        : [];

  return (
    <>
      <div className="user-head">
        <div>
          <h1 className="user-h1">articles</h1>
          <div className="user-sub">// {articles.length} total · {articles.filter((a) => a.isPublic).length} public · {articles.filter((a) => a.draft).length} drafts</div>
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
          <button className="btn-primary" onClick={() => navigate('/user/articles/new')}>+ new article</button>
        </div>
      </div>

      <div className="user-table">
        <div className="ut-head">
          <span></span>
          <span>title</span>
          <span>project</span>
          <span>updated</span>
          <span>views</span>
          <span>public</span>
          <span></span>
        </div>
        {filtered.map((a, i) => (
          <div key={i} className={'ut-row' + (a.draft ? ' ut-row-draft' : '')}>
            <span className="ut-cell ut-check">
              <span className="ut-checkbox"></span>
            </span>
            <span className="ut-cell ut-title">
              <span className="ut-title-name">{a.title}</span>
              {a.draft && <span className="badge badge-draft">draft</span>}
            </span>
            <span className="ut-cell ut-proj">
              {a.proj === '—'
                ? <span className="dim">standalone</span>
                : <span className="ut-proj-chip">~/{a.proj}</span>
              }
            </span>
            <span className="ut-cell dim">{a.date}</span>
            <span className="ut-cell ut-views">{a.views}</span>
            <span className="ut-cell">
              <span className={'toggle' + (a.isPublic ? ' toggle-on' : '')}>
                <span className="toggle-knob" />
              </span>
            </span>
            <span className="ut-cell ut-menu">···</span>
          </div>
        ))}
      </div>

      <div className="user-table-foot">
        <span className="dim">// {filtered.length} of {articles.length} shown</span>
        <div className="user-paging">
          <span className="kbd">←</span>
          <span className="dim">page 1 / 1</span>
          <span className="kbd">→</span>
        </div>
      </div>
    </>
  );
}
