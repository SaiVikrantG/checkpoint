import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const initialArticles = [
  { id: 1, date: '2026-05-28', title: 'designing a notch header in css', proj: 'checkpoint', views: '3,214', isPublic: true },
  { id: 2, date: '2026-05-19', title: 'the case for plain markdown', proj: '—', views: '1,884', isPublic: true },
  { id: 3, date: '2026-05-02', title: 'raymarching, but slowly', proj: 'rust-rays', views: '3,180', isPublic: true },
  { id: 4, date: '2026-04-21', title: 'a tiny job queue in 200 lines', proj: '—', views: '982', isPublic: true },
  { id: 5, date: '2026-04-04', title: 'why i rewrote my dotfiles (again)', proj: 'dotfiles', views: '612', isPublic: true },
  { id: 6, date: '2026-06-04', title: 'writing about writing', proj: '—', views: '—', isPublic: false },
  { id: 7, date: '2026-06-02', title: 'notes on bvh traversal', proj: 'rust-rays', views: '—', isPublic: false },
  { id: 8, date: '2026-03-12', title: 'voxel meshing without the pain', proj: 'voxel-engine', views: '742', isPublic: true },
  { id: 9, date: '2026-02-28', title: 'shipping checkpoint v0', proj: 'checkpoint', views: '1,402', isPublic: true },
];

const filters = ['all', 'public', 'private'];

export default function UserArticlesPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [articles, setArticles] = useState(initialArticles);
  const [selected, setSelected] = useState(new Set());

  const filtered = activeFilter === 'all'
    ? articles
    : activeFilter === 'public'
      ? articles.filter((a) => a.isPublic)
      : articles.filter((a) => !a.isPublic);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = () => {
    setArticles((prev) => prev.filter((a) => !selected.has(a.id)));
    setSelected(new Set());
  };

  return (
    <>
      <div className="user-head">
        <div>
          <h1 className="user-h1">articles</h1>
          <div className="user-sub">// {articles.length} total · {articles.filter((a) => a.isPublic).length} public · {articles.filter((a) => !a.isPublic).length} private</div>
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
          {selected.size > 0 && (
            <button className="btn-ghost" style={{ borderColor: '#c0392b', color: '#c0392b' }} onClick={handleDelete}>
              delete ({selected.size})
            </button>
          )}
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
        {filtered.map((a) => (
          <div key={a.id} className={'ut-row' + (!a.isPublic ? ' ut-row-draft' : '') + (selected.has(a.id) ? ' ut-row-selected' : '')}>
            <span className="ut-cell ut-check">
              <input
                type="checkbox"
                className="ut-checkbox"
                checked={selected.has(a.id)}
                onChange={() => toggleSelect(a.id)}
              />
            </span>
            <span className="ut-cell ut-title">
              <span className="ut-title-name">{a.title}</span>
              {!a.isPublic && <span className="badge badge-draft">private</span>}
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
