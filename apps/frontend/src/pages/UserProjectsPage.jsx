import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getProjects } from '../data/projects';

const PAGE_SIZE = 6;
const filters = ['all', 'live', 'wip', 'archived'];
const statusOptions = ['live', 'wip', 'archived'];

export default function UserProjectsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [projects, setProjects] = useState(getProjects);
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '', status: 'wip', stack: '', is_public: true });
  const [editProject, setEditProject] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  const filtered = activeFilter === 'all'
    ? projects
    : projects.filter((p) => p.status === activeFilter);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeFilter]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((v) => Math.min(v + PAGE_SIZE, filtered.length));
      setLoading(false);
    }, 400);
  }, [hasMore, loading, filtered.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = () => {
    setProjects((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    setModal(null);
  };

  const openEdit = (p) => {
    setEditProject({ ...p, stack: p.stack.join(', ') });
    setModal('edit');
  };

  const handleSaveEdit = () => {
    setProjects((prev) => prev.map((p) =>
      p.id === editProject.id
        ? {
            ...p,
            name: editProject.name,
            description: editProject.description,
            url: editProject.url || null,
            status: editProject.status,
            stack: editProject.stack.split(',').map((s) => s.trim()).filter(Boolean),
            is_public: editProject.is_public,
            updated_at: new Date().toISOString(),
          }
        : p
    ));
    setEditProject(null);
    setModal(null);
  };

  const handleCreate = () => {
    const project = {
      id: Date.now(),
      name: newProject.name,
      description: newProject.description,
      url: newProject.url || null,
      status: newProject.status,
      stack: newProject.stack.split(',').map((s) => s.trim()).filter(Boolean),
      is_public: newProject.is_public,
      articles_count: 0,
      devlogs_count: 0,
      created_by: 'user-123',
      updated_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, project]);
    setNewProject({ name: '', description: '', url: '', status: 'wip', stack: '', is_public: true });
    setModal(null);
  };

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
          {selected.size > 0 && (
            <button className="btn-ghost" style={{ borderColor: '#c0392b', color: '#c0392b' }} onClick={() => setModal('delete')}>
              delete ({selected.size})
            </button>
          )}
        </div>
      </div>

      <div className="up-grid">
        <div className="up-card up-new" onClick={() => setModal('create')}>
          <div className="up-new-icon">+</div>
          <div className="up-new-title">new project</div>
          <div className="up-new-sub dim">name, blurb, repo, stack</div>
        </div>

        {visible.map((p) => (
          <div key={p.id} className={'up-card' + (selected.has(p.id) ? ' up-card-selected' : '')}>
            <div className="up-card-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  className="ut-checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggleSelect(p.id)}
                />
                <span className={'proj-status proj-status-' + p.status}>● {p.status}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {p.url && (
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="up-link"
                    title={p.url}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ↗
                  </a>
                )}
                <span
                  className={'toggle toggle-sm' + (p.is_public ? ' toggle-on' : '')}
                  onClick={() => setProjects((prev) => prev.map((proj) => proj.id === p.id ? { ...proj, is_public: !proj.is_public } : proj))}
                >
                  <span className="toggle-knob" />
                </span>
              </div>
            </div>
            <div className="up-card-body" onClick={() => openEdit(p)} style={{ cursor: 'pointer' }}>
              <div className="up-name">~/{p.name}</div>
              <div className="up-blurb">{p.description}</div>
              <div className="up-stack">
                {p.stack.map((s) => <span key={s} className="proj-chip">{s}</span>)}
              </div>
              <div className="up-foot">
                <span><span className="dim">articles </span><span className="accent">{p.articles_count}</span></span>
                <span><span className="dim">devlogs </span><span className="accent">{p.devlogs_count}</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="up-sentinel" ref={sentinelRef}>
          {loading && <div className="up-loader"><span className="up-loader-dot" /><span className="up-loader-dot" /><span className="up-loader-dot" /></div>}
        </div>
      )}
      {!hasMore && filtered.length > PAGE_SIZE && (
        <div className="up-end dim">// all {filtered.length} projects loaded</div>
      )}

      {modal && createPortal(
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={modal === 'create' || modal === 'edit' ? { maxWidth: 480 } : undefined}>
            {modal === 'delete' && (
              <>
                <div className="modal-title">confirm delete</div>
                <p className="modal-body">
                  are you sure you want to delete {selected.size} {selected.size === 1 ? 'project' : 'projects'}? this action cannot be undone.
                </p>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => setModal(null)}>cancel</button>
                  <button className="btn-ghost modal-btn-danger" onClick={handleDelete}>delete</button>
                </div>
              </>
            )}
            {modal === 'create' && (
              <>
                <div className="modal-title">new project</div>
                <div className="modal-form">
                  <label className="modal-label">
                    <span>name</span>
                    <input
                      className="modal-input"
                      placeholder="project name"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </label>
                  <label className="modal-label">
                    <span>description</span>
                    <input
                      className="modal-input"
                      placeholder="short blurb"
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </label>
                  <label className="modal-label">
                    <span>url</span>
                    <input
                      className="modal-input"
                      placeholder="https://github.com/..."
                      value={newProject.url}
                      onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
                    />
                  </label>
                  <label className="modal-label">
                    <span>stack</span>
                    <input
                      className="modal-input"
                      placeholder="go, react, postgres"
                      value={newProject.stack}
                      onChange={(e) => setNewProject({ ...newProject, stack: e.target.value })}
                    />
                  </label>
                  <label className="modal-label">
                    <span>status</span>
                    <select
                      className="modal-input"
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <div className="modal-label-row">
                    <span>public</span>
                    <span
                      className={'toggle' + (newProject.is_public ? ' toggle-on' : '')}
                      onClick={() => setNewProject({ ...newProject, is_public: !newProject.is_public })}
                    >
                      <span className="toggle-knob" />
                    </span>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => setModal(null)}>cancel</button>
                  <button className="btn-primary" disabled={!newProject.name.trim()} onClick={handleCreate}>create</button>
                </div>
              </>
            )}
            {modal === 'edit' && editProject && (
              <>
                <div className="modal-title">edit project</div>
                <div className="modal-form">
                  <label className="modal-label">
                    <span>name</span>
                    <input
                      className="modal-input"
                      value={editProject.name}
                      onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                    />
                  </label>
                  <label className="modal-label">
                    <span>description</span>
                    <input
                      className="modal-input"
                      value={editProject.description}
                      onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                    />
                  </label>
                  <label className="modal-label">
                    <span>url</span>
                    <input
                      className="modal-input"
                      placeholder="https://github.com/..."
                      value={editProject.url || ''}
                      onChange={(e) => setEditProject({ ...editProject, url: e.target.value })}
                    />
                  </label>
                  <label className="modal-label">
                    <span>stack</span>
                    <input
                      className="modal-input"
                      value={editProject.stack}
                      onChange={(e) => setEditProject({ ...editProject, stack: e.target.value })}
                    />
                  </label>
                  <label className="modal-label">
                    <span>status</span>
                    <select
                      className="modal-input"
                      value={editProject.status}
                      onChange={(e) => setEditProject({ ...editProject, status: e.target.value })}
                    >
                      {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </label>
                  <div className="modal-label-row">
                    <span>public</span>
                    <span
                      className={'toggle' + (editProject.is_public ? ' toggle-on' : '')}
                      onClick={() => setEditProject({ ...editProject, is_public: !editProject.is_public })}
                    >
                      <span className="toggle-knob" />
                    </span>
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => setModal(null)}>cancel</button>
                  <button className="btn-primary" disabled={!editProject.name.trim()} onClick={handleSaveEdit}>save</button>
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
