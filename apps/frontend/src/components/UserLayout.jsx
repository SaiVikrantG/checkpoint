import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { useNavigationGuard } from '../context/NavigationGuardContext';

const nav = [
  { id: 'dashboard', icon: '◐', name: 'dashboard', path: '/user', sub: 'overview' },
  { id: 'articles', icon: '≡', name: 'articles', path: '/user/articles', sub: '' },
  { id: 'devlogs', icon: '⌥', name: 'devlogs', path: '/user/devlogs', sub: '' },
  { id: 'projects', icon: '▣', name: 'projects', path: '/user/projects', sub: '' },
  { id: 'stats', icon: '▤', name: 'statistics', path: '/user/stats', sub: '' },
];


export default function UserLayout({ onFinderOpen }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const { checkGuard } = useNavigationGuard();

  const currentNav = nav.find((n) =>
    n.path === '/user'
      ? location.pathname === '/user'
      : location.pathname.startsWith(n.path)
  ) || nav[0];

  const guardedNavigate = (to) => {
    if (checkGuard(to)) navigate(to);
  };

  return (
    <div className="user-page">
      <aside className="user-side">
        <div className="user-brand">
          <span className="accent">▌</span>checkpoint
          <span className="user-brand-tag">user</span>
        </div>

        <div className="user-card">
          <div className="user-card-avatar">
            {user?.firstName?.[0] || '@'}
          </div>
          <div className="user-card-meta">
            <div className="user-card-name">@{user?.username || user?.firstName || 'user'}</div>
            <div className="user-card-role dim">{user?.publicMetadata?.role || 'member'}</div>
          </div>
        </div>

        <div className="user-side-eyebrow">// workspace</div>
        <ul className="user-nav">
          {nav.map((n) => {
            const isActive = n.path === '/user'
              ? location.pathname === '/user'
              : location.pathname.startsWith(n.path);
            return (
              <li key={n.id}>
                <div
                  className={'user-nav-item' + (isActive ? ' active' : '')}
                  onClick={() => guardedNavigate(n.path)}
                >
                  <span className="user-nav-icon">{n.icon}</span>
                  <span className="user-nav-name">{n.name}</span>
                  {n.sub && <span className="user-nav-sub">{n.sub}</span>}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="user-side-foot">
          <div className="user-side-item dim" onClick={() => guardedNavigate('/')}>
            <span className="user-nav-icon">↗</span> view site
          </div>
          <div className="user-side-item user-logout" onClick={() => signOut(() => navigate('/'))}>
            <span className="user-nav-icon">⏻</span> logout
          </div>
        </div>
      </aside>

      <main className="user-main">
        <div className="user-topbar">
          <div className="user-crumbs">
            <span className="dim">~/</span>
            <span className="dim">checkpoint</span>
            <span className="dim"> / </span>
            <span>{currentNav.id}</span>
          </div>
          <div className="user-topbar-right">
            <div className="user-search" onClick={onFinderOpen}>
              <span className="dim">⌘/</span>
              <span className="dim">jump to...</span>
            </div>
          </div>
        </div>

        <div className="user-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
