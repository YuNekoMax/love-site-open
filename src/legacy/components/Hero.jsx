import { useRef } from 'react';
import { uploadAvatar } from '../api';
import { compressAvatar } from '../lib/image';
import { eyebrowCN, sinceCN, pct } from '../lib/format';

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
    <section className="hero" id="home">
      <div className="in hero-grid">
        <div className="hero-copy">
          <p className="eyebrow">{eyebrowCN(data.today)}</p>
          <h1>
            和你的
            <br />
            <span className="big">{days}</span>
            <span className="unit">天</span>
          </h1>
          <p className="lede">
            把平常的日子收起来，偶尔翻一翻。
            <br />
            今天也想见你。
          </p>
          <p className="since">从 {sinceCN(startDate)} 开始</p>
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
        </div>
        <figure className="polaroid">
          <svg viewBox="0 0 600 800" role="img" aria-label="雪夜的窗，窗台上亮着一盏灯">
            <rect width="600" height="800" fill="#222836" />
            <circle cx="450" cy="180" r="46" fill="#E9E3D3" opacity=".9" />
            <circle cx="150" cy="140" r="4" fill="#E9E3D3" opacity=".9" />
            <circle cx="210" cy="230" r="3" fill="#E9E3D3" opacity=".7" />
            <circle cx="120" cy="320" r="3.5" fill="#E9E3D3" opacity=".8" />
            <circle cx="390" cy="120" r="3" fill="#E9E3D3" opacity=".75" />
            <circle cx="470" cy="300" r="3.5" fill="#E9E3D3" opacity=".7" />
            <circle cx="300" cy="200" r="2.5" fill="#E9E3D3" opacity=".6" />
            <circle cx="200" cy="420" r="3" fill="#E9E3D3" opacity=".6" />
            <rect x="100" y="90" width="400" height="500" rx="2" fill="none" stroke="#151A24" strokeWidth="12" />
            <line x1="300" y1="90" x2="300" y2="590" stroke="#151A24" strokeWidth="12" />
            <line x1="100" y1="340" x2="500" y2="340" stroke="#151A24" strokeWidth="12" />
            <rect x="60" y="590" width="480" height="20" fill="#1B202B" />
            <rect x="160" y="520" width="36" height="70" rx="4" fill="#C99A5F" />
            <circle cx="178" cy="510" r="46" fill="#C99A5F" opacity=".15" />
            <rect x="176" y="506" width="4" height="16" fill="#1B202B" />
          </svg>
          <figcaption>雪夜 · 十一月</figcaption>
        </figure>
      </div>
      <div className="in stats">
        <div className="stat">
          <b>{days}</b>
          <span>在一起</span>
        </div>
        <div className="stat">
          <b>{partnerBirthday ? partnerBirthday.big : '—'}</b>
          <span>距离 {names.partner} 生日</span>
        </div>
        <div className="stat">
          <b>{pct(stats.monthRate)}</b>
          <span>本月开心率</span>
        </div>
      </div>
    </section>
  );
}
