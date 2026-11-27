import { useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { eyebrowCN } from '../lib/format';

const CLOSE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default function DiaryReader({ entry, onClose, onEdit, onDelete }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const title = (entry.title || '').trim();
  const html = { __html: DOMPurify.sanitize(marked.parse(entry.body_md || '')) };
  const photos = entry.photos || [];

  return (
    <div className="reader" role="dialog" aria-modal="true" aria-label={title || '日记'}>
      <div className="reader-sheet">
        <header className="reader-head">
          {entry.entry_date && <p className="reader-eyebrow">{eyebrowCN(entry.entry_date)}</p>}
          {title && <h1>{title}</h1>}
          <button className="reader-close" type="button" onClick={onClose} aria-label="关闭">
            {CLOSE_ICON}
          </button>
        </header>
        <div className="markdown reader-body" dangerouslySetInnerHTML={html} />
        {photos.length > 0 && (
          <div className="reader-photos">
            {photos.map((photo) => (
              <img key={photo.id} src={`/media/${photo.r2_key || photo.thumb_key}`} alt="" loading="lazy" />
            ))}
          </div>
        )}
        <footer className="reader-foot">
          <button className="reader-act" type="button" onClick={() => onEdit(entry)}>
            编辑
          </button>
          <button className="reader-act muted" type="button" onClick={() => onDelete(entry)}>
            删除
          </button>
        </footer>
      </div>
    </div>
  );
}
