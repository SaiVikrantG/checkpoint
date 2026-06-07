import { Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import ProjectsPage from './pages/ProjectsPage';
import AboutPage from './pages/AboutPage';
import ClickMePage from './pages/ClickMePage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import DevlogsPage from './pages/DevlogsPage';
import FinderModal from './components/FinderModal';

export default function App() {
  const [finderOpen, setFinderOpen] = useState(false);

  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
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
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout onFinderOpen={() => setFinderOpen(true)} />}>
          <Route index element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/clickme" element={<ClickMePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/devlogs" element={<DevlogsPage />} />
        </Route>
      </Routes>
      {finderOpen && <FinderModal onClose={() => setFinderOpen(false)} />}
    </>
  );
}
