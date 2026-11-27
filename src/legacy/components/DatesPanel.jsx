import { useState } from 'react';
import { createShare, createMilestone, deleteMilestone } from '../api';

export default function DatesPanel({ data, onRefresh }) {
  const [share, setShare] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [kind, setKind] = useState('yearly');
  const [addMsg, setAddMsg] = useState('');

  async function makeShare() {
    if (share) {
      setShare(null);
      return;
    }
    setError('');
    try {
      setShare(await createShare());
    } catch (e) {
      setError(e.message);
    }
  }

  async function copy() {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      setError('复制不了，长按链接手动复制吧');
    }
  }

  async function add(e) {
    e.preventDefault();
    if (!title.trim() || !date.trim()) return;
    try {
      await createMilestone({ title: title.trim(), date: date.trim(), kind });
      setTitle('');
      setDate('');
      setAdding(false);
      setAddMsg('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setAddMsg('加失败了：' + err.message);
    }
  }

  async function remove(item) {
    if (!window.confirm(`删掉「${item.title}」？`)) return;
    await deleteMilestone(item.id);
    if (onRefresh) onRefresh();
  }

  return (
    <section className="dates-panel" aria-labelledby="annTitle">
      <div className="sec-head">
        <h2 id="annTitle">纪念日</h2>
        <p>记着的日子</p>
      </div>
      <div className="ann-list">
        {data.milestones.map((m) => (
          <div className="ann" key={m.id}>
            <div className="ann-what">
              <b>{m.title}</b>
              <span>{m.sub}</span>
              {m.progress !== undefined && (
                <div className="mini-bar">
                  <i style={{ width: `${m.progress}%` }} />
                </div>
              )}
            </div>
            <div className="ann-side">
              <div className="ann-num">
                {m.big}
                <small>{m.unit}</small>
              </div>
              {m.id !== 'day100' && (
                <button
                  className="ann-del"
                  type="button"
                  onClick={() => remove(m)}
                  aria-label="删除这个纪念日"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <button className="add-link" type="button" onClick={() => setAdding((v) => !v)}>
        {adding ? '先不加了' : '+ 加一个纪念日'}
      </button>
      {adding && (
        <form className="inline-form" onSubmit={add}>
          <input
            className="field grow"
            placeholder="名字，比如 第一次见面"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="field date-field"
            placeholder={kind === 'yearly' ? '01-01' : '2024-01-01'}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            className="field select-field"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="yearly">每年</option>
            <option value="since">从这天起</option>
          </select>
          <button className="btn-primary sm" type="submit">加上</button>
        </form>
      )}
      {addMsg && <p className="share-hint">{addMsg}</p>}
      <button className="share-btn" type="button" onClick={makeShare}>
        {share ? '收起分享卡' : '生成分享卡'}
      </button>
      {share && (
        <div className="share-card">
          <p className="share-kicker">恋爱日记</p>
          <p className="share-days">
            第 <b>{data.days}</b> 天
          </p>
          <p className="share-meta">{data.startDate.slice(0, 10)} 起</p>
          <div className="share-link">
            <code>{share.url.replace(/^https?:\/\//, '')}</code>
            <button className="q-btn" type="button" onClick={copy}>
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <p className="share-hint">点开就能看，不用登录</p>
        </div>
      )}
      {error && <p className="share-hint">{error}</p>}
    </section>
  );
}
