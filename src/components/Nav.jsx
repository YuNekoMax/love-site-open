import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { uploadAvatar } from '../api';
import { compressAvatar } from '../lib/image';

const stroke = {
  className: 'rail-ico',
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
  tools: <svg {...stroke}><rect x="4" y="4" width="6" height="6" rx="1.6" /><rect x="14" y="4" width="6" height="6" rx="1.6" /><rect x="4" y="14" width="6" height="6" rx="1.6" /><rect x="14" y="14" width="6" height="6" rx="1.6" /></svg>
};

const ITEMS = [
  { label: '首页', to: '/', icon: ICONS.home },
  { label: '日记', to: '/diary', icon: ICONS.diary },
  { label: '相册', to: '/album', icon: ICONS.album },
  { label: '纪念日', to: '/dates', icon: ICONS.dates },
  { label: '状态', to: '/status', icon: ICONS.status, mobile: false }
];

const MOBILE_ITEMS = [
  { label: '首页', to: '/', icon: ICONS.home },
  { label: '日记', to: '/diary', icon: ICONS.diary },
  { label: '相册', to: '/album', icon: ICONS.album },
  { label: '工具', to: '/tools', icon: ICONS.tools }
];

export default function Nav({ avatar }) {
  const { pathname } = useLocation();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to));
  const TOOL_PATHS = ['/tools', '/settings', '/export', '/dates', '/status', '/capsules', '/check'];
  const isTabActive = (item) =>
    item.to === '/tools'
      ? TOOL_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
      : isActive(item.to);
  const activeIndex = MOBILE_ITEMS.findIndex(isTabActive);

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

  return (
    <>
      <aside className="rail">
        <Link className="rail-brand" to="/">
          <span className="rail-mark" aria-hidden="true">日</span>
          <span className="rail-name">恋爱日记</span>
        </Link>
        <nav className="rail-nav" aria-label="主导航">
          {ITEMS.map((item) => (
            <Link
              key={item.label}
              className={`rail-link${isActive(item.to) ? ' on' : ''}`}
              to={item.to}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="rail-foot">
          <Link className="rail-write" to="/diary" state={{ compose: true }}>
            写日记
          </Link>
          <button
            className="rail-me"
            type="button"
            onClick={() => fileRef.current && fileRef.current.click()}
            title={uploading ? '正在换…' : '换我的头像'}
          >
            {avatar ? <img src={avatar} alt="我的头像" /> : <span className="me-skel" />}
            <span>{uploading ? '正在换…' : '我的头像'}</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => changeAvatar(e.target.files[0])}
          />
        </div>
      </aside>

      <nav className="tabbar" aria-label="主导航">
        {activeIndex >= 0 && (
          <span className="tab-pill" style={{ '--i': activeIndex }} aria-hidden="true" />
        )}
        {MOBILE_ITEMS.map((item) => (
          <Link
            key={item.label}
            className={`tab${isTabActive(item) ? ' on' : ''}`}
            to={item.to}
          >
            <span className="tab-ico">{item.icon}</span>
            <span className="tab-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
