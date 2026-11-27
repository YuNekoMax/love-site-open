import { Link } from 'react-router-dom';
import { useApi } from '../useApi';
import PageData from '../components/PageData';
import PageHeader from '../components/PageHeader';
import Hero from '../components/Hero';
import AskBand from '../components/AskBand';
import StatusSummary from '../components/StatusSummary';
import DiaryFeed from '../components/DiaryFeed';

const PEN_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" />
  </svg>
);

export default function Home() {
  const state = useApi('/home');

  return (
    <div className="page">
      <div className="in">
        <PageHeader
          title="恋爱日记"
          action={
            <Link className="round-btn" to="/diary" state={{ compose: true }} aria-label="写日记">
              {PEN_ICON}
            </Link>
          }
        />
        <PageData variant="home" state={state}>
          {(data, s) => (
            <div className="home-grid">
              <Hero data={data} />
              <AskBand data={data} onChange={s.setData} />
              <StatusSummary data={data} />
              <section className="card recent-card span-2" aria-labelledby="recentTitle">
                <div className="card-head">
                  <h2 className="card-title" id="recentTitle">最近的日记</h2>
                  <Link className="card-link" to="/diary">全部 →</Link>
                </div>
                <DiaryFeed entries={data.entries} limit={3} />
              </section>
            </div>
          )}
        </PageData>
      </div>
    </div>
  );
}
