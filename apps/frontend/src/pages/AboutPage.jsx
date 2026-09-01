export default function AboutPage() {
  return (
    <div className="about-grid">
      <div className="about-id">
        <img
          className="about-avatar"
          src="https://pbs.twimg.com/profile_images/1903540870831599617/kFSz4wRZ_400x400.jpg"
          alt="Vikrant"
        />
        <div className="about-name">
          <div className="about-name-line">vikrant.</div>
          <div className="about-name-line about-name-line-2">g()</div>
        </div>
        <div className="about-meta">
          <div>
            <span className="dim">location </span> ~/bangalore, in
          </div>
          <div>
            <span className="dim">role </span> swe @ oracle financial services software
          </div>
        </div>

        <a
          className="btn-primary about-resume-btn"
          href="https://drive.google.com/file/d/18lUO7AUMhrEDu2M5o8fJJpCbQqAoWbAy/view?usp=sharing"
          target="_blank"
          rel="noopener noreferrer"
        >
          ↓ resume.pdf
        </a>
      </div>

      <div className="about-story">
        <div className="about-eyebrow">// readme.md</div>
        <h1 className="about-h1">i like to build things from first principles.</h1>
        <p className="about-p about-p-dim">
          this site is a <span className="accent">checkpoint</span> — a place to stop, write down
          what i learned, and keep going.
        </p>

        <div className="about-section">
          <div className="about-section-title">// experience</div>
          <div className="about-entry">
            <div className="about-entry-head">
              <span className="about-entry-role">associate software developer</span>
              <span className="dim"> @ oracle financial services software</span>
              <span className="about-entry-date">jul 2025 — present</span>
            </div>
            <ul className="about-entry-list">
              <li>
                developing a <span className="kbd-inline">RAG</span> application that parses the
                Oracle AFCS user guide and generates implementation screens, reducing effort for
                customer-facing teams
              </li>
              <li>
                built a structured RAG pipeline with hierarchical chunking and layout-aware PDF
                parsing using <span className="kbd-inline">unstructured</span> to extract context
                from the user guide
              </li>
              <li>
                built a multi-phase ETL pipeline for dependency extraction and resolution between
                user guide modules, producing a topologically sorted module order
              </li>
              <li>
                worked with <span className="kbd-inline">oracle 23ai db</span> for storing and
                querying vectorized document embeddings
              </li>
              <li>
                used the <span className="kbd-inline">OCI SDK</span>,{' '}
                <span className="kbd-inline">OCI GenAI</span> models, and{' '}
                <span className="kbd-inline">langchain</span> for LLM orchestration and prompt
                chaining
              </li>
            </ul>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">// projects</div>

          <div className="about-entry">
            <div className="about-entry-head">
              <a
                className="about-entry-role about-entry-role-link"
                href="https://checkpoint.vikrant.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                checkpoint
              </a>
            </div>
            <p className="about-p about-p-dim about-project-desc">
              personal documentation, blogging, and portfolio platform with authentication. go/echo
              backend with postgresql (pgx/v5, tern migrations, clerk auth/jwt); interactive
              knowledge-graph board with d3-force and collaborative tiptap/yjs editing; zerolog + new
              relic instrumentation; dockerized monorepo with path-filtered github actions ci.
            </p>
            <div className="about-tags">
              <span className="tag">go</span>
              <span className="tag">echo</span>
              <span className="tag">postgresql</span>
              <span className="tag">react</span>
              <span className="tag">vite</span>
              <span className="tag">tiptap</span>
              <span className="tag">d3-force</span>
              <span className="tag">docker</span>
            </div>
          </div>

          <div className="about-entry">
            <div className="about-entry-head">
              <a
                className="about-entry-role about-entry-role-link"
                href="https://ieeexplore.ieee.org/abstract/document/10499106"
                target="_blank"
                rel="noopener noreferrer"
              >
                &#8599; resilient kannada scene text detection
              </a>
              <span className="about-entry-date">ieee publication</span>
            </div>
            <p className="about-p about-p-dim about-project-desc">
              research paper published in an ieee conference — built a custom dataset and improved
              prior detection accuracy by 10% using yolov8 and craft models to detect and annotate
              kannada scene text.
            </p>
          </div>

          <div className="about-entry">
            <div className="about-entry-head">
              <span className="about-entry-role">airline management system</span>
            </div>
            <p className="about-p about-p-dim about-project-desc">
              full-stack airline check-in, in-flight, and ancillary management app using a
              microservices architecture with spring boot backends and a react/typescript frontend.
              netflix eureka for service discovery/load balancing; pl/sql relational schema design.
            </p>
            <div className="about-tags">
              <span className="tag">react</span>
              <span className="tag">typescript</span>
              <span className="tag">spring boot</span>
              <span className="tag">java</span>
              <span className="tag">pl/sql</span>
              <span className="tag">netflix eureka</span>
              <span className="tag">microservices</span>
            </div>
          </div>
        </div>

        <div className="about-section">
          <div className="about-section-title">// stack</div>

          <div className="about-stack-group">
            <div className="about-stack-label">languages</div>
            <div className="about-tags">
              <span className="tag">python</span>
              <span className="tag">javascript</span>
              <span className="tag">go</span>
              <span className="tag">sql</span>
            </div>
          </div>

          <div className="about-stack-group">
            <div className="about-stack-label">tech stack</div>
            <div className="about-tags">
              <span className="tag">reactjs</span>
              <span className="tag">vite</span>
              <span className="tag">echo</span>
              <span className="tag">git</span>
              <span className="tag">linux</span>
              <span className="tag">websockets</span>
              <span className="tag">numpy</span>
              <span className="tag">pandas</span>
              <span className="tag">docker</span>
              <span className="tag">github actions (ci/cd)</span>
              <span className="tag">langchain</span>
              <span className="tag">rag</span>
            </div>
          </div>

          <div className="about-stack-group">
            <div className="about-stack-label">databases</div>
            <div className="about-tags">
              <span className="tag">oracle 23ai db</span>
              <span className="tag">postgresql</span>
            </div>
          </div>
        </div>
      </div>

      <div className="about-side">
        <div className="about-panel">
          <div className="panel-head">// elsewhere</div>
          <ul className="panel-list panel-list-links">
            <li>
              <a href="https://github.com/SaiVikrantG" target="_blank" rel="noopener noreferrer">
                &#8599; github.com/SaiVikrantG
              </a>
            </li>
            <li>
              <a
                href="https://linkedin.com/in/saivikrantg"
                target="_blank"
                rel="noopener noreferrer"
              >
                &#8599; linkedin.com/in/saivikrantg
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
