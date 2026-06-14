import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { getDevlogsGroupedByProject, createDevlog } from '../data/devlogs';
import { getProjects } from '../data/projects';
import Editor from '../components/Editor';

const DEVLOG_PAGE_SIZE = 10;

export default function UserDevlogsPage() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('project');

  const [projects, setProjectsList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const opts = { createdBy: user?.id };
    Promise.all([
      getProjects(1, 100, opts),
      getDevlogsGroupedByProject(opts),
    ]).then(([projRes, groupsData]) => {
      setProjectsList(projRes.data);
      setGroups(groupsData);
      if (preselected) {
        const idx = groupsData.findIndex((gr) => gr.project_name === preselected);
        setFocusedIndex(idx >= 0 ? idx : 0);
        setSelectedProject(preselected);
      } else if (groupsData.length > 0) {
        setSelectedProject(groupsData[0].project_name);
      }
      setInitialLoading(false);
    }).catch((err) => {
      console.error('Failed to load devlogs:', err);
      setInitialLoading(false);
    });
  }, [preselected]);
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

  const filteredGroups = useMemo(() =>
    groups.filter((g) => g.project_name.toLowerCase().includes(projectFilter.toLowerCase())),
    [groups, projectFilter]
  );

  useEffect(() => {
    const name = filteredGroups[focusedIndex]?.project_name;
    if (name && !composing) setSelectedProject(name);
  }, [focusedIndex, filteredGroups, composing]);

  const currentGroup = groups.find((g) => g.project_name === selectedProject);
  const totalCount = groups.reduce((s, g) => s + g.entries.length, 0);

  const [visibleCount, setVisibleCount] = useState(DEVLOG_PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const entrySentinelRef = useRef(null);

  const allEntries = currentGroup?.entries ?? [];
  const visibleEntries = allEntries.slice(0, visibleCount);
  const hasMoreEntries = visibleCount < allEntries.length;

  useEffect(() => {
    setVisibleCount(DEVLOG_PAGE_SIZE);
  }, [selectedProject]);

  const loadMoreEntries = useCallback(() => {
    if (!hasMoreEntries || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((v) => Math.min(v + DEVLOG_PAGE_SIZE, allEntries.length));
      setLoadingMore(false);
    }, 400);
  }, [hasMoreEntries, loadingMore, allEntries.length]);

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
      const date = new Date(entry.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      if (!map[date]) map[date] = [];
      map[date].push(entry);
    }
    return Object.entries(map);
  }, [visibleEntries]);

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
      const savedProject = selectedProject;
      setComposeTitle('');
      composeHtml.current = '';
      setComposeKey((k) => k + 1);
      const newGroups = await getDevlogsGroupedByProject({ createdBy: user?.id });
      setGroups(newGroups);
      setVisibleCount(DEVLOG_PAGE_SIZE);
      const newIdx = newGroups.findIndex((g) => g.project_name === savedProject);
      if (newIdx >= 0) setFocusedIndex(newIdx);
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
        setFocusedIndex((i) => Math.min(i + 1, filteredGroups.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex((i) => Math.max(i - 1, 0));
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
      setFocusedIndex((i) => Math.min(i + 1, filteredGroups.length - 1));
      setCollapsedDates({});
      setExpandedEntry(null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
      setCollapsedDates({});
      setExpandedEntry(null);
    } else if (e.key === 'Enter' && !composing) {
      e.preventDefault();
      enterCompose();
    } else if (e.key === 'Escape' && composing) {
      e.preventDefault();
      exitCompose();
    }
  }, [filteredGroups.length, composing, enterCompose, exitCompose, handleSave]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    if (focusedIndex >= filteredGroups.length && filteredGroups.length > 0) {
      setFocusedIndex(filteredGroups.length - 1);
    }
  }, [filteredGroups.length, focusedIndex]);

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
          {!hasMoreEntries && allEntries.length > DEVLOG_PAGE_SIZE && (
            <div className="up-end dim">// all {allEntries.length} entries loaded</div>
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
              {filteredGroups.map((g, i) => (
                <div
                  key={g.project_name}
                  className={'dl-sidebar-item' + (i === focusedIndex ? ' active' : '')}
                  onClick={() => {
                    setFocusedIndex(i);
                    setCollapsedDates({});
                    setExpandedEntry(null);
                  }}
                >
                  <span className="dl-sidebar-name">~/{g.project_name}</span>
                  <span className="dl-sidebar-count">{g.entries.length}</span>
                </div>
              ))}
            </aside>
          ) : (
            <section className="dl-content dl-content-animate">
              <div className="dl-content-head">
                <span className="dl-content-title">~/{selectedProject}</span>
                <span className="dl-content-count">{currentGroup?.entries.length ?? 0} entries</span>
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
                <span className="dl-content-count">{currentGroup?.entries.length ?? 0} entries</span>
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
