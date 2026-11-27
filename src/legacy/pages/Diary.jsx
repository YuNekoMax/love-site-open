import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../useApi';
import PageData from '../components/PageData';
import DiaryFeed from '../components/DiaryFeed';
import Composer from '../components/Composer';
import { deleteEntry } from '../api';

export default function Diary() {
  const state = useApi('/entries');
  const location = useLocation();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState(null);

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

  async function remove(entry) {
    if (!window.confirm(`删掉「${entry.title || '这一条'}」？`)) return;
    await deleteEntry(entry.id);
    state.refresh();
  }

  return (
    <PageData variant="diary" state={state}>
      {(data, s) => (
        <div className="page">
          <div className="in">
            <header className="page-head">
              <p className="eyebrow">日记</p>
              <h1>写下来的日子</h1>
              <p>共 {data.entries.length} 条 · 按时间倒着翻</p>
            </header>
            <div className="page-toolbar">
              {!composing && !editing && (
                <button className="btn-primary sm" type="button" onClick={() => setComposing(true)}>
                  写一条
                </button>
              )}
            </div>
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
            <DiaryFeed
              entries={data.entries}
              showRecall
              onEdit={(entry) => {
                setEditing(entry);
                setComposing(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onDelete={remove}
            />
          </div>
        </div>
      )}
    </PageData>
  );
}
