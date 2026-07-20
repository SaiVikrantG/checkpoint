import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { getArticleById, getArticleBySlug } from '../data/articles';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#3a3c40',
    primaryTextColor: '#d1d0c5',
    primaryBorderColor: '#e2b714',
    lineColor: '#646669',
    secondaryColor: '#2c2e31',
    tertiaryColor: '#25272a',
    fontFamily: 'Roboto Mono, monospace',
  },
});

function estimateReadMinutes(content) {
  const words = (content || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function ArticleViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const articleRef = useRef(null);
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevSlug, setPrevSlug] = useState(slug);

  if (slug !== prevSlug) {
    setPrevSlug(slug);
    setArticle(null);
    setLoading(true);
  }

  useEffect(() => {
    const fetcher = /^\d+$/.test(slug) ? getArticleById(slug) : getArticleBySlug(slug);
    fetcher
      .then((a) => {
        setArticle(a);
        setLoading(false);
      })
      .catch(() => {
        setArticle(null);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!article || !articleRef.current) return;
    const codeBlocks = articleRef.current.querySelectorAll('pre code.language-mermaid');
    codeBlocks.forEach((code, i) => {
      const pre = code.parentElement;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.id = `mermaid-public-${i}`;
      div.textContent = code.textContent;
      pre.replaceWith(div);
    });
    const nodes = articleRef.current.querySelectorAll('.mermaid');
    if (nodes.length > 0) mermaid.run({ nodes });
  }, [article]);

  if (loading) {
    return (
      <div className="av-empty">
        <span className="dim">loading...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-view">
        <div className="article-view-empty">
          <p>article not found</p>
          <button className="btn-ghost" onClick={() => navigate('/articles')}>
            ← back to articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-view">
      <div className="article-view-head">
        <button className="btn-ghost" onClick={() => navigate('/articles')}>
          ← articles
        </button>
        <span className="article-view-cat">{article.project_name || 'general'}</span>
      </div>
      <h1 className="article-view-title">{article.title}</h1>
      <div className="article-view-meta">
        <span>{new Date(article.created_at).toLocaleDateString()}</span>
        <span>·</span>
        <span>{estimateReadMinutes(article.content)} min read</span>
      </div>
      <article
        ref={articleRef}
        className="article-view-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
}
