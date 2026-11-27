export const TZ = 'Asia/Shanghai';
export const MOOD_LABEL = { h: '开心', u: '不知道', s: '不开心' };
export const QUESTIONS = [
  '今天最想记住的瞬间是什么？',
  '今天有没有哪一刻，觉得还好有你？',
  '今天她做的哪件小事让你笑了？',
  '今天想对明天说一句什么？',
  '今天有没有偷偷想她？',
  '今天最想再经历一次的是什么？',
  '今天有什么想说但没说的？'
];

const pad = (n) => String(n).padStart(2, '0');

export function cnDateStr(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + n * 86400000);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function diffDays(a, b) {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

export function dayNumber(startISO, todayStr) {
  return diffDays(cnDateStr(new Date(startISO)), todayStr) + 1;
}

export function nextYearly(monthDay, todayStr) {
  const [m, d] = monthDay.split('-').map(Number);
  const y = Number(todayStr.slice(0, 4));
  let target = `${y}-${pad(m)}-${pad(d)}`;
  if (target < todayStr) target = `${y + 1}-${pad(m)}-${pad(d)}`;
  return { date: target, daysLeft: diffDays(todayStr, target) };
}

export function questionOfDay(todayStr) {
  const [y, m, d] = todayStr.split('-').map(Number);
  const idx = Math.floor(Date.UTC(y, m - 1, d) / 86400000) % QUESTIONS.length;
  return QUESTIONS[idx];
}

export function rateOf(list) {
  let h = 0, s = 0;
  for (const v of list) {
    if (v === 'h') h++;
    else if (v === 's') s++;
  }
  return h + s ? Math.round((h / (h + s)) * 100) : null;
}

export function statsFor(checkins, member, todayStr) {
  const mine = {};
  for (const c of checkins) {
    if (c.member === member) mine[c.date] = c.mood;
  }
  const series = [];
  for (let i = 29; i >= 0; i--) {
    const date = addDays(todayStr, -i);
    series.push({ date, mood: mine[date] || '-' });
  }
  const last7 = series.slice(-7).map((x) => x.mood);
  const monthStart = `${todayStr.slice(0, 7)}-01`;
  const monthMoods = series.filter((x) => x.date >= monthStart).map((x) => x.mood);
  let streak = 0;
  for (let i = 0; i < 60; i++) {
    const d = addDays(todayStr, -i);
    const mood = mine[d];
    if (mood === 's') break;
    if (mood === 'h') streak++;
  }
  return {
    series,
    rate: rateOf(series.map((x) => x.mood)),
    weekRate: rateOf(last7),
    monthRate: rateOf(monthMoods),
    monthCount: monthMoods.filter((v) => v !== '-').length,
    monthDays: series.filter((x) => x.date >= monthStart).length,
    streak
  };
}

export function shapeMilestones(rows, startISO, todayStr) {
  const out = rows.map((m) => {
    if (m.kind === 'since') {
      const n = dayNumber(m.date, todayStr);
      return { id: m.id, title: m.title, kind: 'since', date: m.date, big: n, unit: '天', sub: m.date };
    }
    const nb = nextYearly(m.date, todayStr);
    return {
      id: m.id, title: m.title, kind: 'yearly', date: m.date,
      big: nb.daysLeft, unit: '天', sub: `${m.date} · 每年`
    };
  });
  const target = addDays(cnDateStr(new Date(startISO)), 99);
  out.push({
    id: 'day100',
    title: '第 100 天', kind: 'milestone', date: target,
    big: diffDays(todayStr, target), unit: '天',
    sub: `${target} · 已走过 ${dayNumber(startISO, todayStr)} 天`,
    progress: Math.min(100, Math.round((dayNumber(startISO, todayStr) / 100) * 100))
  });
  return out;
}
