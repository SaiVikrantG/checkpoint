import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '../components/Editor';
import { getArticleById, updateArticle, createArticle } from '../data/articles';
import { useNavigationGuard } from '../context/NavigationGuardContext';

export default function UserNewArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const article = useMemo(() => (id ? getArticleById(Number(id)) : null), [id]);
  const isEdit = !!article;

  const [title, setTitle] = useState(article?.title ?? '');
  const [slug, setSlug] = useState(article?.slug ?? '');
  const [isPublic, setIsPublic] = useState(article?.is_public ?? true);
  const [wordCount, setWordCount] = useState(() => {
    if (!article?.content) return 0;
    const text = article.content.replace(/<[^>]*>/g, ' ').trim();
    return text.split(/\s+/).filter(Boolean).length;
  });
  const [status, setStatus] = useState(isEdit ? 'saved' : 'draft');

  const savedState = useRef({
    title: article?.title ?? '',
    slug: article?.slug ?? '',
    isPublic: article?.is_public ?? true,
    contentText: '',
  });
  const currentContentText = useRef('');
  const hasContent = useRef(false);

  const [titleDirty, setTitleDirty] = useState(false);
  const [contentDirty, setContentDirty] = useState(false);
  const [visibilityDirty, setVisibilityDirty] = useState(false);

  const [modal, setModal] = useState(null);
  const [hint, setHint] = useState('');

  const isDirty = titleDirty || contentDirty || visibilityDirty;
  const { setGuard, clearGuard } = useNavigationGuard();
  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;
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
    setSlug('/articles/' + val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
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

  const confirmSave = () => {
    const data = {
      title,
      slug,
      is_public: isPublic,
      content: latestHtml.current,
    };

    if (isEdit) {
      updateArticle(article.id, data);
    } else {
      createArticle({ ...data, tags: [], project_id: null, project_name: null });
    }

    setStatus('saving...');
    savedState.current = {
      title,
      slug,
      isPublic,
      contentText: currentContentText.current,
    };
    setTimeout(() => {
      setStatus('saved');
      setTitleDirty(false);
      setContentDirty(false);
      setVisibilityDirty(false);
    }, 800);
    setModal(null);
  };

  const confirmDelete = () => {
    setModal(null);
    navigate('/user/articles');
  };

  const projectLabel = article?.project_name ? `~/${article.project_name}` : 'none (standalone)';

  return (
    <>
      <div className="comp-bar">
        <div className="comp-bar-left">
          <span className="dim" style={{ cursor: 'pointer' }} onClick={() => {
            if (isDirtyRef.current) { pendingNav.current = '/user/articles'; setModal('unsaved'); }
            else navigate('/user/articles');
          }}>← articles /</span>
          <span className="accent">{isEdit ? 'edit' : 'new'}</span>
          <span className={'badge ' + (status === 'new changes' ? 'badge-warn' : 'badge-draft')}>{status}</span>
        </div>
        <div className="comp-bar-right">
          <span className="dim">{wordCount} words · ~{Math.max(1, Math.round(wordCount / 200))} min read</span>
          <button className="btn-primary" disabled={!isDirty} onClick={handleSaveClick}>save</button>
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
              <div className="comp-select">
                <span className={article?.project_name ? '' : 'dim'}>{projectLabel}</span>
                <span className="dim">▾</span>
              </div>
              <span className="dim" style={{ fontSize: 11 }}>optional · articles can be standalone</span>
            </div>
            <div className="comp-field">
              <span className="comp-field-label">tags</span>
              <div className="comp-tags">
                {(article?.tags ?? []).map((t) => (
                  <span key={t} className="art-tag">{t}</span>
                ))}
                <span className="art-tag-add">+ add</span>
              </div>
            </div>
          </div>

          <div className="comp-panel">
            <div className="panel-head">// danger</div>
            <button className="btn-ghost comp-danger" onClick={() => setModal('delete')}>delete</button>
          </div>
        </aside>
      </div>

      {modal && createPortal(
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            {modal === 'save' && (
              <>
                <div className="modal-title">save changes</div>
                <p className="modal-body">are you sure you want to save your changes?</p>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => setModal(null)}>cancel</button>
                  <button className="btn-primary" onClick={confirmSave}>save</button>
                </div>
              </>
            )}
            {modal === 'unsaved' && (
              <>
                <div className="modal-title">unsaved changes</div>
                <p className="modal-body">you have unsaved changes that will be lost. are you sure you want to leave?</p>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={cancelLeave}>stay</button>
                  <button className="btn-ghost modal-btn-danger" onClick={confirmLeave}>leave</button>
                </div>
              </>
            )}
            {modal === 'delete' && (
              <>
                <div className="modal-title">confirm delete</div>
                <p className="modal-body">are you sure you want to delete this article? this action cannot be undone.</p>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => setModal(null)}>cancel</button>
                  <button className="btn-ghost modal-btn-danger" onClick={confirmDelete}>delete</button>
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
