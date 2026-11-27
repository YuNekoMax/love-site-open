import { useApi } from '../useApi';
import PageData from '../components/PageData';
import StatusBand from '../components/StatusBand';

export default function Status() {
  const state = useApi('/status');

  return (
    <PageData variant="status" state={state}>
      {(data) => (
        <div className="page status-page">
          <div className="in">
            <header className="page-head">
              <p className="eyebrow">状态</p>
              <h1>这段时间的开心</h1>
              <p>最近 30 天 · 每天的记录和月历</p>
            </header>
          </div>
          <StatusBand data={data} />
        </div>
      )}
    </PageData>
  );
}
