import { useState } from 'react';
import { postCheckin, postAnswer } from '../api';

const MOODS = [
  { key: 'h', label: '开心' },
  { key: 'u', label: '不知道' },
  { key: 's', label: '不开心' }
];
const LABEL = { h: '开心', u: '不知道', s: '不开心' };

const ASK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.4 9.4 0 0 1-3.2-.6L3 21l1.7-5.1a8.2 8.2 0 0 1-.7-3.4 8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8 7.4z" />
  </svg>
);

export default function AskBand({ data, onChange }) {
  const mine = data.todayCheckins.find((c) => c.member === data.me);
  const myMood = mine ? mine.mood : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);

  async function check(mood) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      onChange(await postCheckin(mood));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveAnswer(e) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    setError('');
    try {
      onChange(await postAnswer(value));
      setText('');
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit() {
    setText(data.answer ? data.answer.answer : '');
    setEditing(true);
  }

  const showInput = !data.answer || editing;

  return (
    <section className="card ask-card" aria-labelledby="askTitle">
      <div className="card-head">
        <h2 className="card-title" id="askTitle">
          <span className="ico">{ASK_ICON}</span>
          今天的问卷
        </h2>
      </div>
      <p className="ask-q">今天相处的开心吗？</p>
      <div className="seg" role="group" aria-label="今天的心情">
        {MOODS.map((m) => (
          <button
            key={m.key}
            className="seg-item"
            type="button"
            aria-pressed={myMood === m.key}
            disabled={busy}
            onClick={() => check(m.key)}
          >
            <span className={`swatch ${m.key}`} />
            {m.label}
          </button>
        ))}
      </div>
      {error && <p className="ask-note">{error}</p>}
      <div className="card-divide" />
      <p className="app-eyebrow">每日一问</p>
      <p className="q-question">{data.question}</p>
      {showInput ? (
        <form className="q-row" onSubmit={saveAnswer}>
          <input
            className="q-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="一句话就好"
            aria-label="每日一问的回答"
          />
          <button className="q-btn" type="submit" disabled={busy}>
            记下
          </button>
        </form>
      ) : (
        <p className="q-done">
          已经收进今天了：{data.answer.answer}
          <button className="q-link" type="button" onClick={startEdit}>
            改一下
          </button>
        </p>
      )}
    </section>
  );
}
