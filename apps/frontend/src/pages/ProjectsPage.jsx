import { useState, useEffect } from 'react';
import { getProjects } from '../data/projects';
import { useToast } from '../context/ToastContext';

const filters = ['all', 'live', 'wip', 'archived'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const { showToast } = useToast();

  useEffect(() => {
    getProjects(1, 100)
      .then((res) => {
        setProjects(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
        showToast(err.message);
        setLoading(false);
      });
  }, [showToast]);

  const filtered =
    activeFilter === 'all' ? projects : projects.filter((p) => p.status === activeFilter);

  if (loading) {
    return (
      <div className="av-empty">
        <span className="dim">loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="proj-head">
        <h1 className="proj-h1">projects</h1>
        <div className="proj-sub">
          // {projects.length} repos ·{' '}
          {projects.filter((p) => p.status === 'live' || p.status === 'wip').length} currently in
          flight
        </div>
        <div className="proj-filters">
          {filters.map((f) => (
            <button
              key={f}
              className={'chip' + (f === activeFilter ? ' chip-active' : '')}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="proj-grid">
        {filtered.map((p) => (
          <div key={p.id} className="proj-card">
            <div className="proj-card-head">
              <span className={'proj-status proj-status-' + p.status}>● {p.status}</span>
              {p.url && (
                <a className="proj-repo" href={p.url} target="_blank" rel="noopener noreferrer">
                  <span className="proj-repo-icon">&#8599;</span>
                  <span>repo</span>
                </a>
              )}
            </div>
            <div className="proj-name">~/{p.name}</div>
            <div className="proj-blurb">{p.description}</div>
            <div className="proj-stack">
              {p.stack.map((s) => (
                <span key={s} className="proj-chip">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
