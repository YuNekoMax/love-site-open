import { Link } from 'react-router-dom';
import { plainText } from '../lib/format';

function shortDate(iso) {
  return (iso || '').slice(5).replace('-', '.');
}

function titleOf(entry) {
  return (entry.title || '').trim() || plainText(entry.body_md) || '没有名字的一天';
}

export default function DiaryFeed({ entries, limit }) {
  const list = limit ? entries.slice(0, limit) : entries;

  if (!list.length) {
    return <p className="empty-note">还没有日记，去写第一条吧。</p>;
  }

  return (
    <div className="recent-list">
      {list.map((entry) => (
        <Link className="feed-row" to="/diary" key={entry.id}>
          <span className="feed-date">{shortDate(entry.entry_date)}</span>
          <span className="feed-title">{titleOf(entry)}</span>
          <span className="feed-arrow" aria-hidden="true">→</span>
        </Link>
      ))}
    </div>
  );
}
