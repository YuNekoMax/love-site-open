import { useState } from 'react';
import { postCheckin, postAnswer } from '../api';

const MOODS = [
  { key: 'h', label: '开心' },
  { key: 'u', label: '不知道' },
  { key: 's', label: '不开心' }
];
const LABEL = { h: '开心', u: '不知道', s: '不开心' };

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

  const note = myMood
    ? `今天记下了：${LABEL[myMood]}。随时可以改，明天再来。`
    : '每天都可以补记最近的日子，翻相册的时候也许想得起来。';
  const showInput = !data.answer || editing;

  return (
    <section className="band-ask" id="today" aria-labelledby="askQ">
      <div className="in ask-grid">
        <div className="ask-col">
          <p className="eyebrow">今天的问卷</p>
          <h2 id="askQ">今天相处的开心吗？</h2>
          <div className="moods">
            {MOODS.map((m) => (
              <button
                key={m.key}
                className="mood"
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
          <p className="ask-note">{error || note}</p>
        </div>
        <div className="ask-col">
          <p className="eyebrow">每日一问</p>
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
        </div>
      </div>
    </section>
  );
}
