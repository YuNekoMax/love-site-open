import { useApi } from '../useApi';
import PageData from '../components/PageData';
import PageHeader from '../components/PageHeader';
import StatusBand from '../components/StatusBand';

export default function Status() {
  const state = useApi('/status');

  return (
    <div className="page">
      <div className="in">
        <PageHeader title="状态" back="/tools" />
        <PageData variant="status" state={state}>
          {(data) => <StatusBand data={data} />}
        </PageData>
      </div>
    </div>
  );
}
