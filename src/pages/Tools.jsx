import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { createShare, logout } from '../api';

const ICON = {
  dates: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  status: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  export: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  ),
  capsule: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3 7.5 9 6 9-6" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 5 6v5c0 4.2 2.9 8.1 7 9 4.1-.9 7-4.8 7-9V6z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  out: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </svg>
  )
};

export default function Tools() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [link, setLink] = useState('');

  async function share() {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      const data = await createShare();
      const url = data.url;
      setLink(url);
      try {
        await navigator.clipboard.writeText(url);
        setMsg('分享链接已复制');
      } catch (e) {
        setMsg('分享链接已生成，长按下面这行复制');
      }
    } catch (e) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!window.confirm('退出登录？')) return;
    try {
      await logout();
    } finally {
      window.location.reload();
    }
  }

  return (
    <div className="page">
      <div className="in">
        <PageHeader title="工具" />
        {msg && <p className="paper-msg tool-msg">{msg}</p>}
        <section className="card tool-card">
          <Link className="tool-row" to="/dates">
            <span className="tool-ico">{ICON.dates}</span>
            <span className="tool-text">
              <b>纪念日</b>
            </span>
            <span className="tool-arrow">→</span>
          </Link>
          <Link className="tool-row" to="/status">
            <span className="tool-ico">{ICON.status}</span>
            <span className="tool-text">
              <b>状态</b>
            </span>
            <span className="tool-arrow">→</span>
          </Link>
          <Link className="tool-row" to="/capsules">
            <span className="tool-ico">{ICON.capsule}</span>
            <span className="tool-text">
              <b>时间胶囊</b>
            </span>
            <span className="tool-arrow">→</span>
          </Link>
          <Link className="tool-row" to="/settings">
            <span className="tool-ico">{ICON.settings}</span>
            <span className="tool-text">
              <b>设置</b>
            </span>
            <span className="tool-arrow">→</span>
          </Link>
          <Link className="tool-row" to="/export">
            <span className="tool-ico">{ICON.export}</span>
            <span className="tool-text">
              <b>导出备份</b>
            </span>
            <span className="tool-arrow">→</span>
          </Link>
          <Link className="tool-row" to="/check">
            <span className="tool-ico">{ICON.check}</span>
            <span className="tool-text">
              <b>站点体检</b>
            </span>
            <span className="tool-arrow">→</span>
          </Link>
          <button className="tool-row" type="button" onClick={share} disabled={busy}>
            <span className="tool-ico">{ICON.share}</span>
            <span className="tool-text">
              <b>{busy ? '正在生成…' : '分享页'}</b>
            </span>
            <span className="tool-arrow">→</span>
          </button>
          <button className="tool-row tool-danger" type="button" onClick={signOut}>
            <span className="tool-ico">{ICON.out}</span>
            <span className="tool-text">
              <b>退出登录</b>
            </span>
          </button>
        </section>
        {link && <p className="tool-link">{link}</p>}
      </div>
    </div>
  );
}
