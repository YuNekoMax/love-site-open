import { Link } from 'react-router-dom';
import { useApi } from '../useApi';
import PageData from '../components/PageData';
import Hero from '../components/Hero';
import AskBand from '../components/AskBand';
import StatusSummary from '../components/StatusSummary';
import DiaryFeed from '../components/DiaryFeed';

export default function Home() {
  const state = useApi('/home');

  return (
    <PageData variant="home" state={state}>
      {(data, s) => (
        <>
          <Hero data={data} />
          <AskBand data={data} onChange={s.setData} />
          <StatusSummary data={data} />
          <section className="home-feed">
            <div className="in">
              <div className="sec-head">
                <h2>最近的日记</h2>
                <Link className="more-link" to="/diary">全部 →</Link>
              </div>
              <DiaryFeed entries={data.entries} limit={3} />
            </div>
          </section>
        </>
      )}
    </PageData>
  );
}
