export default function AboutPage() {
  return (
    <div className="about-grid">
      <div className="about-id">
        <div className="about-avatar">avatar.png</div>
        <div className="about-name">
          <div className="about-name-line">user.</div>
          <div className="about-name-line about-name-line-2">name()</div>
        </div>
        <div className="about-meta">
          <div><span className="dim">location  </span> ~/berlin, de</div>
          <div><span className="dim">role      </span> infra engineer</div>
          <div><span className="dim">timezone  </span> utc+01:00</div>
          <div><span className="dim">status    </span> <span className="accent">○ available</span></div>
        </div>
      </div>

      <div className="about-story">
        <div className="about-eyebrow">// readme.md</div>
        <h1 className="about-h1">i build small things, carefully.</h1>
        <p className="about-p">
          i spend most of my hours in <span className="kbd-inline">rust</span> and{' '}
          <span className="kbd-inline">go</span>, building backends that don't fall over and tools
          that get out of the way.
        </p>
        <p className="about-p">
          outside of code: long walks, cheap mechanical keyboards, sci-fi paperbacks, and a slow
          but stubborn attempt to learn the piano.
        </p>
        <p className="about-p about-p-dim">
          this site is a <span className="accent">checkpoint</span> — a place to stop, write down
          what i learned, and keep going.
        </p>
      </div>

      <div className="about-side">
        <div className="about-panel">
          <div className="panel-head">// now</div>
          <ul className="panel-list">
            <li><span className="dim">reading </span> "designing data-intensive applications"</li>
            <li><span className="dim">writing </span> a series on database internals</li>
            <li><span className="dim">building</span> checkpoint v0.2</li>
            <li><span className="dim">learning</span> jazz piano voicings</li>
          </ul>
        </div>
        <div className="about-panel">
          <div className="panel-head">// signal</div>
          <div className="panel-stats">
            <div><span className="big">847</span><span className="dim">commits / 30d</span></div>
            <div><span className="big">06</span><span className="dim">posts / 30d</span></div>
            <div><span className="big">12k</span><span className="dim">words written</span></div>
            <div><span className="big">62</span><span className="dim">wpm avg</span></div>
          </div>
        </div>
        <div className="about-panel">
          <div className="panel-head">// elsewhere</div>
          <ul className="panel-list panel-list-links">
            <li>
              <a href="https://github.com/SaiVikrantG" target="_blank" rel="noopener noreferrer">
                &#8599; github.com/SaiVikrantG
              </a>
            </li>
            <li>&#8599; twitter.com/user</li>
            <li>&#8599; linkedin.com/in/user</li>
            <li>&#8599; user@checkpoint.dev</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
