import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import { getDevlogs } from '../data/devlogs';
import { getProjects } from '../data/projects';

const rangeOptions = ['7d', '30d', 'all'];
const PAGE_SIZE = 20;

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

export default function DevlogsPage() {
  const [devlogs, setDevlogs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openProjects, setOpenProjects] = useState(new Set());
  const [activeRange, setActiveRange] = useState('30d');
  const [now, setNow] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [pageInfo, setPageInfo] = useState({ page: 1, totalPages: 1 });
  const [loadingMore, setLoadingMore] = useState(false);
  const readerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    Promise.all([getDevlogs(1, PAGE_SIZE), getProjects(1, 100)])
      .then(([devRes, projRes]) => {
        setDevlogs(devRes.data);
        setProjects(projRes.data);
        setPageInfo({ page: devRes.page, totalPages: devRes.totalPages });
        const projectIds = new Set(devRes.data.map((d) => d.project_id));
        setOpenProjects(projectIds);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load devlogs:', err);
        setLoading(false);
      });
  }, []);

  const hasMore = pageInfo.page < pageInfo.totalPages;

  const loadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    getDevlogs(pageInfo.page + 1, PAGE_SIZE)
      .then((res) => {
        setDevlogs((prev) => [...prev, ...res.data]);
        setPageInfo({ page: res.page, totalPages: res.totalPages });
        setOpenProjects((prev) => {
          const next = new Set(prev);
          res.data.forEach((d) => next.add(d.project_id));
          return next;
        });
      })
      .catch((err) => console.error('Failed to load more devlogs:', err))
      .finally(() => setLoadingMore(false));
  }, [hasMore, loadingMore, pageInfo.page]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: '150px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const projectNames = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);

  const selectedEntry = useMemo(
    () => devlogs.find((d) => d.id === selectedId) || null,
    [devlogs, selectedId],
  );

  useEffect(() => {
    if (!selectedEntry || !readerRef.current) return;
    const codeBlocks = readerRef.current.querySelectorAll('pre code.language-mermaid');
    codeBlocks.forEach((code, i) => {
      const pre = code.parentElement;
      const div = document.createElement('div');
      div.className = 'mermaid';
      div.id = `mermaid-devlog-${i}`;
      div.textContent = code.textContent;
      pre.replaceWith(div);
    });
    const nodes = readerRef.current.querySelectorAll('.mermaid');
    if (nodes.length > 0) mermaid.run({ nodes });
  }, [selectedEntry]);

  useEffect(() => {
    // Capturing the wall clock is an external read, not a pure derivation from
    // props/state — it belongs in an effect, not inline during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, [activeRange]);

  const filteredDevlogs = useMemo(() => {
    if (activeRange === 'all' || now == null) return devlogs;
    const days = activeRange === '7d' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return devlogs.filter((d) => new Date(d.created_at).getTime() >= cutoff);
  }, [devlogs, activeRange, now]);

  const treeData = useMemo(() => {
    const byProject = new Map();
    for (const d of filteredDevlogs) {
      if (!byProject.has(d.project_id)) byProject.set(d.project_id, []);
      byProject.get(d.project_id).push(d);
    }
    return [...byProject.entries()]
      .map(([projectId, entries]) => {
        const byDay = new Map();
        for (const e of entries) {
          const day = new Date(e.created_at).toISOString().slice(0, 10);
          if (!byDay.has(day)) byDay.set(day, []);
          byDay.get(day).push(e);
        }
        const days = [...byDay.entries()]
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .map(([day, dayEntries]) => ({
            day,
            entries: [...dayEntries]
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .map((e) => ({
                id: e.id,
                t: new Date(e.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }),
                msg: e.title,
              })),
          }));
        return { proj: projectNames.get(projectId) || 'unknown', projectId, days };
      })
      .sort((a, b) => a.proj.localeCompare(b.proj));
  }, [filteredDevlogs, projectNames]);

  const toggleProject = (projectId) => {
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const rows = [];
  treeData.forEach((p, pi) => {
    const isOpen = openProjects.has(p.projectId);
    const lastProj = pi === treeData.length - 1;
    const totalEntries = p.days.reduce((s, d) => s + d.entries.length, 0);

    rows.push({
      kind: 'proj',
      glyph: isOpen ? '▼' : '▶',
      text: '~/' + p.proj,
      count: totalEntries,
      projectId: p.projectId,
    });

    if (!isOpen) return;

    p.days.forEach((d, di) => {
      const lastDay = di === p.days.length - 1;
      const projGutter = lastProj ? '  ' : '│ ';
      const dayElbow = lastDay ? '└─' : '├─';
      rows.push({
        kind: 'day',
        prefix: projGutter + dayElbow + ' ',
        text: d.day,
        count: d.entries.length,
      });

      d.entries.forEach((e, ei) => {
        const lastEntry = ei === d.entries.length - 1;
        const dayGutter = lastDay ? '   ' : '│  ';
        const entryElbow = lastEntry ? '└─' : '├─';
        rows.push({
          kind: 'entry',
          prefix: projGutter + dayGutter + entryElbow + ' ',
          id: e.id,
          time: e.t,
          text: e.msg,
        });
      });
    });
    if (!lastProj) rows.push({ kind: 'spacer', prefix: '│' });
  });

  if (loading) {
    return (
      <div className="av-empty">
        <span className="dim">loading...</span>
      </div>
    );
  }

  return (
    <div className="dev-layout">
      <aside className="dev-rail">
        <div className="rail-eyebrow">// projects</div>
        <ul className="rail-list">
          {treeData.map((p) => (
            <li
              key={p.projectId}
              className={'rail-item' + (openProjects.has(p.projectId) ? ' active' : '')}
              onClick={() => toggleProject(p.projectId)}
            >
              <span className="rail-bullet">{openProjects.has(p.projectId) ? '▾' : '▸'}</span>
              <span className="rail-name">{p.proj}</span>
              <span className="rail-count">{p.days.reduce((s, d) => s + d.entries.length, 0)}</span>
            </li>
          ))}
        </ul>
        <div className="rail-eyebrow rail-eyebrow-2">// range</div>
        <div className="rail-sort">
          {rangeOptions.map((r) => (
            <button
              key={r}
              className={'chip' + (r === activeRange ? ' chip-active' : '')}
              onClick={() => setActiveRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </aside>

      <section className="dev-main">
        <div className="dev-head">
          <h1 className="dev-h1">devlogs</h1>
          <div className="dev-subhead">
            <span>
              // {filteredDevlogs.length} entries · {treeData.length} active projects
            </span>
          </div>
        </div>
        <div className="dev-content">
          <div className="dev-tree">
            {rows.map((r, i) => {
              if (r.kind === 'proj') {
                return (
                  <div
                    key={i}
                    className="tree-row tree-proj"
                    onClick={() => toggleProject(r.projectId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="tree-glyph">{r.glyph}</span>
                    <span className="tree-projname">{r.text}</span>
                    <span className="tree-count">{r.count} entries</span>
                  </div>
                );
              }
              if (r.kind === 'day') {
                return (
                  <div key={i} className="tree-row tree-day">
                    <span className="tree-pre">{r.prefix}</span>
                    <span className="tree-date">{r.text}</span>
                    <span className="tree-count">· {r.count}</span>
                  </div>
                );
              }
              if (r.kind === 'entry') {
                return (
                  <div
                    key={i}
                    className={
                      'tree-row tree-entry' + (r.id === selectedId ? ' tree-entry-selected' : '')
                    }
                    onClick={() => setSelectedId(r.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="tree-pre">{r.prefix}</span>
                    <span className="tree-time">{r.time}</span>
                    <span className="tree-msg">{r.text}</span>
                  </div>
                );
              }
              return (
                <div key={i} className="tree-row tree-spacer">
                  <span className="tree-pre">{r.prefix}</span>
                </div>
              );
            })}
            {hasMore && (
              <div className="up-sentinel" ref={sentinelRef}>
                {loadingMore && (
                  <div className="up-loader">
                    <span className="up-loader-dot" />
                    <span className="up-loader-dot" />
                    <span className="up-loader-dot" />
                  </div>
                )}
              </div>
            )}
            {!hasMore && devlogs.length > PAGE_SIZE && (
              <div className="up-end dim">// all {devlogs.length} entries loaded</div>
            )}
          </div>

          <div className="dev-reader">
            {selectedEntry ? (
              <>
                <div className="dev-reader-head">
                  <h2 className="dev-reader-title">{selectedEntry.title}</h2>
                  <div className="dev-reader-meta">
                    <span className="ut-proj-chip">
                      ~/{projectNames.get(selectedEntry.project_id) || 'unknown'}
                    </span>
                    <span className="dim">·</span>
                    <span className="dim">
                      {new Date(selectedEntry.created_at).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
                <div
                  ref={readerRef}
                  className="editor-content"
                  dangerouslySetInnerHTML={{ __html: selectedEntry.content }}
                />
              </>
            ) : (
              <div className="dev-reader-empty">
                <span className="dim">select an entry to read</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
