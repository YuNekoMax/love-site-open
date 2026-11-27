export default function Calendar({ today, series }) {
  const [y, m] = today.split('-').map(Number);
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;
  const total = new Date(y, m, 0).getDate();
  const moods = {};
  (series || []).forEach((s) => {
    moods[s.date] = s.mood;
  });

  return (
    <div className="cal-wrap">
      <div className="sec-head">
        <h2>{m} 月</h2>
        <p>你记录的日子</p>
      </div>
      <div className="cal-grid">
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div className="cal-dow" key={d}>{d}</div>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <div className="cal-day blank" key={`b${i}`}></div>
        ))}
        {Array.from({ length: total }).map((_, i) => {
          const day = i + 1;
          const date = `${today.slice(0, 7)}-${String(day).padStart(2, '0')}`;
          const value = moods[date];
          const cls = value === 'h' ? ' has-h' : value === 'u' ? ' has-u' : value === 's' ? ' has-s' : '';
          return (
            <div className={`cal-day${cls}${date === today ? ' today' : ''}`} key={date}>
              <span>{day}</span>
              <i className="d"></i>
            </div>
          );
        })}
      </div>
      <div className="legend">
        <span><i style={{ background: 'var(--happy)' }}></i>开心</span>
        <span><i style={{ background: 'var(--unsure)' }}></i>不知道</span>
        <span><i style={{ background: 'var(--sad)' }}></i>不开心</span>
      </div>
    </div>
  );
}
