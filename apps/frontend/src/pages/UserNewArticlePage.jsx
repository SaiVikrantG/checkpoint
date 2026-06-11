import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '../components/Editor';

export default function UserNewArticlePage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [status, setStatus] = useState('draft');

  const handleUpdate = useCallback((data) => {
    const words = data.text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, []);

  const handleSave = () => {
    setStatus('saving...');
    setTimeout(() => setStatus('saved'), 800);
  };

  const handlePublish = () => {
    setStatus('published');
  };

  return (
    <>
      <div className="comp-bar">
        <div className="comp-bar-left">
          <span className="dim">articles /</span>
          <span className="accent">new</span>
          <span className="badge badge-draft">{status}</span>
        </div>
        <div className="comp-bar-right">
          <span className="dim">{wordCount} words · ~{Math.max(1, Math.round(wordCount / 200))} min read</span>
          <button className="btn-ghost" onClick={handleSave}>save draft</button>
          <button className="btn-primary" onClick={handlePublish}>publish →</button>
        </div>
      </div>

      <div className="comp-layout">
        <section className="comp-editor">
          <div className="comp-editor-header">
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
          </div>

          <Editor onUpdate={handleUpdate} />
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
            <div className="panel-head">// danger</div>
            <button className="btn-ghost comp-danger" onClick={() => navigate('/user/articles')}>discard</button>
          </div>
        </aside>
      </div>
    </>
  );
}
