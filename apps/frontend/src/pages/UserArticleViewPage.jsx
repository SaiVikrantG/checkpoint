import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getArticleById } from '../data/articles';

export default function UserArticleViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArticleById(Number(id)).then((data) => {
      setArticle(data);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load article:', err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="av-empty"><span className="dim">loading...</span></div>;
  }

  if (!article) {
    return (
      <div className="av-empty">
        <span className="dim">article not found</span>
        <button className="btn-ghost" onClick={() => navigate('/user/articles')}>← back to articles</button>
      </div>
    );
  }

  return (
    <>
      <div className="comp-bar">
        <div className="comp-bar-left">
          <span className="dim" style={{ cursor: 'pointer' }} onClick={() => navigate('/user/articles')}>← articles /</span>
          <span className="accent">{article.title}</span>
          <span className={'badge ' + (article.is_public ? 'badge-draft' : 'badge-warn')}>
            {article.is_public ? 'public' : 'private'}
          </span>
        </div>
        <div className="comp-bar-right">
          <span className="dim">
            {article.views.toLocaleString()} views · ~{Math.max(1, Math.round(article.content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length / 200))} min read
          </span>
          <button className="btn-primary" onClick={() => navigate(`/user/articles/${article.id}/edit`)}>edit</button>
        </div>
      </div>

      <div className="av-layout">
        <article className="av-body">
          <h1 className="av-title">{article.title}</h1>
          <div className="av-meta">
            <span className="dim">{new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            {article.project_name && <><span className="dim">·</span><span className="ut-proj-chip">~/{article.project_name}</span></>}
          </div>
          {article.tags?.length > 0 && (
            <div className="av-tags">
              {article.tags.map((t) => <span key={t} className="art-tag">{t}</span>)}
            </div>
          )}
          <div className="editor-content" dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        <aside className="av-side">
          <div className="comp-panel">
            <div className="panel-head">// info</div>
            <div className="comp-field">
              <span className="comp-field-label">created</span>
              <span className="dim">{new Date(article.created_at).toLocaleDateString()}</span>
            </div>
            {article.updated_at !== article.created_at && (
              <div className="comp-field">
                <span className="comp-field-label">updated</span>
                <span className="dim">{new Date(article.updated_at).toLocaleDateString()}</span>
              </div>
            )}
            <div className="comp-field">
              <span className="comp-field-label">views</span>
              <span className="dim">{article.views.toLocaleString()}</span>
            </div>
            <div className="comp-field">
              <span className="comp-field-label">visibility</span>
              <span className="dim">{article.is_public ? 'public' : 'private'}</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
