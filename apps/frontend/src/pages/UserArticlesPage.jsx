import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getArticles, deleteArticles } from '../data/articles';

const filters = ['all', 'public', 'private'];

export default function UserArticlesPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [articles, setArticles] = useState(getArticles);
  const [selected, setSelected] = useState(new Set());

  const filtered = activeFilter === 'all'
    ? articles
    : activeFilter === 'public'
      ? articles.filter((a) => a.is_public)
      : articles.filter((a) => !a.is_public);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    deleteArticles([...selected]);
    setArticles(getArticles());
    setSelected(new Set());
    setShowDeleteModal(false);
  };

  return (
    <>
      <div className="user-head">
        <div>
          <h1 className="user-h1">articles</h1>
          <div className="user-sub">// {articles.length} total · {articles.filter((a) => a.is_public).length} public · {articles.filter((a) => !a.is_public).length} private</div>
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
            <button className="btn-ghost" style={{ borderColor: '#c0392b', color: '#c0392b' }} onClick={() => setShowDeleteModal(true)}>
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
          <div key={a.id} className={'ut-row' + (!a.is_public ? ' ut-row-draft' : '') + (selected.has(a.id) ? ' ut-row-selected' : '')}>
            <span className="ut-cell ut-check">
              <input
                type="checkbox"
                className="ut-checkbox"
                checked={selected.has(a.id)}
                onChange={() => toggleSelect(a.id)}
              />
            </span>
            <span className="ut-cell ut-title" onClick={() => navigate(`/user/articles/${a.id}/view`)} style={{ cursor: 'pointer' }}>
              <span className="ut-title-name">{a.title}</span>
              {!a.is_public && <span className="badge badge-draft">private</span>}
            </span>
            <span className="ut-cell ut-proj">
              {!a.project_name
                ? <span className="dim">standalone</span>
                : <span className="ut-proj-chip">~/{a.project_name}</span>
              }
            </span>
            <span className="ut-cell dim">{new Date(a.updated_at).toLocaleDateString()}</span>
            <span className="ut-cell ut-views">{a.views > 0 ? a.views.toLocaleString() : '—'}</span>
            <span className="ut-cell">
              <span className={'toggle' + (a.is_public ? ' toggle-on' : '')}>
                <span className="toggle-knob" />
              </span>
            </span>
            <span className="ut-cell">
              <span className="ut-edit-btn" onClick={(e) => { e.stopPropagation(); navigate(`/user/articles/${a.id}/edit`); }}>edit</span>
            </span>
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

      {showDeleteModal && createPortal(
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">confirm delete</div>
            <p className="modal-body">
              are you sure you want to delete {selected.size} {selected.size === 1 ? 'article' : 'articles'}? this action cannot be undone.
            </p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>cancel</button>
              <button className="btn-ghost modal-btn-danger" onClick={handleDelete}>delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
