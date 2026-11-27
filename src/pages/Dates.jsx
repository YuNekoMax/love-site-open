import { useApi } from '../useApi';
import PageData from '../components/PageData';
import PageHeader from '../components/PageHeader';
import DatesPanel from '../components/DatesPanel';
import Calendar from '../components/Calendar';
import Wishes from '../components/Wishes';

export default function Dates() {
  const state = useApi('/dates');

  return (
    <div className="page">
      <div className="in">
        <PageHeader title="纪念日" back="/tools" />
        <PageData variant="dates" state={state}>
          {(data, s) => {
            const me = data.members.find((m) => m.id === data.me);
            return (
              <div className="dates-grid">
                <div className="dates-col">
                  <DatesPanel data={data} onRefresh={s.refresh} />
                  <Wishes data={data} onChange={s.setData} />
                </div>
                <div className="dates-col">
                  <section className="card" aria-label="月历">
                    <Calendar today={data.today} series={me.series} />
                  </section>
                </div>
              </div>
            );
          }}
        </PageData>
      </div>
    </div>
  );
}
