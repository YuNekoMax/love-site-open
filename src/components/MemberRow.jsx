import { pct } from '../lib/format';

const LABEL = { h: '开心', u: '不知道', s: '不开心' };

export default function MemberRow({ member, today }) {
  return (
    <div className="member">
      <img className={`m-avatar ${member.id}`} src={member.avatar} alt={member.name} />
      <span className="m-name">{member.name}</span>
      <div className="cells">
        {member.series.map((day) => {
          const cls = day.mood === '-' ? 'empty' : day.mood;
          const label = day.mood === '-' ? '没记录' : LABEL[day.mood];
          return (
            <span
              key={day.date}
              className={`cell ${cls}${day.date === today ? ' today' : ''}`}
              title={`${day.date} · ${label}`}
            />
          );
        })}
      </div>
      <b className="m-rate">{pct(member.rate)}</b>
    </div>
  );
}
