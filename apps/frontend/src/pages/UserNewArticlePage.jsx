import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import Editor from '../components/Editor';
import { getArticleById, updateArticle, createArticle } from '../data/articles';
import { getProjects } from '../data/projects';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { useToast } from '../context/ToastContext';

export default function UserNewArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [article, setArticle] = useState(null);
  const [projects, setProjects] = useState([]);
  const [articleLoading, setArticleLoading] = useState(true);
  const isEdit = !!article;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [status, setStatus] = useState('draft');
  const { showToast } = useToast();

  const savedState = useRef({
    title: '',
    slug: '',
    isPublic: true,
    contentText: '',
    projectId: null,
    tags: [],
  });

  useEffect(() => {
    if (!isLoaded) return;
    const load = async () => {
      try {
        const projRes = await getProjects(1, 100, { createdBy: user?.id });
        setProjects(projRes.data);

        if (id) {
          const data = await getArticleById(Number(id));
          setArticle(data);
          setTitle(data.title);
          setSlug(data.slug ?? '');
          setSelectedProjectId(data.project_id ?? null);
          setTags(data.tags ?? []);
          setIsPublic(data.is_public);
          setStatus('saved');
          savedState.current = {
            title: data.title,
            slug: data.slug ?? '',
            isPublic: data.is_public,
            contentText: '',
            projectId: data.project_id ?? null,
            tags: data.tags ?? [],
          };
          if (data.content) {
            const text = data.content.replace(/<[^>]*>/g, ' ').trim();
            setWordCount(text.split(/\s+/).filter(Boolean).length);
          }
        }
      } catch (err) {
        console.error('Failed to load article data:', err);
        showToast(err.message);
      }
      setArticleLoading(false);
    };
    load();
  }, [id, isLoaded, user?.id, showToast]);
  const currentContentText = useRef('');
  const hasContent = useRef(false);

  const [titleDirty, setTitleDirty] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [visibilityDirty, setVisibilityDirty] = useState(false);
  const [projectDirty, setProjectDirty] = useState(false);
  const [tagsDirty, setTagsDirty] = useState(false);

  const [modal, setModal] = useState(null);
  const [hint, setHint] = useState('');

  const isDirty = titleDirty || contentDirty || visibilityDirty || projectDirty || tagsDirty;
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

  const cancelLeave = () => {
    setModal(null);
  };

  const latestHtml = useRef('');

  const handleUpdate = useCallback((data) => {
    const text = data.text.trim();
    const words = text.split(/\s+/).filter(Boolean).length;
    setWordCount(words);
    currentContentText.current = text;
    latestHtml.current = data.html;
    hasContent.current = text.length > 0;
    const changed = text !== savedState.current.contentText;
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
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, ''),
    );
  };

  const handleVisibilityToggle = () => {
    const next = !isPublic;
    setIsPublic(next);
    const changed = next !== savedState.current.isPublic;
    setVisibilityDirty(changed);
    if (changed) setStatus('new changes');
  };

  const handleSaveClick = () => {
    if (hasContent.current && title.trim() === '') {
      setHint('add a title before saving');
      return;
    }
    setHint('');
    setModal('save');
  };

  const confirmSave = async () => {
    const data = {
      title,
      slug,
      is_public: isPublic,
      content: latestHtml.current,
      tags,
      project_id: selectedProjectId,
    };

    setStatus('saving...');
    setModal(null);

    try {
      if (isEdit) {
        const updated = await updateArticle(article.id, data);
        setArticle(updated);
      } else {
        const created = await createArticle(data);
        setArticle(created);
      }

      savedState.current = {
        title,
        slug,
        isPublic,
        contentText: currentContentText.current,
        projectId: selectedProjectId,
        tags: [...tags],
      };
      setStatus('saved');
      setTitleDirty(false);
      setContentDirty(false);
      setVisibilityDirty(false);
      setProjectDirty(false);
      setTagsDirty(false);
    } catch (err) {
      console.error('Failed to save article:', err);
      showToast(err.message);
      setStatus('error');
    }
  };

  const confirmDelete = () => {
    setModal(null);
    navigate('/user/articles');
  };

  if (articleLoading) {
    return (
      <div className="av-empty">
        <span className="dim">loading...</span>
      </div>
    );
  }

  const handleProjectChange = (e) => {
    const val = e.target.value;
    const pid = val === '' ? null : Number(val);
    setSelectedProjectId(pid);
    const changed = pid !== savedState.current.projectId;
    setProjectDirty(changed);
    if (changed) setStatus('new changes');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        const next = [...tags, val];
        setTags(next);
        const changed = JSON.stringify(next) !== JSON.stringify(savedState.current.tags);
        setTagsDirty(changed);
        if (changed) setStatus('new changes');
      }
      setTagInput('');
    }
    if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      const next = tags.slice(0, -1);
      setTags(next);
      const changed = JSON.stringify(next) !== JSON.stringify(savedState.current.tags);
      setTagsDirty(changed);
      if (changed) setStatus('new changes');
    }
  };

  const removeTag = (tag) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    const changed = JSON.stringify(next) !== JSON.stringify(savedState.current.tags);
    setTagsDirty(changed);
    if (changed) setStatus('new changes');
  };

  return (
    <>
      <div className="comp-bar">
        <div className="comp-bar-left">
          <span
            className="dim"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              if (isDirtyRef.current) {
                pendingNav.current = '/user/articles';
                setModal('unsaved');
              } else navigate('/user/articles');
            }}
          >
            ← articles /
          </span>
          <span className="accent">{isEdit ? 'edit' : 'new'}</span>
          <span className={'badge ' + (status === 'new changes' ? 'badge-warn' : 'badge-draft')}>
            {status}
          </span>
        </div>
        <div className="comp-bar-right">
          <span className="dim">
            {wordCount} words · ~{Math.max(1, Math.round(wordCount / 200))} min read
          </span>
          <button className="btn-primary" disabled={!isDirty} onClick={handleSaveClick}>
            save
          </button>
        </div>
      </div>

      <div className="comp-layout">
        <section className="comp-editor">
          <div className="comp-editor-header">
            <input
              className="comp-title"
              placeholder="article title..."
              value={title}
              onChange={handleTitleChange}
            />
            {hint && <span className="comp-hint">{hint}</span>}
            <input
              className="comp-slug"
              placeholder="/articles/your-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>

          <Editor content={article?.content ?? ''} onUpdate={handleUpdate} />
        </section>

        <aside className="comp-side">
          {isEdit && (
            <div className="comp-panel">
              <div className="panel-head">// details</div>
              <div className="comp-field">
                <span className="comp-field-label">created</span>
                <div className="comp-field-row">
                  <span className="dim">{new Date(article.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {article.updated_at !== article.created_at && (
                <div className="comp-field">
                  <span className="comp-field-label">last updated</span>
                  <div className="comp-field-row">
                    <span className="dim">{new Date(article.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
              <div className="comp-field">
                <span className="comp-field-label">views</span>
                <div className="comp-field-row">
                  <span className="dim">{article.views.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="comp-panel">
            <div className="panel-head">// publish</div>
            <div className="comp-field">
              <span className="comp-field-label">visibility</span>
              <div className="comp-field-row">
                <span
                  className={'toggle' + (isPublic ? ' toggle-on' : '')}
                  onClick={handleVisibilityToggle}
                >
                  <span className="toggle-knob" />
                </span>
                <span>{isPublic ? 'public' : 'private'}</span>
                <span className="dim">— {isPublic ? 'visible on site' : 'only you'}</span>
              </div>
            </div>
            <div className="comp-field">
              <span className="comp-field-label">project</span>
              <select
                className="comp-select-input"
                value={selectedProjectId ?? ''}
                onChange={handleProjectChange}
              >
                <option value="">none (standalone)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    ~/{p.name}
                  </option>
                ))}
              </select>
              <span className="dim" style={{ fontSize: 11 }}>
                optional · articles can be standalone
              </span>
            </div>
            <div className="comp-field">
              <span className="comp-field-label">tags</span>
              <div className="comp-tags">
                {tags.map((t) => (
                  <span key={t} className="art-tag" onClick={() => removeTag(t)}>
                    {t} ×
                  </span>
                ))}
                <input
                  className="comp-tag-input"
                  placeholder="add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                />
              </div>
            </div>
          </div>

          <div className="comp-panel">
            <div className="panel-head">// danger</div>
            <button className="btn-ghost comp-danger" onClick={() => setModal('delete')}>
              delete
            </button>
          </div>
        </aside>
      </div>

      {modal &&
        createPortal(
          <div className="modal-overlay" onClick={() => setModal(null)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              {modal === 'save' && (
                <>
                  <div className="modal-title">save changes</div>
                  <p className="modal-body">are you sure you want to save your changes?</p>
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
                    <button className="btn-ghost" onClick={cancelLeave}>
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
                    are you sure you want to delete this article? this action cannot be undone.
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
    </>
  );
}
