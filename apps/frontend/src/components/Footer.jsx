export default function Footer() {
  return (
    <div className="page-footer">
      <div className="footer-left">
        <a className="footer-link" href="https://github.com/SaiVikrantG" target="_blank" rel="noopener noreferrer">
          <span className="dot">&#9635;</span> github
        </a>
        <a className="footer-link" href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
          <span className="dot">&#9636;</span> linkedin
        </a>
        <a className="footer-link" href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <span className="dot">&#9637;</span> twitter
        </a>
      </div>
      <div className="footer-right">
        <span className="footer-muted">checkpoint</span>
        <span className="footer-muted">v0.1.0</span>
      </div>
    </div>
  );
}
