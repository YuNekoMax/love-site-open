import { Readable } from 'node:stream';
import { existsSync, readFileSync } from 'node:fs';
import {
  cnDateStr,
  addDays,
  dayNumber,
  diffDays,
  shapeMilestones,
  statsFor,
  questionOfDay
} from './functions/_lib/calc.js';

function loadLocal() {
  const base = { start: '2024-01-01T00:00:00+08:00', partnerBirthday: '01-01', meBirthday: '01-01' };
  try {
    const file = new URL('./dev-data.json', import.meta.url);
    if (existsSync(file)) {
      return { ...base, ...JSON.parse(readFileSync(file, 'utf8')) };
    }
  } catch (e) { /* ignore */ }
  return base;
}

const LOCAL = loadLocal();
let START = LOCAL.start;
const today = cnDateStr();
const NAMES = { me: '你', partner: 'TA' };
const AVATARS = { me: '/avatars/me.svg', partner: '/avatars/partner.svg' };

const youMoods = ['h','h','h','u','h','h','h','s','h','h','h','h','h','h','h','u','s','h','h','h','h','u','h','s','h','h','s','u','h','-'];
const checkins = [];
youMoods.forEach((mood, i) => {
  if (mood !== '-') checkins.push({ member: 'me', date: addDays(today, -29 + i), mood });
});

let wishes = [
  { id: 1, text: '一起看一次日落', done: 1 },
  { id: 2, text: '一起去看一次日出', done: 0 },
  { id: 3, text: '一起吃遍学校门口的小店', done: 0 },
  { id: 4, text: '一起拍一组像样的照片', done: 0 },
  { id: 5, text: '一起去看一次海', done: 0 },
  { id: 6, text: '一起写满一本日记', done: 0 }
];

let entries = [
  {
    id: 3,
    kind: 'diary',
    title: '第一条日记',
    body_md: '今天开始把日子记在这里，先从很普通的一天开始。',
    entry_date: addDays(today, -1),
    photos: []
  },
  {
    id: 2,
    kind: 'diary',
    title: '周末的小事',
    body_md: '一起买了菜，回来做了顿饭。没什么特别，但想留着。',
    entry_date: addDays(today, -7),
    photos: []
  },
  {
    id: 1,
    kind: 'diary',
    title: '',
    body_md: '「今天也还不错。」',
    entry_date: addDays(today, -16),
    photos: []
  }
];

const photos = [];
const mediaStore = new Map();

let milestones = [
  { id: 1, title: '在一起', date: START.slice(0, 10), kind: 'since', sort: 1 },
  { id: 2, title: 'TA 的生日', date: LOCAL.partnerBirthday, kind: 'yearly', sort: 2 },
  { id: 3, title: '你的生日', date: LOCAL.meBirthday, kind: 'yearly', sort: 3 }
];

let capsules = [
  {
    id: 3,
    member: 'partner',
    title: '写给以后的一天',
    body_md: '等这一天打开的时候，希望我们都还记得今天。',
    open_date: addDays(today, -3),
    created_at: addDays(today, -40)
  },
  {
    id: 2,
    member: 'me',
    title: '',
    body_md: '写一封给将来的信，等那天再拆。',
    open_date: addDays(today, 20),
    created_at: today
  },
  {
    id: 1,
    member: 'partner',
    title: '写给一年后的我们',
    body_md: '一年后的今天，我们会在哪里呢？',
    open_date: addDays(today, 365),
    created_at: today
  }
];
let nextCapsuleId = 10;

let answer = null;
let nextEntryId = 100;
let nextPhotoId = 1;
let nextMilestoneId = 10;
const shares = new Map();
const challenges = new Map();
const sessions = new Set();
const AUTO_LOGIN = process.env.DEV_AUTOLOGIN === '1';
if (AUTO_LOGIN) sessions.add('dev');
const LOCAL_USER = { me: 'me', partner: 'partner' };
const LOCAL_PASS = 'love';

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return '';
}

function buildQuestions() {
  const start = new Date(START);
  const list = [
    {
      id: 'start',
      kind: 'date',
      text: '我们是在哪天在一起的？（月-日，比如 05-20）',
      answer: `${start.getMonth() + 1}-${start.getDate()}`
    },
    { id: 'partner', kind: 'date', text: 'TA 的生日是几月几号？（月-日）', answer: LOCAL.partnerBirthday },
    { id: 'me', kind: 'date', text: '你的生日是几月几号？（月-日）', answer: LOCAL.meBirthday },
    { id: 'days', kind: 'num', text: '今天是在一起的第几天？', answer: String(dayNumber(START, today)) }
  ];
  return list;
}

function normalizeAnswer(value, kind) {
  const digits = String(value == null ? '' : value).replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (kind === 'date') return digits.length > 4 ? digits.slice(-4) : digits.padStart(4, '0');
  return digits.replace(/^0+/, '') || '0';
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch (e) { resolve({}); }
    });
  });
}

async function readForm(req) {
  const webReq = new Request('http://localhost' + req.url, {
    method: req.method,
    headers: req.headers,
    body: Readable.toWeb(req),
    duplex: 'half'
  });
  return webReq.formData();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function memberView() {
  const me = statsFor(checkins, 'me', today);
  const partner = statsFor(checkins, 'partner', today);
  return {
    stats: {
      weekRate: me.weekRate,
      monthRate: me.monthRate,
      monthCount: me.monthCount,
      monthDays: me.monthDays,
      streak: me.streak
    },
    members: [
      { id: 'me', name: NAMES.me, avatar: AVATARS.me, series: me.series, rate: me.rate },
      { id: 'partner', name: NAMES.partner, avatar: AVATARS.partner, series: partner.series, rate: partner.rate }
    ]
  };
}

function base() {
  return {
    me: 'me',
    today,
    names: NAMES,
    avatars: AVATARS,
    startDate: START,
    days: dayNumber(START, today)
  };
}

function meData() {
  return base();
}

function homeData() {
  const views = memberView();
  return {
    ...base(),
    stats: views.stats,
    members: views.members,
    todayCheckins: checkins.filter((c) => c.date === today),
    question: questionOfDay(today),
    answer,
    entries: entries.slice(0, 3),
    milestones: shapeMilestones(milestones, START, today)
  };
}

function datesData() {
  const views = memberView();
  return {
    ...base(),
    members: views.members,
    milestones: shapeMilestones(milestones, START, today),
    wishes
  };
}

function statusData() {
  const views = memberView();
  return {
    ...base(),
    stats: views.stats,
    members: views.members,
    todayCheckins: checkins.filter((c) => c.date === today)
  };
}

function saveMedia(key, file) {
  return file.arrayBuffer().then((buf) => {
    mediaStore.set(key, { buf: Buffer.from(buf), type: file.type || 'image/webp' });
  });
}

export function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');

        if (url.pathname.startsWith('/media/')) {
          const key = decodeURIComponent(url.pathname.slice(7));
          const item = mediaStore.get(key);
          if (!item) {
            res.statusCode = 404;
            res.end('not found');
            return;
          }
          res.statusCode = 200;
          res.setHeader('content-type', item.type);
          res.setHeader('cache-control', 'no-store');
          res.end(item.buf);
          return;
        }

        if (!url.pathname.startsWith('/api/')) return next();

        const p = url.pathname.slice(4);
        const method = req.method;
        const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
        const body = method === 'GET' ? {} : isMultipart ? null : await readBody(req);
        let payload;

        const isAuth = p.startsWith('/auth/');
        if (!isAuth && !AUTO_LOGIN && !sessions.has(getCookie(req, 'love_session'))) {
          res.statusCode = 401;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'unauthorized' }));
          return;
        }

        await sleep(method === 'GET' ? 420 : 220);

        if (p === '/auth/config' && method === 'GET') {
          payload = { turnstileSiteKey: '' };
        } else if (p === '/auth/challenge' && method === 'GET') {
          const list = buildQuestions();
          const q = list[Math.floor(Math.random() * list.length)];
          const token = crypto.randomUUID();
          challenges.set(token, { q: q.id, exp: Date.now() + 600000 });
          payload = { question: q.text, token };
        } else if (p === '/auth/login' && method === 'POST') {
          const challenge = challenges.get(body.token);
          const q = challenge ? buildQuestions().find((x) => x.id === challenge.q) : null;
          const okAnswer =
            q && normalizeAnswer(body.answer, q.kind) === normalizeAnswer(q.answer, q.kind);
          const member = Object.keys(LOCAL_USER).find((k) => LOCAL_USER[k] === body.username);
          const okAccount = member && body.password === LOCAL_PASS;
          if (!challenge || challenge.exp < Date.now() || !okAnswer || !okAccount) {
            payload = { error: 'unauthorized' };
          } else {
            challenges.delete(body.token);
            const sid = crypto.randomUUID();
            sessions.add(sid);
            res.setHeader(
              'set-cookie',
              `love_session=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
            );
            payload = { ok: true, member };
          }
        } else if (p === '/auth/logout' && method === 'POST') {
          sessions.delete(getCookie(req, 'love_session'));
          res.setHeader('set-cookie', 'love_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
          payload = { ok: true };
        } else if (p === '/me' && method === 'GET') {
          payload = meData();
        } else if (p === '/home' && method === 'GET') {
          payload = homeData();
        } else if (p === '/entries' && method === 'GET') {
          payload = { entries };
        } else if (p === '/entries' && method === 'POST') {
          const title = String(body.title || '').trim().slice(0, 120);
          const bodyMd = String(body.body_md || '').slice(0, 20000);
          const date = /^\d{4}-\d{2}-\d{2}$/.test(body.entry_date || '') ? body.entry_date : today;
          if (!title && !bodyMd) {
            payload = { error: 'empty entry' };
          } else {
            const entry = { id: nextEntryId++, kind: 'diary', title, body_md: bodyMd, entry_date: date, photos: [] };
            entries.unshift(entry);
            payload = { id: entry.id };
          }
        } else if (p.startsWith('/entries/') && method === 'PUT') {
          const id = Number(p.split('/')[2]);
          const entry = entries.find((e) => e.id === id);
          if (!entry) {
            payload = { error: 'not found' };
          } else {
            entry.title = String(body.title || '').trim().slice(0, 120);
            entry.body_md = String(body.body_md || '').slice(0, 20000);
            entry.entry_date = /^\d{4}-\d{2}-\d{2}$/.test(body.entry_date || '') ? body.entry_date : today;
            entries.sort((a, b) => (a.entry_date < b.entry_date ? 1 : a.entry_date > b.entry_date ? -1 : b.id - a.id));
            payload = { id };
          }
        } else if (p.startsWith('/entries/') && method === 'DELETE') {
          const id = Number(p.split('/')[2]);
          entries = entries.filter((e) => e.id !== id);
          payload = { ok: true };
        } else if (p === '/photos' && method === 'GET') {
          payload = { photos };
        } else if (p === '/photos' && method === 'POST') {
          const form = await readForm(req);
          const file = form.get('file');
          const thumb = form.get('thumb');
          const entryId = Number(form.get('entry_id')) || null;
          if (!file) {
            payload = { error: 'no file' };
          } else {
            const id = nextPhotoId++;
            const key = `photos/local/${id}.webp`;
            const thumbKey = `photos/local/${id}-thumb.webp`;
            await saveMedia(key, file);
            await saveMedia(thumbKey, thumb && thumb.size ? thumb : file);
            const photo = { id, entry_id: entryId, r2_key: key, thumb_key: thumbKey, taken_at: today };
            photos.unshift(photo);
            const entry = entries.find((e) => e.id === entryId);
            if (entry) entry.photos.push(photo);
            payload = photo;
          }
        } else if (p.startsWith('/photos/') && method === 'DELETE') {
          const id = Number(p.split('/')[2]);
          const idx = photos.findIndex((x) => x.id === id);
          if (idx >= 0) {
            photos.splice(idx, 1);
            entries.forEach((e) => { e.photos = e.photos.filter((x) => x.id !== id); });
          }
          payload = { ok: true };
        } else if (p === '/avatar' && method === 'POST') {
          const form = await readForm(req);
          const who = form.get('who') === 'partner' ? 'partner' : 'me';
          const file = form.get('file');
          if (!file) {
            payload = { error: 'no file' };
          } else {
            const key = `avatars/${who}.webp`;
            await saveMedia(key, file);
            const avatarUrl = `/media/${key}?v=${Date.now()}`;
            AVATARS[who] = avatarUrl;
            payload = { url: avatarUrl };
          }
        } else if (p === '/dates' && method === 'GET') {
          payload = datesData();
        } else if (p === '/status' && method === 'GET') {
          payload = statusData();
        } else if (p === '/health' && method === 'GET') {
          payload = {
            ok: true,
            now: new Date().toISOString(),
            db: { ok: true, ms: 1 },
            kv: { ok: true, ms: 0, hasValue: false },
            photoKey: photos[0] ? photos[0].thumb_key : null,
            ms: 2
          };
        } else if (p === '/capsules' && method === 'GET') {
          payload = {
            me: 'me',
            today,
            capsules: capsules.map((c) => {
              const open = c.open_date <= today;
              return {
                ...c,
                open,
                days: open ? 0 : diffDays(today, c.open_date),
                title: open ? c.title : '',
                body_md: open ? c.body_md : ''
              };
            })
          };
        } else if (p === '/capsules' && method === 'POST') {
          const title = String(body.title || '').trim().slice(0, 60);
          const bodyMd = String(body.body_md || '').slice(0, 10000);
          const openDate = /^\d{4}-\d{2}-\d{2}$/.test(body.open_date || '') ? body.open_date : '';
          if (!bodyMd.trim() || !openDate || openDate < today) {
            payload = { error: 'invalid capsule' };
          } else {
            const item = {
              id: nextCapsuleId++,
              member: 'me',
              title,
              body_md: bodyMd,
              open_date: openDate,
              created_at: today
            };
            capsules.unshift(item);
            payload = { id: item.id };
          }
        } else if (p.startsWith('/capsules/') && method === 'DELETE') {
          const id = Number(p.split('/')[2]);
          capsules = capsules.filter((c) => c.id !== id);
          payload = { ok: true };
        } else if (p === '/checkin' && method === 'POST') {
          const rating = ['h', 'u', 's'].includes(body.mood) ? body.mood : null;
          if (!rating) {
            payload = { error: 'invalid mood' };
          } else {
            const existing = checkins.find((c) => c.member === 'me' && c.date === today);
            if (existing) existing.mood = rating;
            else checkins.push({ member: 'me', date: today, mood: rating });
            payload = homeData();
          }
        } else if (p === '/answer' && method === 'POST') {
          const text = String(body.answer || '').trim().slice(0, 500);
          if (!text) {
            payload = { error: 'empty answer' };
          } else {
            answer = { date: today, question: questionOfDay(today), answer: text };
            payload = homeData();
          }
        } else if (p.startsWith('/wishes/') && method === 'PATCH') {
          const id = Number(p.split('/')[2]);
          const wish = wishes.find((w) => w.id === id);
          if (wish) wish.done = body.done ? 1 : 0;
          payload = { wishes };
        } else if (p.startsWith('/wishes/') && method === 'DELETE') {
          const id = Number(p.split('/')[2]);
          wishes = wishes.filter((w) => w.id !== id);
          payload = { wishes };
        } else if (p === '/wishes' && method === 'POST') {
          const text = String(body.text || '').trim();
          if (!text) {
            payload = { error: 'empty wish' };
          } else {
            wishes.push({ id: Date.now(), text, done: 0 });
            payload = { wishes };
          }
        } else if (p === '/milestones' && method === 'POST') {
          const title = String(body.title || '').trim().slice(0, 60);
          const date = String(body.date || '').trim().slice(0, 10);
          const kind = body.kind === 'yearly' ? 'yearly' : 'since';
          if (!title || !date) {
            payload = { error: 'missing fields' };
          } else {
            const item = { id: nextMilestoneId++, title, date, kind, sort: 9 };
            milestones.push(item);
            payload = { id: item.id };
          }
        } else if (p.startsWith('/milestones/') && method === 'PATCH') {
          const id = Number(p.split('/')[2]);
          const item = milestones.find((m) => m.id === id);
          if (!item) {
            payload = { error: 'not found' };
          } else {
            if (body.title !== undefined) item.title = String(body.title).trim().slice(0, 60);
            if (body.date !== undefined) item.date = String(body.date).trim().slice(0, 10);
            if (body.kind !== undefined) item.kind = body.kind === 'yearly' ? 'yearly' : 'since';
            payload = { ok: true };
          }
        } else if (p.startsWith('/milestones/') && method === 'DELETE') {
          const id = Number(p.split('/')[2]);
          milestones = milestones.filter((m) => m.id !== id);
          payload = { ok: true };
        } else if (p === '/settings' && method === 'PUT') {
          if (body.name_me !== undefined) NAMES.me = String(body.name_me).slice(0, 120);
          if (body.name_partner !== undefined) NAMES.partner = String(body.name_partner).slice(0, 120);
          if (body.start_date !== undefined) START = String(body.start_date).slice(0, 120);
          payload = { ok: true };
        } else if (p === '/share' && method === 'POST') {
          const code = Math.random().toString(36).slice(2, 8);
          shares.set(code, { days: dayNumber(START, today), since: START.slice(0, 10) });
          payload = { code, url: `https://example.com/s/${code}` };
        } else {
          payload = { error: 'not found' };
        }

        res.statusCode = payload.error ? 400 : 200;
        res.setHeader('content-type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(payload));
      });
    }
  };
}
