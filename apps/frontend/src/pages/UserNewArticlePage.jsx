import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserNewArticlePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  return (
    <>
      <div className="comp-bar">
        <div className="comp-bar-left">
          <span className="dim">articles /</span>
          <span className="accent">new</span>
          <span className="badge badge-draft">draft</span>
          <span className="dim">· unsaved</span>
        </div>
        <div className="comp-bar-right">
          <button className="btn-ghost">preview</button>
          <button className="btn-ghost">save draft</button>
          <button className="btn-primary">publish →</button>
        </div>
      </div>

      <div className="comp-layout">
        <section className="comp-editor">
          <input
            className="comp-title"
            placeholder="article title..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSlug('/articles/' + e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
            }}
          />
          <input
            className="comp-slug"
            placeholder="/articles/your-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />

          <div className="comp-toolbar">
            <span>B</span><span>I</span><span>‹›</span><span>≡</span><span>{`{ }`}</span><span>—</span>
            <span className="comp-toolbar-sep">|</span>
            <span className="dim">markdown</span>
          </div>

          <div className="comp-body">
            <div className="comp-line" style={{ color: 'var(--sub)' }}>start writing here...</div>
            <div className="comp-line" />
            <div className="comp-line"><span className="comp-cursor">▌</span></div>
          </div>

          <div className="comp-foot dim">
            <span>0 words</span>
            <span>·</span>
            <span>~ 0 min read</span>
            <span>·</span>
            <span>line 1, col 0</span>
          </div>
        </section>

        <aside className="comp-side">
          <div className="comp-panel">
            <div className="panel-head">// publish</div>
            <div className="comp-field">
              <span className="comp-field-label">visibility</span>
              <div className="comp-field-row">
                <span
                  className={'toggle' + (isPublic ? ' toggle-on' : '')}
                  onClick={() => setIsPublic(!isPublic)}
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
                <span className="dim">none (standalone)</span>
                <span className="dim">▾</span>
              </div>
              <span className="dim" style={{ fontSize: 11 }}>optional · articles can be standalone</span>
            </div>
            <div className="comp-field">
              <span className="comp-field-label">tags</span>
              <div className="comp-tags">
                <span className="art-tag-add">+ add</span>
              </div>
            </div>
          </div>

          <div className="comp-panel">
            <div className="panel-head">// schedule</div>
            <div className="comp-field-row">
              <span className="dim">publish at</span>
              <span className="hex-input">now</span>
            </div>
          </div>

          <div className="comp-panel">
            <div className="panel-head">// danger</div>
            <button className="btn-ghost comp-danger" onClick={() => navigate('/user/articles')}>discard</button>
          </div>
        </aside>
      </div>
    </>
  );
}
