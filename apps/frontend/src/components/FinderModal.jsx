import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const allResults = [
  { kind: 'page', name: 'Home', sub: '/', path: '/' },
  { kind: 'page', name: 'Articles', sub: '/articles', path: '/articles' },
  { kind: 'page', name: 'Projects', sub: '/projects', path: '/projects' },
  { kind: 'page', name: 'About', sub: '/about', path: '/about' },
  { kind: 'page', name: 'Devlogs', sub: '/devlogs', path: '/devlogs' },
  { kind: 'page', name: 'Admin', sub: '/admin', path: '/admin' },
  { kind: 'article', name: 'designing a notch header in css', sub: '/articles/notch-header', path: '/articles' },
  { kind: 'article', name: 'the case for plain markdown', sub: '/articles/plain-markdown', path: '/articles' },
  { kind: 'article', name: 'raymarching, but slowly', sub: '/articles/raymarching', path: '/articles' },
  { kind: 'project', name: 'checkpoint', sub: 'github.com/user/checkpoint', path: '/projects' },
  { kind: 'project', name: 'rust-rays', sub: 'github.com/user/rust-rays', path: '/projects' },
  { kind: 'devlog', name: '2026-06-04 · 15:22', sub: 'wired theme picker into css vars', path: '/devlogs' },
  { kind: 'devlog', name: '2026-06-04 · 11:08', sub: 'fuzzy finder modal opens on cmd+k', path: '/devlogs' },
  { kind: 'cmd', name: 'toggle theme', sub: 'admin · theme', path: '/admin', hot: '⌘T' },
  { kind: 'cmd', name: 'go to admin', sub: '/_admin', path: '/admin', hot: 'g a' },
];

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="finder-match">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function FinderModal({ onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const row = listRef.current?.children[selected];
    if (row) row.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const filtered = query
    ? allResults.filter(
        (r) =>
          r.name.toLowerCase().includes(query.toLowerCase()) ||
          r.sub.toLowerCase().includes(query.toLowerCase())
      )
    : allResults;

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && filtered[selected]) {
      navigate(filtered[selected].path);
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const sel = filtered[selected] || filtered[0];

  return (
    <div className="finder-overlay" onClick={onClose}>
      <div className="finder" onClick={(e) => e.stopPropagation()}>
        <div className="finder-head">
          <span className="finder-prompt">{'>'}</span>
          <input
            ref={inputRef}
            className="finder-input"
            placeholder="jump to..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
          />
          <span className="finder-pill">⌘K</span>
        </div>

        <div className="finder-body">
          <div className="finder-list" ref={listRef}>
            {filtered.map((r, i) => (
              <div
                key={i}
                className={'finder-row' + (i === selected ? ' selected' : '')}
                onMouseEnter={() => setSelected(i)}
                onClick={() => { navigate(r.path); onClose(); }}
              >
                <span className={'finder-kind finder-kind-' + r.kind}>{r.kind}</span>
                <span className="finder-name">{highlightMatch(r.name, query)}</span>
                <span className="finder-sub">{r.sub}</span>
                {r.hot && <span className="finder-hot">{r.hot}</span>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: 24, color: 'var(--sub)', textAlign: 'center', fontSize: 13 }}>
                no results for "{query}"
              </div>
            )}
          </div>

          <div className="finder-preview">
            {sel ? (
              <>
                <div className="finder-prev-head">// preview</div>
                <div className="finder-prev-title">{sel.name}</div>
                <div className="finder-prev-meta">
                  <span>{sel.kind}</span>
                  <span>·</span>
                  <span>{sel.sub}</span>
                </div>
                <div className="finder-prev-body">
                  <p>
                    Navigate to <span className="kbd-inline">{sel.path}</span> to view this {sel.kind}.
                  </p>
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="finder-foot">
          <span><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span><span className="kbd">↵</span> open</span>
          <span><span className="kbd">esc</span> close</span>
          <span className="finder-foot-right">{filtered.length} / {allResults.length} results</span>
        </div>
      </div>
    </div>
  );
}
