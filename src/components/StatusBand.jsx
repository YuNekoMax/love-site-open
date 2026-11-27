import MemberRow from './MemberRow';
import Calendar from './Calendar';
import { pct } from '../lib/format';

const LABEL = { h: '开心', u: '不知道', s: '不开心' };

const PULSE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default function StatusBand({ data }) {
  const me = data.members.find((m) => m.id === data.me);
  const visible = data.members.filter(
    (m) => m.id === data.me || m.series.some((s) => s.mood !== '-')
  );
  const mine = data.todayCheckins.find((c) => c.member === data.me);
  const mood = mine ? mine.mood : null;

  let tone = 'u';
  let title = '今天还没记';
  if (mood) {
    tone = mood;
    title = `今天记下了：${LABEL[mood]}`;
  }

  return (
    <div className="dates-grid">
      <section className="card" aria-labelledby="stTitle">
        <div className="card-head">
          <h2 className="card-title" id="stTitle">
            <span className="ico">{PULSE_ICON}</span>
            我们的状态
          </h2>
        </div>
        <div className={`banner is-${tone}`}>
          <span className="dot"></span>
          <div>
            <b>{title}</b>
          </div>
        </div>
        <div className="members">
          {visible.map((member) => (
            <MemberRow key={member.id} member={member} today={data.today} />
          ))}
        </div>
        <div className="figures">
          <div className="fig">
            <b>{pct(data.stats.weekRate)}</b>
            <span>本周开心率</span>
          </div>
          <div className="fig">
            <b>{data.stats.streak} 天</b>
            <span>连续开心</span>
          </div>
          <div className="fig">
            <b>{data.stats.monthCount} 天</b>
            <span>本月打卡</span>
          </div>
        </div>
      </section>
      <section className="card" aria-label="月历">
        <Calendar today={data.today} series={me.series} />
      </section>
    </div>
  );
}
