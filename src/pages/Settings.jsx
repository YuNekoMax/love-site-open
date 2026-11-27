import { useEffect, useRef, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { getMe, getDates, updateSettings, patchMilestone, createMilestone, uploadAvatar } from '../api';
import { compressAvatar } from '../lib/image';
import { readTheme, saveTheme } from '../lib/theme';

const THEMES = [
  { key: 'auto', label: '自动' },
  { key: 'light', label: '浅色' },
  { key: 'dark', label: '深色' }
];

function splitStart(iso) {
  const m = String(iso || '').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return { date: m ? m[1] : '', time: m ? m[2] : '00:00' };
}

function buildStart(date, time) {
  if (!date) return '';
  return `${date}T${time || '00:00'}:00+08:00`;
}

function isMonthDay(value) {
  return /^\d{2}-\d{2}$/.test(value);
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [me, setMe] = useState(null);
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);

  const [nameMe, setNameMe] = useState('');
  const [namePartner, setNamePartner] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('00:00');
  const [birthPartner, setBirthPartner] = useState('');
  const [birthMe, setBirthMe] = useState('');
  const [avatars, setAvatars] = useState({ me: '', partner: '' });

  const avatarInput = useRef(null);
  const avatarWho = useRef('me');
  const [uploading, setUploading] = useState('');
  const [theme, setTheme] = useState(readTheme);

  function pickTheme(mode) {
    setTheme(mode);
    saveTheme(mode);
  }

  useEffect(() => {
    let alive = true;
    Promise.all([getMe(), getDates()])
      .then(([meData, dates]) => {
        if (!alive) return;
        const start = splitStart(meData.startDate);
        const rows = dates.milestones || [];
        const her = rows.find((m) => m.kind === 'yearly' && m.title.includes(meData.names.partner));
        const mine = rows.find((m) => m.kind === 'yearly' && m.title.includes(meData.names.me));
        setMe({ ...meData, herId: her ? her.id : null, mineId: mine ? mine.id : null });
        setNameMe(meData.names.me);
        setNamePartner(meData.names.partner);
        setDate(start.date);
        setTime(start.time);
        setBirthPartner(her ? her.date : '');
        setBirthMe(mine ? mine.date : '');
        setAvatars(meData.avatars);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  function pickAvatar(who) {
    avatarWho.current = who;
    if (avatarInput.current) avatarInput.current.click();
  }

  async function changeAvatar(file) {
    if (!file) return;
    setUploading(avatarWho.current);
    try {
      const blob = await compressAvatar(file);
      const fd = new FormData();
      fd.append('who', avatarWho.current);
      fd.append('file', blob, 'avatar.webp');
      const res = await uploadAvatar(fd);
      setAvatars((prev) => ({ ...prev, [avatarWho.current]: res.url }));
      setSaved('头像换好了');
    } catch (e) {
      setSaved('头像没换成：' + e.message);
    } finally {
      setUploading('');
    }
  }

  async function save() {
    if (busy) return;
    const nextMe = nameMe.trim();
    const nextPartner = namePartner.trim();
    if (!nextMe || !nextPartner) {
      setSaved('名字不能空着');
      return;
    }
    if (birthPartner && !isMonthDay(birthPartner)) {
      setSaved('生日写成 12-17 这样的格式');
      return;
    }
    if (birthMe && !isMonthDay(birthMe)) {
      setSaved('生日写成 12-17 这样的格式');
      return;
    }
    setBusy(true);
    setSaved('');
    try {
      const startISO = buildStart(date, time);
      await updateSettings({
        name_me: nextMe,
        name_partner: nextPartner,
        ...(startISO ? { start_date: startISO } : {})
      });
      if (birthPartner) {
        if (me.herId) {
          await patchMilestone(me.herId, { title: `${nextPartner} 的生日`, date: birthPartner });
        } else {
          await createMilestone({ title: `${nextPartner} 的生日`, date: birthPartner, kind: 'yearly' });
        }
      }
      if (birthMe) {
        if (me.mineId) {
          await patchMilestone(me.mineId, { title: `${nextMe} 的生日`, date: birthMe });
        } else {
          await createMilestone({ title: `${nextMe} 的生日`, date: birthMe, kind: 'yearly' });
        }
      }
      setSaved('保存好了');
    } catch (e) {
      setSaved('没保存上：' + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <div className="in">
        <PageHeader title="设置" back="/tools" />
        {error && <p className="paper-msg tool-msg">{error}</p>}
        {loading && !error && <div className="card"><p className="paper-msg">正在读…</p></div>}
        {!loading && !error && me && (
          <>
            <section className="card set-theme">
              <span className="set-theme-label">主题</span>
              <div className="seg seg-theme" role="group" aria-label="主题模式">
                {THEMES.map((item) => (
                  <button
                    key={item.key}
                    className="seg-item"
                    type="button"
                    aria-pressed={theme === item.key}
                    onClick={() => pickTheme(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
            <section className="card settings-card">
              <div className="set-grid">
                <label className="set-field">
                  <span>我的名字</span>
                  <input className="field" value={nameMe} maxLength={12} onChange={(e) => setNameMe(e.target.value)} />
                </label>
                <label className="set-field">
                  <span>她的名字</span>
                  <input className="field" value={namePartner} maxLength={12} onChange={(e) => setNamePartner(e.target.value)} />
                </label>
              </div>

              <div className="set-avatars">
                <button className="set-avatar" type="button" onClick={() => pickAvatar('me')}>
                  <img src={avatars.me} alt="我的头像" />
                  <span>{uploading === 'me' ? '换着…' : '我的头像'}</span>
                </button>
                <button className="set-avatar" type="button" onClick={() => pickAvatar('partner')}>
                  <img src={avatars.partner} alt="她的头像" />
                  <span>{uploading === 'partner' ? '换着…' : '她的头像'}</span>
                </button>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    changeAvatar(e.target.files[0]);
                    e.target.value = '';
                  }}
                />
              </div>

              <div className="set-field">
                <span>在一起的那天</span>
                <div className="set-row">
                  <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <input className="field set-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              <div className="set-grid">
                <label className="set-field">
                  <span>她的生日</span>
                  <input
                    className="field"
                    value={birthPartner}
                    placeholder="12-17"
                    maxLength={5}
                    onChange={(e) => setBirthPartner(e.target.value)}
                  />
                </label>
                <label className="set-field">
                  <span>我的生日</span>
                  <input
                    className="field"
                    value={birthMe}
                    placeholder="01-01"
                    maxLength={5}
                    onChange={(e) => setBirthMe(e.target.value)}
                  />
                </label>
              </div>
            </section>
            {saved && <p className="tool-msg settings-msg">{saved}</p>}
            <button className="btn-primary settings-save" type="button" onClick={save} disabled={busy}>
              {busy ? '保存中…' : '保存'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
