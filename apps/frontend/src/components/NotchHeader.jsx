import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const allNavItems = [
  { label: 'Home', path: '/' },
  { label: 'Articles', path: '/articles' },
  { label: 'Projects', path: '/projects' },
  { label: 'Devlogs', path: '/devlogs' },
  { label: 'Board', path: '/board' },
  { label: 'About', path: '/about' },
];

// `onFinderOpen` is unused while the finder is disabled on the public side (see below).
// eslint-disable-next-line no-unused-vars
export default function NotchHeader({ onFinderOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [time, setTime] = useState('');
  const itemsRef = useRef(null);
  const itemRefs = useRef({});
  const [indicatorStyle, setIndicatorStyle] = useState({});

  const navItems = allNavItems;

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now
          .toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })
          .toLowerCase(),
      );
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const activeEl = itemRefs.current[location.pathname];
    const containerEl = itemsRef.current;
    if (activeEl && containerEl) {
      const containerRect = containerEl.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: itemRect.left - containerRect.left,
        width: itemRect.width,
      });
    }
  }, [location.pathname]);

  return (
    <div className="notch-wrap">
      <div className="notch">
        <span className="notch-time">{time}</span>
        <div className="notch-items" ref={itemsRef}>
          {indicatorStyle.width > 0 && (
            <span
              className="notch-indicator"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
              }}
            />
          )}
          {navItems.map((item) => (
            <span
              key={item.path}
              ref={(el) => {
                itemRefs.current[item.path] = el;
              }}
              className={'notch-item' + (location.pathname === item.path ? ' active' : '')}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </span>
          ))}
        </div>
        {/* Finder disabled on the public side for now.
        <span className="notch-sep" />
        <span className="notch-kbd" onClick={onFinderOpen}>
          {'⌘/ · Ctrl/'}
        </span>
        <span className="notch-search" onClick={onFinderOpen}>
          &#8981;
        </span>
        */}
      </div>
    </div>
  );
}
