import { useRef } from 'react';
import { uploadAvatar } from '../api';
import { compressAvatar } from '../lib/image';
import { sinceCN, pct } from '../lib/format';

export default function Hero({ data }) {
  const { days, startDate, avatars, names, milestones, stats } = data;
  const partnerBirthday = milestones.find((m) => m.title.includes(names.partner));
  const meInput = useRef(null);
  const partnerInput = useRef(null);

  async function change(who, file) {
    if (!file) return;
    const blob = await compressAvatar(file);
    const fd = new FormData();
    fd.append('who', who);
    fd.append('file', blob, 'avatar.webp');
    await uploadAvatar(fd);
    window.location.reload();
  }

  return (
    <section className="card hero-card span-2" aria-label="在一起的日子">
      <div className="hero-deco" aria-hidden="true" />
      <div className="hero-main">
        <p className="hero-kicker">在一起</p>
        <p className="hero-days">
          <b>{days}</b>
          <span>天</span>
        </p>
        <p className="hero-since">从 {sinceCN(startDate)} 起</p>
      </div>
      <div className="hero-foot">
        <div className="couple">
          <button
            className="couple-av-btn"
            type="button"
            title={`换 ${names.me} 的头像`}
            onClick={() => meInput.current && meInput.current.click()}
          >
            <img className="couple-av me" src={avatars.me} alt={`${names.me}的头像`} />
          </button>
          <button
            className="couple-av-btn"
            type="button"
            title={`换 ${names.partner} 的头像`}
            onClick={() => partnerInput.current && partnerInput.current.click()}
          >
            <img className="couple-av partner" src={avatars.partner} alt={`${names.partner}的头像`} />
          </button>
          <input
            ref={meInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => change('me', e.target.files[0])}
          />
          <input
            ref={partnerInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => change('partner', e.target.files[0])}
          />
          <span className="couple-name">
            {names.me} &amp; {names.partner}
          </span>
        </div>
        <div className="hero-mini">
          <div>
            <span>距离 {names.partner} 生日</span>
            <b>{partnerBirthday ? `${partnerBirthday.big} 天` : '—'}</b>
          </div>
          <div>
            <span>本月开心</span>
            <b>{pct(stats.monthRate)}</b>
          </div>
        </div>
      </div>
    </section>
  );
}
