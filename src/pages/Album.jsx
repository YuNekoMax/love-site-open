import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApi } from '../useApi';
import PageData from '../components/PageData';
import PageHeader from '../components/PageHeader';
import { uploadPhoto, deletePhoto } from '../api';
import { compressPhoto, compressThumb } from '../lib/image';
import { monthHeadCN } from '../lib/format';

const PLUS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function isoOf(photo) {
  return String(photo.taken_at || photo.created_at || '').slice(0, 10);
}

function dayLabel(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(5, 7)}.${iso.slice(8, 10)}` : '';
}

function fullLabel(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date().getFullYear();
  return `${y === now ? '' : `${y} 年 `}${m} 月 ${d} 日`;
}

function thumbOf(photo) {
  return `/media/${photo.thumb_key || photo.r2_key}`;
}

function fullOf(photo) {
  return `/media/${photo.r2_key || photo.thumb_key}`;
}

function groupPhotos(photos) {
  const groups = new Map();
  for (const photo of photos) {
    const iso = isoOf(photo);
    const head = iso
      ? monthHeadCN(iso)
      : { key: 'unknown', label: '更早', year: '' };
    if (!groups.has(head.key)) groups.set(head.key, { ...head, photos: [] });
    groups.get(head.key).photos.push(photo);
  }
  return [...groups.values()];
}

function Thumb({ src, alt }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.complete) ref.current.classList.add('is-loaded');
  }, [src]);
  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={(e) => e.currentTarget.classList.add('is-loaded')}
    />
  );
}

export default function Album() {
  const state = useApi('/photos');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [msg, setMsg] = useState('');
  const [drag, setDrag] = useState(false);
  const dragDepth = useRef(0);

  const photos = state.data?.photos || [];
  const groups = useMemo(() => groupPhotos(photos), [photos]);
  const delays = useMemo(() => {
    const map = new Map();
    photos.forEach((photo, i) => map.set(photo.id, Math.min(i * 34, 480)));
    return map;
  }, [photos]);
  const index = open == null ? -1 : photos.findIndex((p) => p.id === open);
  const current = index >= 0 ? photos[index] : null;

  useEffect(() => {
    if (!current) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [current]);

  const step = useCallback(
    (dir) => {
      setOpen((id) => {
        const i = photos.findIndex((p) => p.id === id);
        const next = photos[i + dir];
        return next ? next.id : id;
      });
    },
    [photos]
  );

  async function add(list) {
    const files = Array.from(list || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    setBusy(true);
    setMsg('');
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(files.length > 1 ? `正在传 ${i + 1} / ${files.length}` : '正在传…');
        const [full, thumb] = await Promise.all([compressPhoto(files[i]), compressThumb(files[i])]);
        const fd = new FormData();
        fd.append('file', full, 'photo.webp');
        fd.append('thumb', thumb, 'photo-thumb.webp');
        await uploadPhoto(fd);
      }
      setProgress('');
      state.refresh();
    } catch (e) {
      setMsg('上传失败：' + e.message);
    } finally {
      setBusy(false);
      setProgress('');
    }
  }

  async function remove(photo) {
    if (!window.confirm('删掉这张照片？')) return;
    await deletePhoto(photo.id);
    if (open === photo.id) setOpen(null);
    state.refresh();
  }

  function onDragEnter(e) {
    if (!e.dataTransfer.types.includes('Files')) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDrag(true);
  }

  function onDragOver(e) {
    if (e.dataTransfer.types.includes('Files')) e.preventDefault();
  }

  function onDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDrag(false);
  }

  function onDrop(e) {
    e.preventDefault();
    dragDepth.current = 0;
    setDrag(false);
    if (!busy) add(e.dataTransfer.files);
  }

  return (
    <div className="page">
      <div className="in">
        <PageHeader
          title="相册"
          action={
            <label className="round-btn" title={busy ? '正在传…' : '上传照片'}>
              {busy ? <span aria-hidden="true">…</span> : PLUS_ICON}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                disabled={busy}
                onChange={(e) => {
                  add(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          }
        />
        {progress && <p className="paper-msg album-msg">{progress}</p>}
        {msg && <p className="paper-msg album-msg">{msg}</p>}
        <div
          className={`album-sheet${drag ? ' is-drag' : ''}`}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <PageData variant="album" state={state}>
            {(data) => {
              const list = data.photos || [];
              if (!list.length) {
                return (
                  <section className="card album-empty">
                    <p className="album-empty-title">相册还空着</p>
                    <p className="empty-note">把照片拖进来，或者点右上角传第一张。</p>
                    <label className="btn-primary sm file-btn">
                      选照片
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        disabled={busy}
                        onChange={(e) => {
                          add(e.target.files);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </section>
                );
              }
              return (
                <div className="album-groups">
                  {groups.map((group) => (
                    <section className="album-group" key={group.key}>
                      <header className="month-head">
                        <h2>{group.label}</h2>
                        <span className="year">{group.year}</span>
                        <span className="rule" aria-hidden="true" />
                        <span className="count">{group.photos.length} 张</span>
                      </header>
                      <div className="album-flow">
                        {group.photos.map((photo, i) => {
                          const delay = delays.get(photo.id) ?? 0;
                          return (
                            <div
                              className={`album-cell${i === 0 ? ' is-feature' : ''}`}
                              key={photo.id}
                              style={{ '--delay': `${delay}ms` }}
                            >
                              <button
                                className="album-item"
                                type="button"
                                onClick={() => setOpen(photo.id)}
                                aria-label={`看照片 ${dayLabel(isoOf(photo))}`}
                              >
                                <Thumb src={thumbOf(photo)} alt="" />
                                <span className="album-shade">
                                  <span>{dayLabel(isoOf(photo))}</span>
                                </span>
                              </button>
                              <button
                                className="album-del"
                                type="button"
                                onClick={() => remove(photo)}
                                aria-label="删除照片"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              );
            }}
          </PageData>
        </div>
        {current && (
          <Viewer
            photos={photos}
            index={index}
            onStep={step}
            onClose={() => setOpen(null)}
            onDelete={remove}
          />
        )}
      </div>
    </div>
  );
}

function Viewer({ photos, index, onStep, onClose, onDelete }) {
  const photo = photos[index];
  const touch = useRef(null);
  const swipeGuard = useRef(0);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onStep(-1);
      else if (e.key === 'ArrowRight') onStep(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onStep]);

  useEffect(() => {
    for (const dir of [-1, 1]) {
      const next = photos[index + dir];
      if (next) {
        const img = new Image();
        img.src = fullOf(next);
      }
    }
  }, [index, photos]);

  function onTouchStart(e) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  }

  function onTouchEnd(e) {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return;
    swipeGuard.current = Date.now() + 500;
    onStep(dx > 0 ? -1 : 1);
  }

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="照片"
      onClick={() => {
        if (Date.now() < swipeGuard.current) return;
        onClose();
      }}
    >
      <div
        className="lb-bg"
        style={{ backgroundImage: `url(${thumbOf(photo)})` }}
        aria-hidden="true"
      />
      <header className="lb-bar">
        <span className="lb-count">
          {index + 1} <i>/</i> {photos.length}
        </span>
        <button className="lb-close" type="button" onClick={onClose}>
          关闭
        </button>
      </header>
      <div className="lb-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img
          key={photo.id}
          className="lb-img"
          src={fullOf(photo)}
          alt=""
          onClick={(e) => e.stopPropagation()}
        />
        {index > 0 && (
          <button
            className="lb-nav prev"
            type="button"
            aria-label="上一张"
            onClick={(e) => {
              e.stopPropagation();
              onStep(-1);
            }}
          >
            ‹
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            className="lb-nav next"
            type="button"
            aria-label="下一张"
            onClick={(e) => {
              e.stopPropagation();
              onStep(1);
            }}
          >
            ›
          </button>
        )}
      </div>
      <footer className="lb-foot">
        <span>{fullLabel(isoOf(photo))}</span>
        <button
          className="lb-del"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(photo);
          }}
        >
          删除这张
        </button>
        <span className="lb-hint">← → 切换 · Esc 关闭</span>
      </footer>
    </div>
  );
}
