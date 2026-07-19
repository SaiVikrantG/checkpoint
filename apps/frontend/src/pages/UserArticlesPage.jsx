import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { getArticles, deleteArticles, updateArticle } from '../data/articles';

const filters = ['all', 'public', 'private'];
const PAGE_SIZE = 10;

export default function UserArticlesPage() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [activeFilter, setActiveFilter] = useState('all');
  const [articles, setArticles] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    getArticles(1, 100, { createdBy: user?.id })
      .then((res) => {
        setArticles(res.data);
        setInitialLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load articles:', err);
        setInitialLoading(false);
      });
  }, [isLoaded, user?.id]);

  const filtered = useMemo(() => {
    let result = articles;
    if (activeFilter === 'public') result = result.filter((a) => a.is_public);
    else if (activeFilter === 'private') result = result.filter((a) => !a.is_public);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.project_name && a.project_name.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [articles, activeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [visibilityTarget, setVisibilityTarget] = useState(null);

  const handleDelete = async () => {
    try {
      await deleteArticles([...selected]);
      setArticles((prev) => prev.filter((a) => !selected.has(a.id)));
      setSelected(new Set());
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Failed to delete articles:', err);
    }
  };

  const handleVisibilityConfirm = async () => {
    if (!visibilityTarget) return;
    try {
      const updated = await updateArticle(visibilityTarget.id, {
        is_public: !visibilityTarget.is_public,
      });
      setArticles((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setVisibilityTarget(null);
    } catch (err) {
      console.error('Failed to update article visibility:', err);
    }
  };

  if (initialLoading) {
    return (
      <div className="av-empty">
        <span className="dim">loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="user-head">
        <div>
          <h1 className="user-h1">articles</h1>
          <div className="user-sub">
            // {articles.length} total · {articles.filter((a) => a.is_public).length} public ·{' '}
            {articles.filter((a) => !a.is_public).length} private
          </div>
        </div>
        <div className="user-head-actions">
          <input
            className="user-search"
            type="text"
            placeholder="search by title or project..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <div className="user-tabs">
            {filters.map((f) => (
              <button
                key={f}
                className={'chip' + (f === activeFilter ? ' chip-active' : '')}
                onClick={() => {
                  setActiveFilter(f);
                  setPage(1);
                }}
              >
                {f}
              </button>
            ))}
          </div>
          {selected.size > 0 && (
            <button
              className="btn-ghost"
              style={{ borderColor: '#c0392b', color: '#c0392b' }}
              onClick={() => setShowDeleteModal(true)}
            >
              delete ({selected.size})
            </button>
          )}
          <button className="btn-primary" onClick={() => navigate('/user/articles/new')}>
            + new article
          </button>
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
        {paged.map((a) => (
          <div
            key={a.id}
            className={
              'ut-row' +
              (!a.is_public ? ' ut-row-draft' : '') +
              (selected.has(a.id) ? ' ut-row-selected' : '')
            }
          >
            <span className="ut-cell ut-check">
              <input
                type="checkbox"
                className="ut-checkbox"
                checked={selected.has(a.id)}
                onChange={() => toggleSelect(a.id)}
              />
            </span>
            <span
              className="ut-cell ut-title"
              onClick={() => navigate(`/user/articles/${a.id}/view`)}
              style={{ cursor: 'pointer' }}
            >
              <span className="ut-title-name">{a.title}</span>
              {!a.is_public && <span className="badge badge-draft">private</span>}
            </span>
            <span className="ut-cell ut-proj">
              {!a.project_name ? (
                <span className="dim">standalone</span>
              ) : (
                <span className="ut-proj-chip">~/{a.project_name}</span>
              )}
            </span>
            <span className="ut-cell dim">{new Date(a.updated_at).toLocaleDateString()}</span>
            <span className="ut-cell ut-views">{a.views > 0 ? a.views.toLocaleString() : '—'}</span>
            <span className="ut-cell">
              <span
                className={'toggle' + (a.is_public ? ' toggle-on' : '')}
                onClick={(e) => {
                  e.stopPropagation();
                  setVisibilityTarget(a);
                }}
              >
                <span className="toggle-knob" />
              </span>
            </span>
            <span className="ut-cell">
              <span
                className="ut-edit-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/articles/${a.id}/edit`);
                }}
              >
                edit
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="user-table-foot">
        <span className="dim">
          // {Math.min((safePage - 1) * PAGE_SIZE + 1, filtered.length)}–
          {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} shown
        </span>
        <div className="user-paging">
          <span
            className={'kbd' + (safePage <= 1 ? ' kbd-disabled' : '')}
            onClick={() => safePage > 1 && setPage(safePage - 1)}
          >
            ←
          </span>
          <span className="dim">
            page {safePage} / {totalPages}
          </span>
          <span
            className={'kbd' + (safePage >= totalPages ? ' kbd-disabled' : '')}
            onClick={() => safePage < totalPages && setPage(safePage + 1)}
          >
            →
          </span>
        </div>
      </div>

      {showDeleteModal &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">confirm delete</div>
              <p className="modal-body">
                are you sure you want to delete {selected.size}{' '}
                {selected.size === 1 ? 'article' : 'articles'}? this action cannot be undone.
              </p>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowDeleteModal(false)}>
                  cancel
                </button>
                <button className="btn-ghost modal-btn-danger" onClick={handleDelete}>
                  delete
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {visibilityTarget &&
        createPortal(
          <div className="modal-overlay" onClick={() => setVisibilityTarget(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">change visibility</div>
              <p className="modal-body">
                are you sure you want to make <strong>"{visibilityTarget.title}"</strong>{' '}
                {visibilityTarget.is_public ? 'private' : 'public'}?
                {visibilityTarget.is_public
                  ? ' it will no longer be visible to others.'
                  : ' it will be visible to everyone.'}
              </p>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setVisibilityTarget(null)}>
                  cancel
                </button>
                <button className="btn-primary" onClick={handleVisibilityConfirm}>
                  make {visibilityTarget.is_public ? 'private' : 'public'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
