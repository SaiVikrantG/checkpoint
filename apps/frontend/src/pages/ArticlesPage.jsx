import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getArticles } from '../data/articles';

const sorts = ['newest', 'oldest', 'read time'];

function estimateReadMinutes(content) {
  const words = (content || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function ArticlesPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState('all');
  const [activeSort, setActiveSort] = useState('newest');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getArticles(1, 100)
      .then((res) => {
        setArticles(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load articles:', err);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const counts = new Map();
    for (const a of articles) {
      const cat = a.project_name || 'general';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return [
      { name: 'all', count: articles.length },
      ...[...counts.entries()].map(([name, count]) => ({ name, count })),
    ];
  }, [articles]);

  let filtered =
    activeCat === 'all'
      ? articles
      : articles.filter((a) => (a.project_name || 'general') === activeCat);

  if (search) {
    filtered = filtered.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));
  }

  if (activeSort === 'oldest') {
    filtered = [...filtered].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (activeSort === 'read time') {
    filtered = [...filtered].sort(
      (a, b) => estimateReadMinutes(a.content) - estimateReadMinutes(b.content),
    );
  } else {
    filtered = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  if (loading) {
    return (
      <div className="av-empty">
        <span className="dim">loading...</span>
      </div>
    );
  }

  return (
    <div className="art-layout">
      <aside className="art-rail">
        <div className="rail-eyebrow">// category</div>
        <ul className="rail-list">
          {categories.map((c) => (
            <li
              key={c.name}
              className={'rail-item' + (c.name === activeCat ? ' active' : '')}
              onClick={() => setActiveCat(c.name)}
            >
              <span className="rail-bullet">{c.name === activeCat ? '▸' : '·'}</span>
              <span className="rail-name">{c.name}</span>
              <span className="rail-count">{c.count}</span>
            </li>
          ))}
        </ul>
        <div className="rail-eyebrow rail-eyebrow-2">// sort</div>
        <div className="rail-sort">
          {sorts.map((s) => (
            <button
              key={s}
              className={'chip' + (s === activeSort ? ' chip-active' : '')}
              onClick={() => setActiveSort(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </aside>

      <section className="art-main">
        <div className="art-head">
          <h1 className="art-h1">articles</h1>
          <div className="art-search">
            <span className="kbd">/</span>
            <input
              className="art-search-input"
              placeholder="filter by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <span className="art-search-count">{filtered.length} results</span>
          </div>
        </div>

        <ul className="art-list">
          {filtered.map((a) => (
            <li
              key={a.id}
              className="art-row"
              onClick={() => navigate(`/articles/${a.slug || a.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <span className="art-date">{new Date(a.created_at).toLocaleDateString()}</span>
              <span className="art-title">{a.title}</span>
              <span className="art-tags">
                {a.tags.map((t) => (
                  <span key={t} className="art-tag">
                    #{t}
                  </span>
                ))}
              </span>
              <span className="art-read">{estimateReadMinutes(a.content)} min</span>
              <span className="art-arrow">&rarr;</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
