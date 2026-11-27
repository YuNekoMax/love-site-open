import { useState } from 'react';
import { patchWish, createWish, deleteWish } from '../api';

const WISH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.8-7.7 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z" />
  </svg>
);

export default function Wishes({ data, onChange }) {
  const list = data.wishes || [];
  const done = list.filter((w) => w.done).length;
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  async function toggle(wish) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await patchWish(wish.id, !wish.done);
      onChange({ ...data, wishes: res.wishes });
    } finally {
      setBusy(false);
    }
  }

  async function remove(wish) {
    if (!window.confirm(`删掉「${wish.text}」？`)) return;
    const res = await deleteWish(wish.id);
    onChange({ ...data, wishes: res.wishes });
  }

  async function add(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const res = await createWish(text.trim());
      onChange({ ...data, wishes: res.wishes });
      setText('');
    } catch (err) {
      setMsg('加失败了：' + err.message);
    }
  }

  return (
    <section className="card wishes" aria-labelledby="wishTitle">
      <div className="card-head">
        <h2 className="card-title" id="wishTitle">
          <span className="ico">{WISH_ICON}</span>
          想一起做的事
        </h2>
        <span className="card-note">{done} / {list.length}</span>
      </div>
      <div className="wish-bar">
        <i style={{ width: `${list.length ? (done / list.length) * 100 : 0}%` }} />
      </div>
      {list.length ? (
        <ul className="wish-list">
          {list.map((wish) => (
            <li key={wish.id}>
              <label>
                <input
                  type="checkbox"
                  checked={!!wish.done}
                  disabled={busy}
                  onChange={() => toggle(wish)}
                />
                <span>{wish.text}</span>
              </label>
              <button
                className="wish-del"
                type="button"
                onClick={() => remove(wish)}
                aria-label="删除"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-note">还没有想做的事，下面加一条。</p>
      )}
      <form className="wish-add" onSubmit={add}>
        <input
          className="field grow"
          placeholder="再加一件想做的事"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn-primary sm" type="submit">加上</button>
      </form>
      {msg && <p className="paper-msg">{msg}</p>}
    </section>
  );
}
