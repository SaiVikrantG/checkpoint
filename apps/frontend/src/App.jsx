import { Routes, Route } from 'react-router-dom';
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
import DevlogsPage from './pages/DevlogsPage';
import BoardPage from './pages/BoardPage';
import ArticleViewPage from './pages/ArticleViewPage';
import { lazy, Suspense } from 'react';
const EditorPage = lazy(() => import('./pages/EditorPage'));
import FinderModal from './components/FinderModal';

function applyStoredTheme() {
  try {
    const saved = localStorage.getItem('checkpoint-theme');
    if (saved) {
      const { bg, fg, ac } = JSON.parse(saved);
      document.documentElement.style.setProperty('--bg', bg);
      document.documentElement.style.setProperty('--bg-2', adjustBg(bg, 6));
      document.documentElement.style.setProperty('--bg-3', adjustBg(bg, -10));
      document.documentElement.style.setProperty('--fg', fg);
      document.documentElement.style.setProperty('--main', ac);
    }
  } catch {}
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

  useEffect(() => {
    applyStoredTheme();
  }, []);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      setFinderOpen((prev) => !prev);
    }
    if (e.key === 'Escape') {
      setFinderOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <Routes>
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/register/*" element={<RegisterPage />} />
        <Route element={<Layout onFinderOpen={() => setFinderOpen(true)} />}>
          <Route index element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:slug" element={<ArticleViewPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/clickme" element={<ClickMePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/devlogs" element={<DevlogsPage />} />
          <Route path="/board" element={<BoardPage />} />
          <Route path="/editor/new" element={<Suspense fallback={null}><EditorPage /></Suspense>} />
          <Route path="/editor/:id" element={<Suspense fallback={null}><EditorPage /></Suspense>} />
        </Route>
      </Routes>
      {finderOpen && <FinderModal onClose={() => setFinderOpen(false)} />}
    </>
  );
}
