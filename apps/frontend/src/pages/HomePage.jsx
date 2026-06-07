import { useNavigate } from 'react-router-dom';

const tiles = [
  { id: '01', title: 'articles', sub: 'long-form writing, notes, essays', meta: '24 posts', path: '/articles' },
  { id: '02', title: 'projects', sub: 'things i\'ve built · open source', meta: '12 repos', path: '/projects' },
  { id: '03', title: 'about_me', sub: 'who i am, what i care about', meta: '', path: '/about' },
  { id: '04', title: 'click_me!', sub: '[ work_in_progress ]', meta: '??', path: '/clickme', wip: true },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="home-hero">
        <div className="home-eyebrow">~/checkpoint — git:(main)</div>
        <div className="home-title">
          <span className="home-cursor">&#9612;</span>checkpoint
        </div>
        <div className="home-sub">
          a devlog & writing space by <span className="accent">@user</span>. type{' '}
          <span className="kbd">⌘K</span> to jump anywhere.
        </div>
      </div>

      <div className="home-grid">
        {tiles.map((t) => (
          <div
            key={t.id}
            className={'home-tile' + (t.wip ? ' home-tile-wip' : '')}
            onClick={() => navigate(t.path)}
          >
            <div className="home-tile-top">
              <span className="home-tile-id">{t.id}</span>
              <span className="home-tile-arrow">&#8599;</span>
            </div>
            <div className="home-tile-title">{t.title}</div>
            <div className="home-tile-sub">{t.sub}</div>
            <div className="home-tile-meta">{t.meta}</div>
          </div>
        ))}
      </div>

      <div className="home-foothint">
        <span>// press </span>
        <span className="kbd">⌘</span>
        <span className="kbd">K</span>
        <span> to open the finder · </span>
        <span className="kbd">esc</span>
        <span> to close anything</span>
      </div>
    </>
  );
}
