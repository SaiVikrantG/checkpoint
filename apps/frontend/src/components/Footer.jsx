export default function Footer() {
  return (
    <div className="page-footer">
      <div className="footer-left">
        <a
          className="footer-link"
          href="https://github.com/SaiVikrantG"
          target="_blank"
          rel="noopener noreferrer"
        >
          &#8599; github
        </a>
        <a
          className="footer-link"
          href="https://www.linkedin.com/in/saivikrantg"
          target="_blank"
          rel="noopener noreferrer"
        >
          &#8599; linkedin
        </a>
        <a
          className="footer-link"
          href="https://x.com/whykrant"
          target="_blank"
          rel="noopener noreferrer"
        >
          &#8599; x
        </a>
      </div>
      <div className="footer-right">
        <span className="footer-muted">&copy; {new Date().getFullYear()} G Sai Vikrant</span>
        <span className="footer-muted">checkpoint</span>
        <span className="footer-muted">{__APP_VERSION__}</span>
      </div>
    </div>
  );
}
