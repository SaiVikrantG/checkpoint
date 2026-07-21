import { Routes, Route, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import ProjectsPage from './pages/ProjectsPage';
import AboutPage from './pages/AboutPage';
import ClickMePage from './pages/ClickMePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import RequireRole from './components/RequireRole';
import DevlogsPage from './pages/DevlogsPage';
import BoardPage from './pages/BoardPage';
import ArticleViewPage from './pages/ArticleViewPage';
import FinderModal from './components/FinderModal';
import RequireAuth from './components/RequireAuth';
import UserLayout from './components/UserLayout';
import UserDashboardPage from './pages/UserDashboardPage';
import UserArticlesPage from './pages/UserArticlesPage';
import UserProjectsPage from './pages/UserProjectsPage';
import UserDevlogsPage from './pages/UserDevlogsPage';
import UserStatsPage from './pages/UserStatsPage';
import UserNewArticlePage from './pages/UserNewArticlePage';
import UserArticleViewPage from './pages/UserArticleViewPage';
import UserNewDevlogPage from './pages/UserNewDevlogPage';
import AuthRedirect from './components/AuthRedirect';
import NotFoundPage from './pages/NotFoundPage';
import { getThemeSettings } from './data/settings';
import { useToast } from './context/ToastContext';

function applyTheme({ bg, fg, ac }) {
  document.documentElement.style.setProperty('--bg', bg);
  document.documentElement.style.setProperty('--bg-2', adjustBg(bg, 6));
  document.documentElement.style.setProperty('--bg-3', adjustBg(bg, -10));
  document.documentElement.style.setProperty('--fg', fg);
  document.documentElement.style.setProperty('--main', ac);
}

function adjustBg(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

export default function App() {
  const [finderOpen, setFinderOpen] = useState(false);
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    getThemeSettings()
      .then(applyTheme)
      .catch((err) => {
        console.error('Failed to load theme settings:', err);
        showToast(err.message);
      });
  }, [showToast]);

  // Finder is disabled on the public side for now, so the ⌘/ shortcut only
  // opens it while inside the user dashboard.
  const handleKeyDown = useCallback(
    (e) => {
      if (!location.pathname.startsWith('/user')) return;
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setFinderOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setFinderOpen(false);
      }
    },
    [location.pathname],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <Routes>
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/register/*" element={<RegisterPage />} />
        <Route path="/auth-redirect" element={<AuthRedirect />} />
        <Route element={<Layout onFinderOpen={() => setFinderOpen(true)} />}>
          <Route index element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleViewPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/clickme" element={<ClickMePage />} />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminPage />
              </RequireRole>
            }
          />
          <Route path="/devlogs" element={<DevlogsPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          element={
            <RequireAuth>
              <UserLayout onFinderOpen={() => setFinderOpen(true)} />
            </RequireAuth>
          }
        >
          <Route path="/user" element={<UserDashboardPage />} />
          <Route path="/user/articles" element={<UserArticlesPage />} />
          <Route path="/user/articles/new" element={<UserNewArticlePage />} />
          <Route path="/user/articles/:id/view" element={<UserArticleViewPage />} />
          <Route path="/user/articles/:id/edit" element={<UserNewArticlePage />} />
          <Route path="/user/projects" element={<UserProjectsPage />} />
          <Route path="/user/devlogs" element={<UserDevlogsPage />} />
          <Route path="/user/devlogs/new" element={<UserNewDevlogPage />} />
          <Route path="/user/devlogs/:id/edit" element={<UserNewDevlogPage />} />
          <Route path="/user/stats" element={<UserStatsPage />} />
        </Route>
      </Routes>
      {finderOpen && <FinderModal onClose={() => setFinderOpen(false)} />}
    </>
  );
}
