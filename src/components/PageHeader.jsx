import { Link, useLocation, useNavigate } from 'react-router-dom';

const BACK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

function BackLink({ to }) {
  const navigate = useNavigate();
  const location = useLocation();
  if (!to) return null;
  if (location.key === 'default') {
    return (
      <Link className="round-btn" to={to} aria-label="返回">
        {BACK_ICON}
      </Link>
    );
  }
  return (
    <button className="round-btn" type="button" onClick={() => navigate(-1)} aria-label="返回">
      {BACK_ICON}
    </button>
  );
}

export default function PageHeader({ eyebrow, back, title, sub, action }) {
  return (
    <header className="app-head">
      <div className="head-main">
        {eyebrow && <p className="app-eyebrow">{eyebrow}</p>}
        <div className="head-title">
          <BackLink to={back} />
          <h1>{title}</h1>
        </div>
        {sub && <p className="app-sub">{sub}</p>}
      </div>
      {action && <div className="head-actions">{action}</div>}
    </header>
  );
}
