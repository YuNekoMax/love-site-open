import MemberRow from './MemberRow';
import Calendar from './Calendar';
import { pct } from '../lib/format';

const LABEL = { h: '开心', u: '不知道', s: '不开心' };

export default function StatusBand({ data }) {
  const me = data.members.find((m) => m.id === data.me);
  const visible = data.members.filter(
    (m) => m.id === data.me || m.series.some((s) => s.mood !== '-')
  );
  const mine = data.todayCheckins.find((c) => c.member === data.me);
  const mood = mine ? mine.mood : null;

  let tone = 'u';
  let title = '今天还没记';
  let sub = '点一下就好，不用想太久';
  if (mood) {
    tone = mood;
    title = `今天记下了：${LABEL[mood]}`;
    sub = '慢慢记就好';
  }

  return (
    <section className="band-status" id="status" aria-labelledby="stTitle">
      <div className="in status-grid">
        <div className="status-main">
          <div className="sec-head">
            <h2 id="stTitle">我们的状态</h2>
            <p>最近 30 天 · 你的记录</p>
          </div>
          <div className={`banner is-${tone}`}>
            <span className="dot"></span>
            <div>
              <b>{title}</b>
              <p>{sub}</p>
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
          <p className="fig-note">「不知道」不计入开心率的分母，只算一次记录。</p>
        </div>
        <aside className="status-cal" aria-label="月历">
          <Calendar today={data.today} series={me.series} />
        </aside>
      </div>
    </section>
  );
}
