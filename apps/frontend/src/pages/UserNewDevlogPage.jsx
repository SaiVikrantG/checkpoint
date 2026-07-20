import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Editor from '../components/Editor';
import { getProjects } from '../data/projects';
import { getDevlogById, getDevlogsByProject, createDevlog, updateDevlog } from '../data/devlogs';
import { useNavigationGuard } from '../context/NavigationGuardContext';

export default function UserNewDevlogPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [devlog, setDevlog] = useState(null);
  const [projects, setProjectsList] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const isEdit = !!devlog;

  const [selectedProject, setSelectedProject] = useState('');
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [status, setStatus] = useState('draft');
  const [modal, setModal] = useState(null);
  const [hint, setHint] = useState('');

  const latestHtml = useRef('');
  const currentText = useRef('');
  const savedState = useRef({
    title: '',
    project: '',
    isPublic: true,
    contentText: '',
  });

  useEffect(() => {
    if (!isLoaded) return;
    const loadData = async () => {
      try {
        const projRes = await getProjects(1, 100, { createdBy: user?.id });
        setProjectsList(projRes.data);

        let loaded = null;
        if (id) {
          loaded = await getDevlogById(Number(id));
          setDevlog(loaded);
        }

        const projName =
          loaded?.project_name || (projRes.data.length > 0 ? projRes.data[0].name : '');
        setSelectedProject(projName);
        setTitle(loaded?.title ?? '');
        setIsPublic(loaded?.is_public ?? true);
        setStatus(loaded ? 'saved' : 'draft');
        latestHtml.current = loaded?.content ?? '';
        savedState.current = {
          title: loaded?.title ?? '',
          project: projName,
          isPublic: loaded?.is_public ?? true,
          contentText: '',
        };
      } catch (err) {
        console.error('Failed to load devlog data:', err);
      }
      setPageLoading(false);
    };
    loadData();
  }, [id, isLoaded, user?.id]);

  const [titleDirty, setTitleDirty] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [projectDirty, setProjectDirty] = useState(false);

  const isDirty = titleDirty || contentDirty || projectDirty;
  const { setGuard, clearGuard } = useNavigationGuard();
  const isDirtyRef = useRef(false);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);
  const pendingNav = useRef(null);

  useEffect(() => {
    setGuard((to) => {
      if (isDirtyRef.current) {
        pendingNav.current = to;
        setModal('unsaved');
        return false;
      }
      return true;
    });
    return () => clearGuard();
  }, [setGuard, clearGuard]);

  useEffect(() => {
    const handler = (e) => {
      if (isDirtyRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const confirmLeave = () => {
    const to = pendingNav.current;
    pendingNav.current = null;
    clearGuard();
    setModal(null);
    navigate(to);
  };

  const handleUpdate = useCallback((data) => {
    currentText.current = data.text.trim();
    latestHtml.current = data.html;
    const changed = currentText.current !== savedState.current.contentText;
    setContentDirty(changed);
    if (changed) setStatus('new changes');
  }, []);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    const changed = val !== savedState.current.title;
    setTitleDirty(changed);
    if (changed) setStatus('new changes');
    if (val.trim().length > 0) setHint('');
  };

  const handleProjectChange = (name) => {
    setSelectedProject(name);
    const changed = name !== savedState.current.project;
    setProjectDirty(changed);
    if (changed) setStatus('new changes');
  };

  const handleSaveClick = () => {
    if (title.trim() === '') {
      setHint('add a title before saving');
      return;
    }
    setHint('');
    setModal('save');
  };

  const selectedProjectObj = projects.find((p) => p.name === selectedProject);

  const confirmSave = async () => {
    const data = {
      title,
      content: latestHtml.current,
      is_public: isPublic,
      project_id: selectedProjectObj?.id ?? null,
    };

    setStatus('saving...');
    setModal(null);

    try {
      if (isEdit) {
        const updated = await updateDevlog(devlog.id, data);
        setDevlog(updated);
      } else {
        const created = await createDevlog(data);
        setDevlog(created);
      }

      savedState.current = {
        title,
        project: selectedProject,
        isPublic,
        contentText: currentText.current,
      };
      setStatus('saved');
      setTitleDirty(false);
      setContentDirty(false);
      setProjectDirty(false);
    } catch (err) {
      console.error('Failed to save devlog:', err);
      setStatus('error');
    }
  };

  const confirmDelete = () => {
    setModal(null);
    navigate('/user/devlogs');
  };

  const [recentEntries, setRecentEntries] = useState([]);

  useEffect(() => {
    const proj = projects.find((p) => p.name === selectedProject);
    // Clearing stale results as part of synchronizing with the fetch below,
    // same effect's concern — not a standalone derived-state assignment.
    if (!proj) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecentEntries([]);
      return;
    }
    getDevlogsByProject(proj.id, 1, 5)
      .then((res) => {
        setRecentEntries(res.data);
      })
      .catch(() => setRecentEntries([]));
  }, [selectedProject, projects]);

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  if (pageLoading) {
    return (
      <div className="av-empty">
        <span className="dim">loading...</span>
      </div>
    );
  }

  return (
    <div className="dl-modal-wrap">
      <div className="dl-modal">
        <div className="dl-modal-head">
          <span
            className="dim"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (isDirtyRef.current) {
                pendingNav.current = '/user/devlogs';
                setModal('unsaved');
              } else navigate('/user/devlogs');
            }}
          >
            ← devlogs /
          </span>
          <span className="accent">{isEdit ? 'edit' : 'new'}</span>
          <span className={'badge ' + (status === 'new changes' ? 'badge-warn' : 'badge-draft')}>
            {status}
          </span>
        </div>

        <div className="dl-modal-body">
          <div className="comp-field">
            <span className="comp-field-label">
              title <span className="accent">*</span>
            </span>
            <input
              className="dl-modal-input"
              style={{ minHeight: 'auto', resize: 'none' }}
              placeholder="what'd you do?"
              value={title}
              onChange={handleTitleChange}
            />
            {hint && <span className="comp-hint">{hint}</span>}
          </div>

          <div className="comp-field">
            <span className="comp-field-label">
              project <span className="accent">*</span>
            </span>
            <div className="dl-proj-list">
              {projects.map((p) => (
                <div
                  key={p.name}
                  className={'dl-proj-row' + (p.name === selectedProject ? ' active' : '')}
                  onClick={() => handleProjectChange(p.name)}
                >
                  <span>~/{p.name}</span>
                  <span className="dim">{p.devlogs_count} entries</span>
                </div>
              ))}
            </div>
          </div>

          <div className="comp-field">
            <span className="comp-field-label">content</span>
            <div className="dl-editor-wrap">
              <Editor content={devlog?.content ?? ''} onUpdate={handleUpdate} />
            </div>
          </div>

          <div className="dl-meta-row dim">
            <span>{timestamp} (auto)</span>
            <span>·</span>
            <span>linked to ~/{selectedProject}</span>
            <span>·</span>
            <span style={{ cursor: 'pointer' }} onClick={() => setIsPublic((v) => !v)}>
              {isPublic ? 'public' : 'private'}
            </span>
          </div>
        </div>

        <div className="dl-modal-foot">
          <span className="dim">⌘↵ save · esc cancel</span>
          <div className="comp-bar-right">
            {isEdit && (
              <button
                className="btn-ghost"
                style={{ borderColor: '#c0392b', color: '#c0392b' }}
                onClick={() => setModal('delete')}
              >
                delete
              </button>
            )}
            <button
              className="btn-ghost"
              onClick={() => {
                if (isDirtyRef.current) {
                  pendingNav.current = '/user/devlogs';
                  setModal('unsaved');
                } else navigate('/user/devlogs');
              }}
            >
              cancel
            </button>
            <button className="btn-primary" disabled={!isDirty} onClick={handleSaveClick}>
              save entry
            </button>
          </div>
        </div>
      </div>

      <div className="dl-modal-side">
        <div className="comp-panel">
          <div className="panel-head">// recent in ~/{selectedProject}</div>
          <ul className="dl-modal-recent">
            {recentEntries.length > 0 ? (
              recentEntries.map((e) => (
                <li key={e.id}>
                  <span className="dim">
                    {new Date(e.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {e.title}
                </li>
              ))
            ) : (
              <li className="dim">no entries yet</li>
            )}
          </ul>
        </div>
      </div>

      {modal &&
        createPortal(
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              {modal === 'save' && (
                <>
                  <div className="modal-title">save devlog</div>
                  <p className="modal-body">save this entry to ~/{selectedProject}?</p>
                  <div className="modal-actions">
                    <button className="btn-ghost" onClick={() => setModal(null)}>
                      cancel
                    </button>
                    <button className="btn-primary" onClick={confirmSave}>
                      save
                    </button>
                  </div>
                </>
              )}
              {modal === 'unsaved' && (
                <>
                  <div className="modal-title">unsaved changes</div>
                  <p className="modal-body">
                    you have unsaved changes that will be lost. are you sure you want to leave?
                  </p>
                  <div className="modal-actions">
                    <button className="btn-ghost" onClick={() => setModal(null)}>
                      stay
                    </button>
                    <button className="btn-ghost modal-btn-danger" onClick={confirmLeave}>
                      leave
                    </button>
                  </div>
                </>
              )}
              {modal === 'delete' && (
                <>
                  <div className="modal-title">confirm delete</div>
                  <p className="modal-body">
                    are you sure you want to delete this devlog? this action cannot be undone.
                  </p>
                  <div className="modal-actions">
                    <button className="btn-ghost" onClick={() => setModal(null)}>
                      cancel
                    </button>
                    <button className="btn-ghost modal-btn-danger" onClick={confirmDelete}>
                      delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
