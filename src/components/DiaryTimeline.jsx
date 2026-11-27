import { useMemo } from 'react';
import { monthHeadCN, plainText } from '../lib/format';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function dateOf(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return { day: Number(m[3]), week: WEEK[d.getUTCDay()] };
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    if (a.entry_date === b.entry_date) return b.id - a.id;
    return a.entry_date < b.entry_date ? 1 : -1;
  });
}

function groupEntries(entries) {
  const map = new Map();
  for (const entry of entries) {
    const head = monthHeadCN(entry.entry_date || '');
    if (!map.has(head.key)) map.set(head.key, { ...head, entries: [] });
    map.get(head.key).entries.push(entry);
  }
  return [...map.values()];
}

function Media({ photos }) {
  if (!photos || !photos.length) return null;
  const shown = photos.slice(0, 3);
  const rest = photos.length - shown.length;
  return (
    <span className={`d-media n${shown.length}`}>
      {shown.map((photo, i) => (
        <span className="d-shot" key={photo.id}>
          <img
            src={`/media/${photo.thumb_key || photo.r2_key}`}
            alt=""
            loading="lazy"
            decoding="async"
          />
          {rest > 0 && i === shown.length - 1 && <i className="d-more">+{rest}</i>}
        </span>
      ))}
    </span>
  );
}

function EntryCard({ entry, delay, onOpen }) {
  const date = dateOf(entry.entry_date);
  const title = (entry.title || '').trim();
  const text = plainText(entry.body_md);

  return (
    <li className={`d-item${date ? '' : ' no-date'}`} style={{ '--delay': `${delay}ms` }}>
      <button className="d-card" type="button" onClick={() => onOpen(entry.id)}>
        {date && (
          <span className="d-date">
            <b>{date.day}</b>
            <em>周{date.week}</em>
          </span>
        )}
        <span className="d-main">
          {title && <span className="d-title">{title}</span>}
          {text && <span className={`d-excerpt${title ? '' : ' is-lead'}`}>{text}</span>}
        </span>
        <Media photos={entry.photos} />
      </button>
    </li>
  );
}

export default function DiaryTimeline({ entries, onOpen }) {
  const sorted = useMemo(() => sortEntries(entries), [entries]);
  const groups = useMemo(() => groupEntries(sorted), [sorted]);
  const delays = useMemo(() => {
    const map = new Map();
    sorted.forEach((entry, i) => map.set(entry.id, Math.min(i * 45, 480)));
    return map;
  }, [sorted]);

  return (
    <div className="diary-groups">
      {groups.map((group) => (
        <section className="diary-group" key={group.key}>
          <header className="month-head">
            <h2>{group.label}</h2>
            <span className="year">{group.year}</span>
            <span className="rule" aria-hidden="true" />
            <span className="count">{group.entries.length} 篇</span>
          </header>
          <ol className={`diary-line${group.entries.length === 1 ? ' is-single' : ''}`}>
            {group.entries.map((entry) => (
              <EntryCard
                entry={entry}
                key={entry.id}
                delay={delays.get(entry.id) ?? 0}
                onOpen={onOpen}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
