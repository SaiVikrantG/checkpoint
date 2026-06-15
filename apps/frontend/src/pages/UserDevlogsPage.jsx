import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { getDevlogsByProject, createDevlog } from '../data/devlogs';
import { getProjects } from '../data/projects';
import Editor from '../components/Editor';

const DEVLOG_PAGE_SIZE = 10;

export default function UserDevlogsPage() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('project');

  const [projects, setProjectsList] = useState([]);
  const [entries, setEntries] = useState([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const devlogCache = useRef(new Map());

  useEffect(() => {
    getProjects(1, 100, { createdBy: user?.id }).then((projRes) => {
      setProjectsList(projRes.data);
      if (preselected) {
        const idx = projRes.data.findIndex((p) => p.name === preselected);
        setFocusedIndex(idx >= 0 ? idx : 0);
        setSelectedProject(preselected);
      } else if (projRes.data.length > 0) {
        setSelectedProject(projRes.data[0].name);
      }
      setInitialLoading(false);
    }).catch((err) => {
      console.error('Failed to load projects:', err);
      setInitialLoading(false);
    });
  }, [preselected]);

  const selectedProjectObj = projects.find((p) => p.name === selectedProject);

  useEffect(() => {
    if (!selectedProjectObj) return;
    const projectId = selectedProjectObj.id;
    if (devlogCache.current.has(projectId)) {
      setEntries(devlogCache.current.get(projectId));
      return;
    }
    setEntriesLoading(true);
    getDevlogsByProject(projectId, 1, 100).then((res) => {
      devlogCache.current.set(projectId, res.data);
      setEntries(res.data);
    }).catch(() => setEntries([])).finally(() => setEntriesLoading(false));
  }, [selectedProjectObj?.id]);
  const [composing, setComposing] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState({});
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const [composeTitle, setComposeTitle] = useState('');
  const [composeKey, setComposeKey] = useState(0);
  const composeHtml = useRef('');
  const titleRef = useRef(null);
  const searchRef = useRef(null);
  const sidebarRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const filteredProjects = useMemo(() =>
    projects.filter((p) => p.name.toLowerCase().includes(projectFilter.toLowerCase())),
    [projects, projectFilter]
  );

  const totalCount = entries.length;

  const [visibleCount, setVisibleCount] = useState(DEVLOG_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const entrySentinelRef = useRef(null);

  const visibleEntries = entries.slice(0, visibleCount);
  const hasMoreEntries = visibleCount < entries.length;

  useEffect(() => {
    setVisibleCount(DEVLOG_PAGE_SIZE);
  }, [selectedProject]);

  const loadMoreEntries = useCallback(() => {
    if (!hasMoreEntries || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((v) => Math.min(v + DEVLOG_PAGE_SIZE, entries.length));
      setLoadingMore(false);
    }, 400);
  }, [hasMoreEntries, loadingMore, entries.length]);

  useEffect(() => {
    const el = entrySentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMoreEntries(); },
      { rootMargin: '100px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMoreEntries]);

  const dateGroups = useMemo(() => {
    const map = {};
    for (const entry of visibleEntries) {
      const date = new Date(entry.created_at).toLocaleDateString('en-IN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      if (!map[date]) map[date] = [];
      map[date].push(entry);
    }
    return Object.entries(map);
  }, [visibleEntries]);

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const enterCompose = useCallback(() => {
    if (!selectedProject) return;
    setComposing(true);
    setCollapsedDates({});
    setExpandedEntry(null);
    setTimeout(() => titleRef.current?.focus(), 80);
  }, [selectedProject]);

  const exitCompose = useCallback(() => {
    setComposing(false);
    setComposeTitle('');
    composeHtml.current = '';
    setComposeKey((k) => k + 1);
  }, []);

  const handleEditorUpdate = useCallback((data) => {
    composeHtml.current = data.html;
  }, []);

  const handleSave = useCallback(async () => {
    if (!composeTitle.trim() || !selectedProject) return;
    const proj = projects.find((p) => p.name === selectedProject);
    setSaving(true);
    try {
      await createDevlog({
        title: composeTitle.trim(),
        content: composeHtml.current,
        project_id: proj?.id ?? null,
        is_public: true,
      });
      setComposeTitle('');
      composeHtml.current = '';
      setComposeKey((k) => k + 1);
      devlogCache.current.delete(proj?.id);
      const res = await getDevlogsByProject(proj.id, 1, 100);
      devlogCache.current.set(proj.id, res.data);
      setEntries(res.data);
      setVisibleCount(DEVLOG_PAGE_SIZE);
      titleRef.current?.focus();
    } catch (err) {
      console.error('Failed to save devlog:', err);
    }
    setSaving(false);
  }, [composeTitle, selectedProject, projects]);

  const handleGlobalKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' && e.target === searchRef.current) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setProjectFilter('');
        searchRef.current.blur();
        setSearchFocused(false);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.min(i + 1, filteredProjects.length - 1);
          setSelectedProject(filteredProjects[next]?.name);
          return next;
        });
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = Math.max(i - 1, 0);
          setSelectedProject(filteredProjects[next]?.name);
          return next;
        });
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        searchRef.current.blur();
        setSearchFocused(false);
        enterCompose();
        return;
      }
      return;
    }

    if (e.target.closest('.dl-compose')) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        exitCompose();
        return;
      }
      return;
    }

    if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      searchRef.current?.focus();
      setSearchFocused(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => {
        const next = Math.min(i + 1, filteredProjects.length - 1);
        setSelectedProject(filteredProjects[next]?.name);
        return next;
      });
      setCollapsedDates({});
      setExpandedEntry(null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => {
        const next = Math.max(i - 1, 0);
        setSelectedProject(filteredProjects[next]?.name);
        return next;
      });
      setCollapsedDates({});
      setExpandedEntry(null);
    } else if (e.key === 'Enter' && !composing) {
      e.preventDefault();
      enterCompose();
    } else if (e.key === 'Escape' && composing) {
      e.preventDefault();
      exitCompose();
    }
  }, [filteredProjects.length, composing, enterCompose, exitCompose, handleSave]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    if (focusedIndex >= filteredProjects.length && filteredProjects.length > 0) {
      setFocusedIndex(filteredProjects.length - 1);
    }
  }, [filteredProjects.length, focusedIndex]);

  useEffect(() => {
    const item = sidebarRef.current?.querySelector('.dl-sidebar-item.active');
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [focusedIndex]);

  const toggleDate = (date) => {
    setCollapsedDates((prev) => ({ ...prev, [date]: !prev[date] }));
  };

  const toggleEntry = (id) => {
    setExpandedEntry((prev) => (prev === id ? null : id));
  };

  const renderTree = () => (
    <div className="dl-tree">
      {dateGroups.length > 0 ? (
        <>
          <div className="dl-tree-root">
            <span className="dl-tree-icon">▾</span>
            <span className="dl-tree-root-name">~/{selectedProject}</span>
          </div>
          {dateGroups.map(([date, entries], di) => {
            const isLastDate = di === dateGroups.length - 1 && !hasMoreEntries;
            const isCollapsed = collapsedDates[date];
            return (
              <div key={date} className="dl-tree-branch">
                <div className="dl-tree-date" onClick={() => toggleDate(date)}>
                  <span className="dl-tree-connector">{isLastDate ? '└── ' : '├── '}</span>
                  <span className="dl-tree-icon">{isCollapsed ? '▸' : '▾'}</span>
                  <span className="dl-tree-date-name">{date}</span>
                  <span className="dl-tree-date-count">({entries.length})</span>
                </div>
                {!isCollapsed && (
                  <div className={'dl-tree-entries' + (isLastDate ? ' dl-tree-entries-last' : '')}>
                    {entries.map((e, ei) => {
                      const isLastEntry = ei === entries.length - 1;
                      const isExpanded = expandedEntry === e.id;
                      return (
                        <div key={e.id} className="dl-tree-entry-wrap">
                          <div className="dl-tree-entry" onClick={() => toggleEntry(e.id)}>
                            <span className="dl-tree-connector">{isLastEntry ? '└── ' : '├── '}</span>
                            <span className="dl-tree-time">{formatTime(e.created_at)}</span>
                            <span className="dl-tree-msg">{e.title}</span>
                          </div>
                          {isExpanded && (
                            <div className={'dl-tree-detail' + (isLastEntry ? ' dl-tree-detail-last' : '')}>
                              <div className="dl-tree-detail-content editor-content" dangerouslySetInnerHTML={{ __html: e.content }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {hasMoreEntries && (
            <div className="up-sentinel" ref={entrySentinelRef}>
              {loadingMore && <div className="up-loader"><span className="up-loader-dot" /><span className="up-loader-dot" /><span className="up-loader-dot" /></div>}
            </div>
          )}
          {!hasMoreEntries && entries.length > DEVLOG_PAGE_SIZE && (
            <div className="up-end dim">// all {entries.length} entries loaded</div>
          )}
        </>
      ) : (
        <div className="dl-empty">
          <span className="dim">no entries yet{composing ? ' — start typing' : ' — press ↵ to compose'}</span>
        </div>
      )}
    </div>
  );

  if (initialLoading) {
    return <div className="av-empty"><span className="dim">loading...</span></div>;
  }

  return (
    <>
      <div className="user-head">
        <div>
          <h1 className="user-h1">devlogs</h1>
          <div className="user-sub">
            // {totalCount} total · <span className="dim">/ search · ↑↓ navigate · ↵ compose · esc back</span>
          </div>
        </div>
      </div>

      <div className={'dl-layout' + (composing ? ' dl-layout-composing' : '')}>
        {/* Panel 1: projects list OR tree (when composing) */}
        <div className="dl-panel-left">
          {!composing ? (
            <aside className="dl-sidebar dl-sidebar-animate" ref={sidebarRef}>
              <div className="dl-sidebar-head">
                // projects
                {searchFocused && <span className="dl-sidebar-hint">esc to close</span>}
              </div>
              <div className="dl-sidebar-search">
                <input
                  ref={searchRef}
                  className="dl-sidebar-input"
                  placeholder="/ to search..."
                  value={projectFilter}
                  onChange={(e) => { setProjectFilter(e.target.value); setFocusedIndex(0); }}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
              </div>
              {filteredProjects.map((p, i) => (
                <div
                  key={p.id}
                  className={'dl-sidebar-item' + (i === focusedIndex ? ' active' : '')}
                  onClick={() => {
                    setFocusedIndex(i);
                    setSelectedProject(p.name);
                    setCollapsedDates({});
                    setExpandedEntry(null);
                  }}
                >
                  <span className="dl-sidebar-name">~/{p.name}</span>
                  <span className="dl-sidebar-count">{p.devlogs_count}</span>
                </div>
              ))}
            </aside>
          ) : (
            <section className="dl-content dl-content-animate">
              <div className="dl-content-head">
                <span className="dl-content-title">~/{selectedProject}</span>
                <span className="dl-content-count">{entries.length} entries</span>
              </div>
              {renderTree()}
            </section>
          )}
        </div>

        {/* Panel 2: tree (browse) OR editor (compose) */}
        <div className="dl-panel-right">
          {!composing ? (
            <section className="dl-content dl-content-animate">
              <div className="dl-content-head">
                <span className="dl-content-title">~/{selectedProject}</span>
                <span className="dl-content-count">{entries.length} entries</span>
                <button className="btn-sm btn-ghost dl-compose-enter" onClick={enterCompose}>↵ compose</button>
              </div>
              {renderTree()}
            </section>
          ) : (
            <section className="dl-compose dl-compose-animate">
              <div className="dl-compose-head">
                <span className="accent">+</span>
                <span>new entry</span>
                <span className="dim">· ~/{selectedProject}</span>
                <span className="dl-compose-esc dim" onClick={exitCompose}>esc</span>
              </div>
              <input
                ref={titleRef}
                className="dl-compose-title"
                placeholder="what'd you do?"
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
              />
              <div className="dl-compose-editor">
                <Editor key={composeKey} content="" onUpdate={handleEditorUpdate} />
              </div>
              <div className="dl-compose-foot">
                <span className="dim">⌘↵ save · esc back</span>
                <button
                  className="btn-primary btn-sm"
                  disabled={!composeTitle.trim() || saving}
                  onClick={handleSave}
                >
                  {saving ? 'saved ✓' : 'save'}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
