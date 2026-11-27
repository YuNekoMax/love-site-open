import { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useApi } from '../useApi';
import PageData from '../components/PageData';
import PageHeader from '../components/PageHeader';
import { getMe, createCapsule, deleteCapsule } from '../api';
import { dateCN, todayCN, nextYearCN } from '../lib/format';

const PLUS_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

function md(html) {
  return { __html: DOMPurify.sanitize(marked.parse(html || '')) };
}

export default function Capsules() {
  const state = useApi('/capsules');
  const [me, setMe] = useState(null);
  const [writing, setWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [openDate, setOpenDate] = useState(() => nextYearCN(todayCN()));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const today = todayCN();

  useEffect(() => {
    let alive = true;
    getMe()
      .then((data) => {
        if (alive) setMe(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  function reset() {
    setWriting(false);
    setTitle('');
    setBody('');
    setMsg('');
    setOpenDate(nextYearCN(today));
  }

  async function save() {
    if (busy) return;
    const text = body.trim();
    if (!text) {
      setMsg('还没写内容');
      return;
    }
    if (!openDate) {
      setMsg('挑一个打开的日子');
      return;
    }
    if (openDate < today) {
      setMsg('打开的日子要在今天之后');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await createCapsule({ title, body_md: text, open_date: openDate });
      reset();
      state.refresh();
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!window.confirm('删掉这个胶囊？')) return;
    await deleteCapsule(item.id);
    state.refresh();
  }

  return (
    <div className="page">
      <div className="in">
        <PageHeader
          title="时间胶囊"
          back="/tools"
          action={
            <button
              className="round-btn"
              type="button"
              aria-label="写一封"
              onClick={() => {
                setWriting(true);
                setMsg('');
              }}
            >
              {PLUS_ICON}
            </button>
          }
        />
        {writing && (
          <section className="paper capsule-form">
            <input
              className="paper-title"
              placeholder="给这封信起个名字（可以不写）"
              maxLength={60}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="paper-meta">
              <label className="capsule-pick">
                <span>打开的日子</span>
                <input
                  className="paper-date"
                  type="date"
                  min={today}
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                />
              </label>
            </div>
            <textarea
              className="paper-body paper-textarea"
              placeholder="写给将来的我们…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="paper-foot">
              <div className="paper-actions">
                {msg && <span className="paper-msg">{msg}</span>}
                <button className="text-btn muted" type="button" onClick={reset}>
                  取消
                </button>
                <button className="btn-primary" type="button" onClick={save} disabled={busy}>
                  {busy ? '封存中…' : '封存'}
                </button>
              </div>
            </div>
          </section>
        )}
        <PageData variant="diary" state={state}>
          {(data) => {
            const list = data.capsules || [];
            if (!list.length) {
              return (
                <section className="card d-empty">
                  <h2>还没有时间胶囊</h2>
                  <button className="btn-primary sm" type="button" onClick={() => setWriting(true)}>
                    写一封
                  </button>
                </section>
              );
            }
            const opened = list.filter((c) => c.open).sort((a, b) => (a.open_date < b.open_date ? 1 : -1));
            const sealed = list.filter((c) => !c.open).sort((a, b) => (a.open_date < b.open_date ? -1 : 1));
            const names = me ? me.names : null;
            const avatars = me ? me.avatars : null;
            const who = (item) => (item.member === data.me ? '我' : names ? names[item.member] : '对方');
            return (
              <div className="capsule-list">
                {opened.map((item) => (
                  <article className="capsule is-open" key={item.id}>
                    <div className="capsule-top">
                      {avatars && <img className="capsule-ava" src={avatars[item.member]} alt="" />}
                      <div className="capsule-meta">
                        <p className="capsule-who">{who(item)} 封存的</p>
                        <p className="capsule-when">{dateCN(item.open_date)} · 已开封</p>
                      </div>
                      <button
                        className="capsule-del"
                        type="button"
                        onClick={() => remove(item)}
                        aria-label="删除胶囊"
                      >
                        ×
                      </button>
                    </div>
                    {item.title && <h3 className="capsule-title">{item.title}</h3>}
                    <div className="markdown capsule-body" dangerouslySetInnerHTML={md(item.body_md)} />
                  </article>
                ))}
                {sealed.map((item) => (
                  <article className="capsule is-sealed" key={item.id}>
                    <div className="capsule-top">
                      {avatars && <img className="capsule-ava" src={avatars[item.member]} alt="" />}
                      <div className="capsule-meta">
                        <p className="capsule-who">{who(item)} 封存的</p>
                        <p className="capsule-when">{dateCN(item.open_date)} 打开</p>
                      </div>
                      <span className="capsule-days">{item.days} 天</span>
                      <button
                        className="capsule-del"
                        type="button"
                        onClick={() => remove(item)}
                        aria-label="删除胶囊"
                      >
                        ×
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            );
          }}
        </PageData>
      </div>
    </div>
  );
}
