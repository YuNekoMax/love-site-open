const CN_DIGITS = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const CN_MONTHS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

function yearCN(y) {
  return String(y).split('').map((d) => CN_DIGITS[Number(d)]).join('') + '年';
}

function monthCN(m) {
  return CN_MONTHS[m - 1] + '月';
}

function dayCN(d) {
  if (d < 10) return '初' + CN_DIGITS[d];
  if (d === 10) return '初十';
  if (d < 20) return '十' + CN_DIGITS[d - 10];
  if (d === 20) return '二十';
  if (d < 30) return '廿' + CN_DIGITS[d - 20];
  return d === 30 ? '三十' : '三十' + CN_DIGITS[d - 30];
}

function seasonCN(m) {
  if (m === 11 || m === 12 || m === 1 || m === 2) return '冬';
  if (m >= 3 && m <= 5) return '春';
  if (m >= 6 && m <= 8) return '夏';
  return '秋';
}

export function eyebrowCN(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${yearCN(y)} · ${seasonCN(m)} · ${monthCN(m)}${dayCN(d)}`;
}

export function entryDateCN(iso) {
  if (!iso) return '';
  const [, m, d] = iso.split('-').map(Number);
  return `${m} 月 ${d} 日`;
}

export function monthHeadCN(iso) {
  const [y, m] = String(iso).split('-').map(Number);
  if (!y || !m) return { key: 'unknown', label: '更早', year: '' };
  return { key: `${y}-${m}`, label: monthCN(m), year: String(y) };
}

export function plainText(md) {
  return String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sinceCN(startISO) {
  const d = new Date(startISO);
  const f = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false
  });
  return f.format(d);
}

export function pct(v) {
  return v === null || v === undefined ? '—' : `${v}%`;
}

export function dateCN(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso || '';
  return `${Number(m[1])} 年 ${Number(m[2])} 月 ${Number(m[3])} 日`;
}

export function nextYearCN(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const day = m === 2 && d === 29 ? 28 : d;
  return `${y + 1}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayCN() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
