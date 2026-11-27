import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../useApi';
import PageData from '../components/PageData';
import PageHeader from '../components/PageHeader';
import DiaryTimeline from '../components/DiaryTimeline';
import DiaryReader from '../components/DiaryReader';
import Composer from '../components/Composer';
import { deleteEntry } from '../api';

const PLUS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const SHUFFLE_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
    <path d="m18 2 4 4-4 4" />
    <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
    <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
    <path d="m18 14 4 4-4 4" />
  </svg>
);

export default function Diary() {
  const state = useApi('/entries');
  const location = useLocation();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState(null);
  const [reading, setReading] = useState(null);

  const entries = state.data?.entries || [];
  const current = useMemo(
    () => entries.find((entry) => entry.id === reading) || null,
    [entries, reading]
  );

  useEffect(() => {
    if (location.state && location.state.compose) {
      setComposing(true);
      setEditing(null);
    }
  }, [location.state]);

  function close() {
    setComposing(false);
    setEditing(null);
  }

  function recall() {
    if (!entries.length) return;
    const pick = entries[Math.floor(Math.random() * entries.length)];
    setReading(pick.id);
  }

  async function remove(entry) {
    if (!window.confirm(`删掉「${entry.title || '这一页'}」？`)) return;
    await deleteEntry(entry.id);
    if (reading === entry.id) setReading(null);
    state.refresh();
  }

  return (
    <div className="page">
      <div className="in">
        <PageHeader
          title="日记"
          action={
            <>
              <button
                className="round-btn"
                type="button"
                aria-label="翻一翻旧日子"
                onClick={recall}
                disabled={!entries.length}
              >
                {SHUFFLE_ICON}
              </button>
              <button
                className="round-btn"
                type="button"
                aria-label="写一条"
                onClick={() => {
                  setComposing(true);
                  setEditing(null);
                }}
              >
                {PLUS_ICON}
              </button>
            </>
          }
        />
        <PageData variant="diary" state={state}>
          {(data, s) => (
            <>
              {(composing || editing) && (
                <Composer
                  entry={editing}
                  onSaved={() => {
                    close();
                    s.refresh();
                  }}
                  onCancel={close}
                />
              )}
              {data.entries.length ? (
                <DiaryTimeline entries={data.entries} onOpen={setReading} />
              ) : (
                <section className="card d-empty">
                  <h2>还没有写下的日子</h2>
                  <button
                    className="btn-primary sm"
                    type="button"
                    onClick={() => {
                      setComposing(true);
                      setEditing(null);
                    }}
                  >
                    写第一篇
                  </button>
                </section>
              )}
            </>
          )}
        </PageData>
        {current && (
          <DiaryReader
            entry={current}
            onClose={() => setReading(null)}
            onEdit={(entry) => {
              setReading(null);
              setEditing(entry);
              setComposing(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={remove}
          />
        )}
      </div>
    </div>
  );
}
