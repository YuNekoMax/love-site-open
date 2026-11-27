import { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { entryDateCN } from '../lib/format';

function md(html) {
  return { __html: DOMPurify.sanitize(marked.parse(html || '')) };
}

function Entry({ entry, flip, onEdit, onDelete }) {
  const hasPhoto = entry.photos && entry.photos.length > 0;
  const body = <div className="markdown" dangerouslySetInnerHTML={md(entry.body_md)} />;
  const head = (
    <div className="entry-head">
      <p className="e-date">{entryDateCN(entry.entry_date)}</p>
      {(onEdit || onDelete) && (
        <div className="entry-tools">
          {onEdit && (
            <button className="text-btn" type="button" onClick={() => onEdit(entry)}>
              编辑
            </button>
          )}
          {onDelete && (
            <button className="text-btn muted" type="button" onClick={() => onDelete(entry)}>
              删除
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (!hasPhoto) {
    return (
      <article className="entry plain">
        {head}
        <h3>{entry.title}</h3>
        {body}
      </article>
    );
  }
  return (
    <article className={`entry${flip ? ' flip' : ''}`}>
      <div className="text">
        {head}
        <h3>{entry.title}</h3>
        {body}
      </div>
      <figure className="photo">
        <img src={`/media/${entry.photos[0].thumb_key || entry.photos[0].r2_key}`} alt="" loading="lazy" />
      </figure>
    </article>
  );
}

export default function DiaryFeed({ entries, limit, showRecall = false, onEdit, onDelete }) {
  const [memory, setMemory] = useState(null);
  const list = limit ? entries.slice(0, limit) : entries;

  function recall() {
    if (!entries.length) return;
    setMemory(entries[Math.floor(Math.random() * entries.length)]);
  }

  return (
    <>
      {list.length ? (
        list.map((entry, i) => (
          <Entry
            entry={entry}
            flip={i % 2 === 1}
            key={entry.id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        <p className="empty-note">还没有日记，去写第一条吧。</p>
      )}
      {showRecall && entries.length > 0 && (
        <div className="recall-inline">
          <button className="recall-btn" type="button" onClick={recall}>
            翻一翻旧日子
          </button>
          {memory && (
            <p className="recall-out">
              「{memory.title}」<span>{entryDateCN(memory.entry_date)}</span>
            </p>
          )}
        </div>
      )}
    </>
  );
}
