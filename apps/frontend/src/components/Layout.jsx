import { Outlet } from 'react-router-dom';
import NotchHeader from './NotchHeader';
import Footer from './Footer';

export default function Layout({ onFinderOpen }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NotchHeader onFinderOpen={onFinderOpen} />
      <div className="page-body">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
