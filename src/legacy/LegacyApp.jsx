import { useLocation, Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Diary from './pages/Diary';
import Dates from './pages/Dates';
import Status from './pages/Status';

export default function LegacyApp({ avatar }) {
  const location = useLocation();
  return (
    <>
      <Nav avatar={avatar} />
      <div className="page-shell" key={location.pathname}>
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/album" element={null} />
          <Route path="/dates" element={<Dates />} />
          <Route path="/status" element={<Status />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <footer>两个人的记录站</footer>
    </>
  );
}
