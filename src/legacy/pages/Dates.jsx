import { useApi } from '../useApi';
import PageData from '../components/PageData';
import DatesPanel from '../components/DatesPanel';
import Calendar from '../components/Calendar';
import Wishes from '../components/Wishes';

export default function Dates() {
  const state = useApi('/dates');

  return (
    <PageData variant="dates" state={state}>
      {(data, s) => {
        const me = data.members.find((m) => m.id === data.me);
        return (
          <div className="page dates-page">
            <div className="in">
              <header className="page-head">
                <p className="eyebrow">纪念日</p>
                <h1>记着的日子</h1>
                <p>在一起第 {data.days} 天</p>
              </header>
              <div className="dates-grid">
                <DatesPanel data={data} onRefresh={s.refresh} />
                <aside className="dates-side">
                  <Calendar today={data.today} series={me.series} />
                </aside>
              </div>
            </div>
            <Wishes data={data} onChange={s.setData} />
          </div>
        );
      }}
    </PageData>
  );
}
