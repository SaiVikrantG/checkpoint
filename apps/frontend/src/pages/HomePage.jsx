import { useNavigate } from 'react-router-dom';

const tiles = [
  {
    id: '01',
    title: 'articles',
    sub: 'long-form writing, notes, essays',
    meta: '24 posts',
    path: '/articles',
  },
  {
    id: '02',
    title: 'projects',
    sub: "things i've built · open source",
    meta: '12 repos',
    path: '/projects',
  },
  {
    id: '03',
    title: 'idea_board',
    sub: 'project ideas · knowledge graph',
    meta: '',
    path: '/board',
  },
  { id: '04', title: 'about_me', sub: 'who i am, what i care about', meta: '', path: '/about' },
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
          a devlog & writing space by{' '}
          <span className="accent" onClick={() => navigate('/about')} style={{ cursor: 'pointer' }}>
            @Vikrant
          </span>
          . type <span className="kbd">⌘/</span> to jump anywhere.
        </div>
      </div>

      <div className="home-split">
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

        <div className="home-story">
          <div className="home-story-label">// why_checkpoint</div>
          <p>
            Remember the scene in <em>the social network</em>, where Jesse Eisenberg was creating
            face mash while also simultaneously blogging about it, narrating his own work as he
            built it and sounding totally cool while doing so?
          </p>
          <p>
            Well, the original intention of <span className="accent">checkpoint</span> was just
            that. A place where I log about my work as I keep going.
          </p>
          <p>
            These logs aren't meant to be perfect. It's a place for the patient reader to see how
            ideas change, to see the mistakes being made, the cool moment of realisations and
            probably an insane amount of self talk. Everything public before you see the clean
            final piece. Since you can't change what happened yesterday and you only go ahead with
            the consequences of them, even this is an{' '}
            <span className="kbd-inline">append only log</span>.
          </p>
          <p>
            Which I've come to like, actually &mdash; it means whatever I got wrong yesterday just
            becomes part of the record, not something to go back and hide. Everything seems to be
            about chasing perfection these days, and I think I want this place to be proof that not
            everything needs to be, and that good things take time :)
          </p>
          <p>
            I started out with that inspiration and while building this, my own ideas themselves
            changed a lot. As I kept building, I think I wanted to embody my ideas, the fun things I
            try out, all my experiences in a little corner of the internet. And this is what you
            will see as you go through this corner.
          </p>
          <p>
            It isn't done yet, probably never will be either. It's going to keep changing as I keep
            using it, and I'll keep improving it. The next time you probably visit this place, it
            may have changed a lot, in ways you can and can't see. Welcome to{' '}
            <span className="accent">checkpoint</span>, hope you like it here!
          </p>
        </div>
      </div>

      {/* <div className="home-foothint">
        <span>// press </span>
        <span className="kbd">⌘/</span>
        <span> to open the finder · </span>
        <span className="kbd">esc</span>
        <span> to close anything</span>
      </div> */}
    </>
  );
}
