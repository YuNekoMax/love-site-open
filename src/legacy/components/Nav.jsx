import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { uploadAvatar } from '../api';
import { compressAvatar } from '../lib/image';

const stroke = {
  className: 'nav-ico',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true
};

const ICONS = {
  home: <svg {...stroke}><path d="M3 9.5 12 3l9 6.5" /><path d="M5 8.5V20h14V8.5" /><path d="M9 20v-6h6v6" /></svg>,
  diary: <svg {...stroke}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>,
  album: <svg {...stroke}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>,
  dates: <svg {...stroke}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  status: <svg {...stroke}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>,
  pen: <svg {...stroke}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
};

const ITEMS = [
  { label: '首页', to: '/', icon: ICONS.home },
  { label: '日记', to: '/diary', icon: ICONS.diary },
  { label: '相册', to: '/album', icon: ICONS.album },
  { label: '纪念日', to: '/dates', icon: ICONS.dates },
  { label: '状态', to: '/status', icon: ICONS.status }
];

export default function Nav({ avatar }) {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navRef = useRef(null);
  const activeRef = useRef(null);
  const indRef = useRef(null);
  const fileRef = useRef(null);

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));

  async function changeAvatar(file) {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const blob = await compressAvatar(file);
      const fd = new FormData();
      fd.append('who', 'me');
      fd.append('file', blob, 'avatar.webp');
      await uploadAvatar(fd);
      window.location.reload();
    } catch (e) {
      setUploading(false);
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const place = () => {
      const nav = navRef.current;
      const active = activeRef.current;
      const ind = indRef.current;
      if (!nav || !active || !ind) return;
      const n = nav.getBoundingClientRect();
      const r = active.getBoundingClientRect();
      if (!r.width) {
        ind.style.opacity = '0';
        return;
      }
      ind.style.left = `${r.left - n.left}px`;
      ind.style.width = `${r.width}px`;
      ind.style.opacity = '1';
    };
    place();
    const t = setTimeout(place, 60);
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', place);
    };
  }, [pathname]);

  return (
    <header className={`top${scrolled ? ' is-scrolled' : ''}`}>
      <div className="top-bar">
        <Link className="brand" to="/">
          <span className="seal" aria-hidden="true">日</span>
          <span className="brand-text">恋爱日记</span>
        </Link>
        <nav className="nav-pill" ref={navRef} aria-label="主导航">
          <span className="nav-indicator" ref={indRef} aria-hidden="true"></span>
          {ITEMS.map((item) => {
            const active = isActive(item.to);
            return (
              <Link
                key={item.label}
                ref={active ? (el) => { if (el) activeRef.current = el; } : null}
                className={`nav-link${active ? ' on' : ''}`}
                to={item.to}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="top-actions">
          <Link className="write-btn" to="/diary" state={{ compose: true }}>
            {ICONS.pen}
            写日记
          </Link>
          <button
            className="me-btn"
            type="button"
            title={uploading ? '正在换…' : '换我的头像'}
            onClick={() => fileRef.current && fileRef.current.click()}
          >
            {avatar ? <img src={avatar} alt="我的头像" /> : <span className="me-skel" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => changeAvatar(e.target.files[0])}
          />
          <button
            className="menu-btn"
            type="button"
            aria-label="打开菜单"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {ICONS.menu}
          </button>
        </div>
      </div>
      <div className={`mobile-menu${open ? ' open' : ''}`}>
        {ITEMS.map((item) => (
          <Link
            key={item.label}
            className={isActive(item.to) ? 'on' : ''}
            to={item.to}
            onClick={() => setOpen(false)}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
