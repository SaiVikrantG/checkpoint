import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="nf-page">
      <div className="nf-code">404</div>
      <div className="nf-divider" />
      <p className="nf-message">page not found</p>
      <div className="nf-actions">
        <button className="btn-ghost" onClick={() => navigate(-1)}>← go back</button>
        <button className="btn-primary" onClick={() => navigate('/')}>home</button>
      </div>
    </div>
  );
}
