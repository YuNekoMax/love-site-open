import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { getMe } from './api';
import Nav from './components/Nav';
import Skeleton from './components/Skeleton';
import Login from './components/Login';
import Home from './pages/Home';
import Diary from './pages/Diary';
import Album from './pages/Album';
import Dates from './pages/Dates';
import Status from './pages/Status';
import Tools from './pages/Tools';
import Settings from './pages/Settings';
import Export from './pages/Export';
import Capsules from './pages/Capsules';
import Check from './pages/Check';
import LegacyMount from './legacy/Mount';
import LegacyApp from './legacy/LegacyApp';
import LegacyNav from './legacy/components/Nav';
import LegacyLogin from './legacy/components/Login';
import LegacySkeleton from './legacy/components/Skeleton';

const DESKTOP_QUERY = '(min-width: 960px)';

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e) => setDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return desktop;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function groupOf(pathname) {
  if (pathname === '/') return 0;
  if (pathname.startsWith('/diary')) return 1;
  if (pathname.startsWith('/album')) return 2;
  return 3;
}

function MobileApp({ me }) {
  const location = useLocation();
  const prevGroup = useRef(null);
  const group = groupOf(location.pathname);
  const dir = prevGroup.current == null || prevGroup.current === group ? 0 : group > prevGroup.current ? 1 : -1;

  useEffect(() => {
    prevGroup.current = group;
  }, [group]);

  return (
    <>
      <Nav avatar={me.avatars[me.me]} />
      <main className="app-main">
        <div className="app-view" data-dir={dir} key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/diary" element={<Diary />} />
            <Route path="/album" element={<Album />} />
            <Route path="/dates" element={<Dates />} />
            <Route path="/status" element={<Status />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/export" element={<Export />} />
            <Route path="/capsules" element={<Capsules />} />
            <Route path="/check" element={<Check />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

function DesktopApp({ me }) {
  const { pathname } = useLocation();
  const avatar = me.avatars[me.me];
  if (pathname.startsWith('/album')) {
    return (
      <>
        <LegacyMount>
          <LegacyNav avatar={avatar} />
        </LegacyMount>
        <div className="desktop-album">
          <Album />
        </div>
      </>
    );
  }
  return (
    <LegacyMount>
      <LegacyApp avatar={avatar} />
    </LegacyMount>
  );
}

export default function App() {
  const [me, setMe] = useState(null);
  const [checked, setChecked] = useState(false);
  const isDesktop = useIsDesktop();

  function loadMe() {
    getMe()
      .then((data) => setMe(data))
      .catch(() => setMe(null))
      .finally(() => setChecked(true));
  }

  useEffect(() => {
    loadMe();
  }, []);

  if (!checked) {
    if (isDesktop) {
      return (
        <LegacyMount>
          <LegacySkeleton variant="home" />
        </LegacyMount>
      );
    }
    return (
      <div className="boot">
        <div className="page">
          <div className="in">
            <Skeleton variant="home" />
          </div>
        </div>
      </div>
    );
  }

  if (!me) {
    return isDesktop ? (
      <LegacyMount>
        <LegacyLogin onSuccess={loadMe} />
      </LegacyMount>
    ) : (
      <Login onSuccess={loadMe} />
    );
  }

  return (
    <BrowserRouter>
      <ScrollToTop />
      {isDesktop ? <DesktopApp me={me} /> : <MobileApp me={me} />}
    </BrowserRouter>
  );
}
