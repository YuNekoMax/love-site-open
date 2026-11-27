import {
  cnDateStr,
  addDays,
  dayNumber,
  diffDays,
  shapeMilestones,
  statsFor,
  questionOfDay
} from './_lib/calc.js';

const DEFAULT_START = '2024-01-01T00:00:00+08:00';
const COOKIE = 'love_session';
const enc = new TextEncoder();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers }
  });
const bad = (msg, status = 400) => json({ error: msg }, status);

function b64url(bytes) {
  let s = '';
  const view = new Uint8Array(bytes);
  for (const b of view) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function hmac(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

async function signToken(secret, payload) {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(secret, body)}`;
}

async function verifyToken(secret, token) {
  if (!secret || !token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  const expect = await hmac(secret, body);
  if (sig !== expect) return null;
  try {
    return JSON.parse(b64urlDecode(body));
  } catch (e) {
    return null;
  }
}

async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function getCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return rest.join('=');
  }
  return '';
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.startsWith('/s/')) return sharePage(env, path.slice(3));

  if (path.startsWith('/api/auth/')) return authApi(context);

  if (path.startsWith('/media/')) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;
    return media(env, decodeURIComponent(path.slice(7)));
  }

  if (path.startsWith('/api/')) {
    const auth = await authenticate(request, env);
    if (auth.error) return auth.error;
    return api(context, auth.member);
  }

  return context.next();
}

async function authenticate(request, env) {
  const host = new URL(request.url).hostname;
  const dev = host === 'localhost' || host === '127.0.0.1';
  if (!dev && host !== env.SITE_DOMAIN) {
    return { error: json({ error: 'forbidden host' }, 403) };
  }
  if (dev) return { member: 'me' };
  const token = getCookie(request, COOKIE);
  const session = token ? await verifyToken(env.AUTH_SECRET, token) : null;
  if (session && session.m && session.exp > Date.now()) {
    return { member: session.m };
  }
  return { error: json({ error: 'unauthorized' }, 401) };
}

async function loadSettings(env) {
  const rows = await env.DB.prepare('SELECT key, value FROM settings').all();
  const map = {};
  for (const r of rows.results) map[r.key] = r.value;
  return map;
}

async function common(env, member) {
  const today = cnDateStr();
  const settings = await loadSettings(env);
  const startISO = settings.start_date || DEFAULT_START;
  const names = { me: settings.name_me || '你', partner: settings.name_partner || 'TA' };
  const avatars = {
    me: settings.avatar_me || '/avatars/me.svg',
    partner: settings.avatar_partner || '/avatars/partner.svg'
  };
  return { member, today, startISO, names, avatars, days: dayNumber(startISO, today) };
}

async function authApi(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const p = url.pathname.replace(/^\/api\/auth/, '') || '/';
  const method = request.method;

  if (p === '/config' && method === 'GET') {
    return json({ turnstileSiteKey: '' });
  }

  if (p === '/challenge' && method === 'GET') {
    if (!env.AUTH_SECRET) return bad('not configured', 500);
    const list = await buildQuestions(env);
    const q = list[Math.floor(Math.random() * list.length)];
    const token = await signToken(env.AUTH_SECRET, {
      q: q.id,
      n: crypto.randomUUID(),
      exp: Date.now() + 10 * 60 * 1000
    });
    return json({ question: q.text, token });
  }

  if (p === '/login' && method === 'POST') {
    if (!env.AUTH_SECRET) return bad('not configured', 500);
    const body = await request.json().catch(() => ({}));
    await sleep(450);
    const challenge = body.token ? await verifyToken(env.AUTH_SECRET, body.token) : null;
    if (!challenge || !challenge.q || challenge.exp < Date.now()) {
      return bad('challenge expired', 400);
    }
    const list = await buildQuestions(env);
    const q = list.find((item) => item.id === challenge.q);
    if (!q || normalizeAnswer(body.answer, q.kind) !== normalizeAnswer(q.answer, q.kind)) {
      return bad('unauthorized', 401);
    }
    const member = await checkAccount(env, body.username, body.password);
    if (!member) return bad('unauthorized', 401);
    const exp = Date.now() + 30 * 86400000;
    const token = await signToken(env.AUTH_SECRET, { m: member, exp });
    return json({ ok: true, member }, 200, {
      'set-cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
    });
  }

  if (p === '/logout' && method === 'POST') {
    return json({ ok: true }, 200, {
      'set-cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
    });
  }

  return bad('not found', 404);
}

async function buildQuestions(env) {
  const c = await common(env, 'me');
  const rows = await env.DB.prepare('SELECT title, date, kind FROM milestones').all();
  const list = [];
  const start = new Date(c.startISO);
  list.push({
    id: 'start',
    kind: 'date',
    text: '我们是在哪天在一起的？（月-日，比如 05-20）',
    answer: `${start.getMonth() + 1}-${start.getDate()}`
  });
  const partnerRow = rows.results.find((r) => r.kind === 'yearly' && r.title.includes(c.names.partner));
  const meRow = rows.results.find((r) => r.kind === 'yearly' && r.title.includes(c.names.me));
  if (partnerRow) {
    list.push({
      id: 'partner',
      kind: 'date',
      text: `${c.names.partner} 的生日是几月几号？（月-日）`,
      answer: partnerRow.date
    });
  }
  if (meRow) {
    list.push({
      id: 'me',
      kind: 'date',
      text: `${c.names.me} 的生日是几月几号？（月-日）`,
      answer: meRow.date
    });
  }
  list.push({
    id: 'days',
    kind: 'num',
    text: '今天是在一起的第几天？',
    answer: String(dayNumber(c.startISO, c.today))
  });
  return list;
}

function normalizeAnswer(value, kind) {
  const digits = String(value == null ? '' : value).replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (kind === 'date') {
    return digits.length > 4 ? digits.slice(-4) : digits.padStart(4, '0');
  }
  return digits.replace(/^0+/, '') || '0';
}

async function checkAccount(env, username, password) {
  const user = String(username || '').trim();
  const pass = String(password || '');
  if (!user || !pass) return null;
  const hash = await sha256hex((env.AUTH_SALT || '') + pass);
  const pairs = [
    { user: env.ACCOUNT_ME_USER, hash: env.ACCOUNT_ME_HASH, member: 'me' },
    { user: env.ACCOUNT_PARTNER_USER, hash: env.ACCOUNT_PARTNER_HASH, member: 'partner' }
  ];
  for (const pair of pairs) {
    if (pair.user && pair.hash && pair.user === user && pair.hash === hash) {
      return pair.member;
    }
  }
  return null;
}

async function loadCheckins(env, today) {
  const since = addDays(today, -59);
  const res = await env.DB.prepare(
    'SELECT member, date, mood FROM checkins WHERE date >= ? ORDER BY date'
  ).bind(since).all();
  return res.results;
}

async function loadEntries(env, limit) {
  const res = await env.DB.prepare(
    'SELECT id, kind, title, body_md, entry_date FROM entries ORDER BY entry_date DESC, id DESC LIMIT ?'
  ).bind(limit).all();
  const entries = res.results;
  const ids = entries.map((e) => e.id);
  let photos = [];
  if (ids.length) {
    const ph = await env.DB.prepare(
      `SELECT id, entry_id, r2_key, thumb_key, taken_at FROM photos WHERE entry_id IN (${ids.map(() => '?').join(',')})`
    ).bind(...ids).all();
    photos = ph.results;
  }
  const byEntry = {};
  for (const p of photos) {
    (byEntry[p.entry_id] = byEntry[p.entry_id] || []).push(p);
  }
  return entries.map((e) => ({ ...e, photos: byEntry[e.id] || [] }));
}

function memberView(checkins, c) {
  const me = statsFor(checkins, 'me', c.today);
  const partner = statsFor(checkins, 'partner', c.today);
  return {
    stats: {
      weekRate: me.weekRate,
      monthRate: me.monthRate,
      monthCount: me.monthCount,
      monthDays: me.monthDays,
      streak: me.streak
    },
    members: [
      { id: 'me', name: c.names.me, avatar: c.avatars.me, series: me.series, rate: me.rate },
      { id: 'partner', name: c.names.partner, avatar: c.avatars.partner, series: partner.series, rate: partner.rate }
    ]
  };
}

async function homeData(env, member) {
  const c = await common(env, member);
  const [checkins, entries, msRes, answer] = await Promise.all([
    loadCheckins(env, c.today),
    loadEntries(env, 3),
    env.DB.prepare('SELECT id, title, date, kind, sort FROM milestones ORDER BY sort, id').all(),
    env.DB.prepare('SELECT date, question, answer FROM answers WHERE member = ? AND date = ?')
      .bind(member, c.today).first()
  ]);
  const views = memberView(checkins, c);
  return {
    me: member,
    today: c.today,
    names: c.names,
    avatars: c.avatars,
    startDate: c.startISO,
    days: c.days,
    stats: views.stats,
    members: views.members,
    todayCheckins: checkins.filter((x) => x.date === c.today),
    question: questionOfDay(c.today),
    answer: answer || null,
    entries,
    milestones: shapeMilestones(msRes.results, c.startISO, c.today)
  };
}

async function datesData(env, member) {
  const c = await common(env, member);
  const [checkins, msRes, wishRes] = await Promise.all([
    loadCheckins(env, c.today),
    env.DB.prepare('SELECT id, title, date, kind, sort FROM milestones ORDER BY sort, id').all(),
    env.DB.prepare('SELECT id, text, done FROM wishes ORDER BY done, id').all()
  ]);
  const views = memberView(checkins, c);
  return {
    me: member,
    today: c.today,
    names: c.names,
    avatars: c.avatars,
    startDate: c.startISO,
    days: c.days,
    members: views.members,
    milestones: shapeMilestones(msRes.results, c.startISO, c.today),
    wishes: wishRes.results
  };
}

async function statusData(env, member) {
  const c = await common(env, member);
  const checkins = await loadCheckins(env, c.today);
  const views = memberView(checkins, c);
  return {
    me: member,
    today: c.today,
    names: c.names,
    avatars: c.avatars,
    stats: views.stats,
    members: views.members,
    todayCheckins: checkins.filter((x) => x.date === c.today)
  };
}

async function capsulesData(env, member) {
  const today = cnDateStr();
  const rows = await env.DB.prepare(
    'SELECT id, member, title, body_md, open_date, created_at FROM capsules ORDER BY open_date, id'
  ).all();
  const capsules = rows.results.map((row) => {
    const open = row.open_date <= today;
    return {
      id: row.id,
      member: row.member,
      open_date: row.open_date,
      created_at: row.created_at,
      open,
      days: open ? 0 : diffDays(today, row.open_date),
      title: open ? row.title : '',
      body_md: open ? row.body_md : ''
    };
  });
  return { me: member, today, capsules };
}

async function healthData(env) {
  const started = Date.now();
  const out = { ok: true, now: new Date().toISOString(), db: null, kv: null, photoKey: null };

  try {
    const t = Date.now();
    await env.DB.prepare('SELECT 1 AS ok').first();
    out.db = { ok: true, ms: Date.now() - t };
    const last = await env.DB.prepare('SELECT thumb_key FROM photos ORDER BY id DESC LIMIT 1').first();
    out.photoKey = last ? last.thumb_key : null;
  } catch (e) {
    out.ok = false;
    out.db = { ok: false, error: String(e.message || e).slice(0, 120) };
  }

  if (!env.PHOTOS) {
    out.ok = false;
    out.kv = { ok: false, error: 'PHOTOS 未绑定' };
  } else {
    try {
      const t = Date.now();
      const value = await env.PHOTOS.get('__health__');
      out.kv = { ok: true, ms: Date.now() - t, hasValue: value !== null };
    } catch (e) {
      out.ok = false;
      out.kv = { ok: false, error: String(e.message || e).slice(0, 120) };
    }
  }

  out.ms = Date.now() - started;
  return out;
}

async function api(ctx, member) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const p = url.pathname.replace(/^\/api/, '') || '/';
  const method = request.method;

  if (p === '/me' && method === 'GET') {
    const c = await common(env, member);
    return json({
      me: member, today: c.today, names: c.names, avatars: c.avatars,
      startDate: c.startISO, days: c.days
    });
  }

  if (p === '/home' && method === 'GET') return json(await homeData(env, member));

  if (p === '/entries' && method === 'GET') {
    const limit = Math.min(50, Number(url.searchParams.get('limit') || 30));
    return json({ entries: await loadEntries(env, limit) });
  }

  if (p === '/entries' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim().slice(0, 120);
    const bodyMd = String(body.body_md || '').slice(0, 20000);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(body.entry_date || '') ? body.entry_date : cnDateStr();
    if (!title && !bodyMd) return bad('empty entry');
    const res = await env.DB.prepare(
      `INSERT INTO entries (kind, title, body_md, entry_date) VALUES ('diary', ?, ?, ?)`
    ).bind(title, bodyMd, date).run();
    return json({ id: res.meta.last_row_id });
  }

  if (p.startsWith('/entries/') && method === 'PUT') {
    const id = Number(p.split('/')[2]);
    if (!id) return bad('invalid id');
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim().slice(0, 120);
    const bodyMd = String(body.body_md || '').slice(0, 20000);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(body.entry_date || '') ? body.entry_date : cnDateStr();
    await env.DB.prepare(
      `UPDATE entries SET title = ?, body_md = ?, entry_date = ?, updated_at = datetime('now') WHERE id = ?`
    ).bind(title, bodyMd, date, id).run();
    return json({ id });
  }

  if (p.startsWith('/entries/') && method === 'DELETE') {
    const id = Number(p.split('/')[2]);
    if (!id) return bad('invalid id');
    const photos = await env.DB.prepare(
      'SELECT r2_key, thumb_key FROM photos WHERE entry_id = ?'
    ).bind(id).all();
    if (env.PHOTOS) {
      for (const ph of photos.results) {
        await env.PHOTOS.delete(ph.r2_key);
        if (ph.thumb_key) await env.PHOTOS.delete(ph.thumb_key);
      }
    }
    await env.DB.prepare('DELETE FROM photos WHERE entry_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM entries WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  if (p === '/photos' && method === 'GET') {
    const rows = await env.DB.prepare(
      'SELECT id, entry_id, r2_key, thumb_key, taken_at, created_at FROM photos ORDER BY id DESC LIMIT 200'
    ).all();
    return json({ photos: rows.results });
  }

  if (p === '/photos' && method === 'POST') {
    if (!env.PHOTOS) return bad('no storage', 500);
    const form = await request.formData();
    const file = form.get('file');
    const thumb = form.get('thumb');
    const entryId = Number(form.get('entry_id')) || null;
    if (!(file instanceof File)) return bad('no file');
    const id = crypto.randomUUID();
    const now = new Date();
    const prefix = `photos/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
    const key = `${prefix}/${id}.webp`;
    const thumbKey = `${prefix}/${id}-thumb.webp`;
    await env.PHOTOS.put(key, await file.arrayBuffer(), {
      metadata: { contentType: file.type || 'image/webp' }
    });
    const thumbFile = thumb instanceof File ? thumb : file;
    await env.PHOTOS.put(thumbKey, await thumbFile.arrayBuffer(), {
      metadata: { contentType: thumbFile.type || 'image/webp' }
    });
    const res = await env.DB.prepare(
      'INSERT INTO photos (entry_id, r2_key, thumb_key, taken_at) VALUES (?, ?, ?, ?)'
    ).bind(entryId, key, thumbKey, cnDateStr()).run();
    return json({ id: res.meta.last_row_id, r2_key: key, thumb_key: thumbKey });
  }

  if (p.startsWith('/photos/') && method === 'DELETE') {
    const id = Number(p.split('/')[2]);
    if (!id) return bad('invalid id');
    const row = await env.DB.prepare('SELECT r2_key, thumb_key FROM photos WHERE id = ?').bind(id).first();
    if (row) {
      if (env.PHOTOS) {
        await env.PHOTOS.delete(row.r2_key);
        if (row.thumb_key) await env.PHOTOS.delete(row.thumb_key);
      }
      await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(id).run();
    }
    return json({ ok: true });
  }

  if (p === '/avatar' && method === 'POST') {
    if (!env.PHOTOS) return bad('no storage', 500);
    const form = await request.formData();
    const who = form.get('who') === 'partner' ? 'partner' : 'me';
    const file = form.get('file');
    if (!(file instanceof File)) return bad('no file');
    const key = `avatars/${who}.webp`;
    await env.PHOTOS.put(key, await file.arrayBuffer(), {
      metadata: { contentType: file.type || 'image/webp' }
    });
    const avatarUrl = `/media/${key}?v=${Date.now()}`;
    await env.DB.prepare(
      `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    ).bind(who === 'me' ? 'avatar_me' : 'avatar_partner', avatarUrl).run();
    return json({ url: avatarUrl });
  }

  if (p === '/dates' && method === 'GET') return json(await datesData(env, member));

  if (p === '/status' && method === 'GET') return json(await statusData(env, member));

  if (p === '/health' && method === 'GET') return json(await healthData(env));

  if (p === '/capsules' && method === 'GET') return json(await capsulesData(env, member));

  if (p === '/capsules' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim().slice(0, 60);
    const bodyMd = String(body.body_md || '').slice(0, 10000);
    const openDate = /^\d{4}-\d{2}-\d{2}$/.test(body.open_date || '') ? body.open_date : '';
    if (!bodyMd.trim()) return bad('empty capsule');
    if (!openDate) return bad('invalid date');
    if (openDate < cnDateStr()) return bad('date in past');
    const res = await env.DB.prepare(
      'INSERT INTO capsules (member, title, body_md, open_date) VALUES (?, ?, ?, ?)'
    ).bind(member, title, bodyMd, openDate).run();
    return json({ id: res.meta.last_row_id });
  }

  if (p.startsWith('/capsules/') && method === 'DELETE') {
    const id = Number(p.split('/')[2]);
    if (!id) return bad('invalid id');
    await env.DB.prepare('DELETE FROM capsules WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  if (p === '/checkin' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    if (!['h', 'u', 's'].includes(body.mood)) return bad('invalid mood');
    const today = cnDateStr();
    await env.DB.prepare(
      `INSERT INTO checkins (member, date, mood, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(member, date) DO UPDATE SET mood = excluded.mood, updated_at = datetime('now')`
    ).bind(member, today, body.mood).run();
    return json(await homeData(env, member));
  }

  if (p === '/answer' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const text = String(body.answer || '').trim().slice(0, 500);
    if (!text) return bad('empty answer');
    const today = cnDateStr();
    const q = questionOfDay(today);
    await env.DB.prepare(
      `INSERT INTO answers (member, date, question, answer) VALUES (?, ?, ?, ?)
       ON CONFLICT(member, date) DO UPDATE SET answer = excluded.answer, question = excluded.question`
    ).bind(member, today, q, text).run();
    return json(await homeData(env, member));
  }

  if (p === '/wishes' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const text = String(body.text || '').trim().slice(0, 200);
    if (!text) return bad('empty wish');
    await env.DB.prepare('INSERT INTO wishes (text) VALUES (?)').bind(text).run();
    const rows = await env.DB.prepare('SELECT id, text, done FROM wishes ORDER BY done, id').all();
    return json({ wishes: rows.results });
  }

  if (p.startsWith('/wishes/') && method === 'PATCH') {
    const id = Number(p.split('/')[2]);
    if (!id) return bad('invalid id');
    const body = await request.json().catch(() => ({}));
    await env.DB.prepare('UPDATE wishes SET done = ? WHERE id = ?').bind(body.done ? 1 : 0, id).run();
    const rows = await env.DB.prepare('SELECT id, text, done FROM wishes ORDER BY done, id').all();
    return json({ wishes: rows.results });
  }

  if (p.startsWith('/wishes/') && method === 'DELETE') {
    const id = Number(p.split('/')[2]);
    if (!id) return bad('invalid id');
    await env.DB.prepare('DELETE FROM wishes WHERE id = ?').bind(id).run();
    const rows = await env.DB.prepare('SELECT id, text, done FROM wishes ORDER BY done, id').all();
    return json({ wishes: rows.results });
  }

  if (p === '/milestones' && method === 'POST') {
    const body = await request.json().catch(() => ({}));
    const title = String(body.title || '').trim().slice(0, 60);
    const date = String(body.date || '').trim().slice(0, 10);
    const kind = body.kind === 'yearly' ? 'yearly' : 'since';
    if (!title || !date) return bad('missing fields');
    const res = await env.DB.prepare(
      'INSERT INTO milestones (title, date, kind, sort) VALUES (?, ?, ?, 9)'
    ).bind(title, date, kind).run();
    return json({ id: res.meta.last_row_id });
  }

  if (p.startsWith('/milestones/') && method === 'PATCH') {
    const id = Number(p.split('/')[2]);
    if (!id) return bad('invalid id');
    const body = await request.json().catch(() => ({}));
    const sets = [];
    const values = [];
    if (body.title !== undefined) {
      const title = String(body.title).trim().slice(0, 60);
      if (!title) return bad('invalid title');
      sets.push('title = ?');
      values.push(title);
    }
    if (body.date !== undefined) {
      const date = String(body.date).trim().slice(0, 10);
      if (!date) return bad('invalid date');
      sets.push('date = ?');
      values.push(date);
    }
    if (body.kind !== undefined) {
      sets.push('kind = ?');
      values.push(body.kind === 'yearly' ? 'yearly' : 'since');
    }
    if (!sets.length) return bad('no fields');
    await env.DB.prepare(`UPDATE milestones SET ${sets.join(', ')} WHERE id = ?`).bind(...values, id).run();
    return json({ ok: true });
  }

  if (p.startsWith('/milestones/') && method === 'DELETE') {
    const id = Number(p.split('/')[2]);
    if (!id) return bad('invalid id');
    await env.DB.prepare('DELETE FROM milestones WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  if (p === '/settings' && method === 'PUT') {
    const body = await request.json().catch(() => ({}));
    const allowed = ['name_me', 'name_partner', 'start_date'];
    const stmts = [];
    for (const key of allowed) {
      if (body[key] !== undefined) {
        stmts.push(
          env.DB.prepare(
            `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`
          ).bind(key, String(body[key]).slice(0, 120))
        );
      }
    }
    if (stmts.length) await env.DB.batch(stmts);
    return json({ ok: true });
  }

  if (p === '/share' && method === 'POST') {
    const c = await common(env, member);
    const code = makeCode();
    const payload = JSON.stringify({ days: c.days, since: c.startISO.slice(0, 10) });
    await env.DB.prepare('INSERT INTO shares (code, payload) VALUES (?, ?)').bind(code, payload).run();
    return json({ code, url: `https://${env.SITE_DOMAIN}/s/${code}` });
  }

  return bad('not found', 404);
}

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 6);
}

async function media(env, key) {
  if (!env.PHOTOS) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.PHOTOS.getWithMetadata(key, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(value, {
    headers: {
      'content-type': (metadata && metadata.contentType) || 'application/octet-stream',
      'cache-control': 'private, max-age=86400'
    }
  });
}

async function sharePage(env, code) {
  const row = await env.DB.prepare('SELECT payload FROM shares WHERE code = ?').bind(code).first();
  if (!row) {
    return new Response('这张卡已经找不到了。', {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8' }
    });
  }
  let data = {};
  try {
    data = JSON.parse(row.payload);
  } catch (e) {
    data = {};
  }
  return new Response(shareHtml(data), {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function shareHtml(data) {
  const days = Number(data.days) || 0;
  const since = String(data.since || '').replace(/[^0-9.-]/g, '');
  const sinceText = since.replace(/-/g, '.');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>第 ${days} 天 · 恋爱日记</title>
<style>
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: #0B0E14;
    color: #EDE6D6;
    font-family: -apple-system, "PingFang SC", "Noto Sans SC", sans-serif;
    -webkit-tap-highlight-color: transparent;
  }
  .cover {
    position: relative;
    min-height: 100vh;
    min-height: 100svh;
    display: grid;
    place-items: center;
    overflow: hidden;
    padding: 84px 28px 72px;
  }
  .scene { position: absolute; inset: 0; width: 100%; height: 100%; }
  .stars i {
    position: absolute;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: #EDE6D6;
    animation: twinkle linear infinite;
  }
  .snow i {
    position: absolute;
    top: -12px;
    border-radius: 50%;
    background: #EDE6D6;
    pointer-events: none;
    animation: fall linear infinite;
  }
  .cover-text { position: relative; z-index: 1; margin-top: -6vh; text-align: center; }
  .cover-text > * {
    opacity: 0;
    animation: rise 1s cubic-bezier(.22, .61, .36, 1) forwards;
  }
  .cover-text > :nth-child(1) { animation-delay: .25s; }
  .cover-text > :nth-child(2) { animation-delay: .45s; }
  .cover-text > :nth-child(3) { animation-delay: .7s; }
  .cover-text > :nth-child(4) { animation-delay: .9s; }
  .cover-text > :nth-child(5) { animation-delay: 1.05s; }
  .kicker {
    margin: 0;
    font-size: 11px;
    letter-spacing: .34em;
    color: rgba(237, 230, 214, .55);
  }
  .big {
    margin: 16px 0 0;
    font-family: "Songti SC", Georgia, "Noto Serif CJK SC", serif;
    font-weight: 500;
    font-size: clamp(104px, 30vw, 140px);
    line-height: .88;
    letter-spacing: -.02em;
    color: #F3EDE1;
    text-shadow: 0 10px 50px rgba(0, 0, 0, .45);
    font-variant-numeric: tabular-nums;
  }
  .big span {
    margin-left: 12px;
    font-size: 20px;
    letter-spacing: .12em;
    color: rgba(237, 230, 214, .5);
  }
  .since {
    margin: 20px 0 0;
    font-size: 12px;
    letter-spacing: .22em;
    color: rgba(237, 230, 214, .5);
  }
  .rule {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    width: 110px;
    margin: 32px auto 0;
  }
  .rule::before, .rule::after {
    content: "";
    flex: 1;
    height: 1px;
    background: rgba(237, 230, 214, .18);
  }
  .rule i {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #C9837C;
    opacity: .85;
  }
  .line {
    margin: 24px 0 0;
    font-family: "Songti SC", Georgia, serif;
    font-size: 17px;
    letter-spacing: .16em;
    color: rgba(243, 237, 225, .92);
  }
  .hint {
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 30px);
    margin: 0;
    text-align: center;
    font-size: 10px;
    letter-spacing: .32em;
    color: rgba(237, 230, 214, .32);
    animation: hintPulse 3s ease-in-out infinite;
  }
  .letter {
    position: relative;
    padding: 170px 28px calc(env(safe-area-inset-bottom, 0px) + 110px);
    background: #F7F4EE;
    color: #26221C;
  }
  .letter::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 170px;
    background: linear-gradient(to bottom, #0B0E14, #F7F4EE);
  }
  .letter-inner {
    position: relative;
    max-width: 360px;
    margin: 0 auto;
    text-align: center;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 1s ease, transform 1s cubic-bezier(.22, .61, .36, 1);
  }
  .letter-inner.in { opacity: 1; transform: none; }
  .mark {
    width: 42px;
    height: 42px;
    margin: 0 auto 26px;
    display: grid;
    place-items: center;
    border: 1px solid #A3564F;
    border-radius: 11px;
    color: #A3564F;
    font-family: "Songti SC", Georgia, serif;
    font-size: 19px;
    font-weight: 600;
    transform: rotate(-3deg);
  }
  .letter-kicker {
    margin: 0 0 24px;
    font-size: 11px;
    letter-spacing: .26em;
    color: #8A8177;
  }
  .letter-body {
    margin: 0;
    font-family: "Songti SC", Georgia, "Noto Serif CJK SC", serif;
    font-size: 16px;
    line-height: 2.15;
    letter-spacing: .06em;
  }
  .letter-sign {
    margin: 52px 0 0;
    font-size: 10.5px;
    letter-spacing: .22em;
    color: #8A8177;
  }
  .shooting {
    position: fixed;
    width: 90px;
    height: 1px;
    background: linear-gradient(90deg, rgba(237, 230, 214, 0), rgba(237, 230, 214, .9));
    transform: rotate(28deg);
    transform-origin: left center;
    pointer-events: none;
    z-index: 3;
    animation: shoot 1.4s ease-out forwards;
  }
  @keyframes rise {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes twinkle {
    0%, 100% { opacity: .12; }
    50% { opacity: .85; }
  }
  @keyframes fall {
    to { transform: translateY(110vh); }
  }
  @keyframes hintPulse {
    0%, 100% { opacity: .3; }
    50% { opacity: .7; }
  }
  @keyframes shoot {
    from { opacity: 0; transform: translate(0, 0) rotate(28deg); }
    15% { opacity: 1; }
    to { opacity: 0; transform: translate(230px, 120px) rotate(28deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    .cover-text > * { animation: none; opacity: 1; }
    .stars, .snow { display: none; }
    .hint { animation: none; }
    .letter-inner { opacity: 1; transform: none; transition: none; }
  }
</style>
</head>
<body>
  <section class="cover" id="cover">
    <svg class="scene" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#252E40" />
          <stop offset=".5" stop-color="#161C27" />
          <stop offset="1" stop-color="#0B0E14" />
        </linearGradient>
        <radialGradient id="moonGlow">
          <stop offset="0" stop-color="#EDE6D6" stop-opacity=".5" />
          <stop offset="1" stop-color="#EDE6D6" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="lampGlow">
          <stop offset="0" stop-color="#D9A96A" stop-opacity=".55" />
          <stop offset="1" stop-color="#D9A96A" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="390" height="844" fill="url(#sky)" />
      <circle cx="300" cy="148" r="118" fill="url(#moonGlow)" />
      <circle cx="300" cy="148" r="34" fill="#EDE6D6" />
      <circle cx="288" cy="140" r="5" fill="#D8CFBC" opacity=".55" />
      <circle cx="310" cy="158" r="3.5" fill="#D8CFBC" opacity=".45" />
      <path d="M0 566 L62 524 L112 552 L172 508 L232 548 L306 516 L390 554 V844 H0Z" fill="#111723" opacity=".95" />
      <path d="M0 646 L84 604 L154 634 L236 598 L314 638 L390 612 V844 H0Z" fill="#0C1018" />
      <rect x="296" y="644" width="40" height="30" fill="#0A0D13" />
      <rect x="304" y="651" width="11" height="13" fill="#D9A96A" opacity=".9" />
      <circle cx="309" cy="657" r="22" fill="url(#lampGlow)" />
      <circle cx="331" cy="657" r="7" fill="#E8C98C" />
      <path d="M0 706 Q195 680 390 706 V844 H0Z" fill="#090C12" />
      <ellipse cx="195" cy="728" rx="190" ry="24" fill="#EDE6D6" opacity=".035" />
      <path d="M312 690 q16 -10 32 0" stroke="#0A0D13" stroke-width="9" fill="none" stroke-linecap="round" />
    </svg>
    <div class="stars" id="stars" aria-hidden="true"></div>
    <div class="snow" id="snow" aria-hidden="true"></div>
    <div class="cover-text">
      <p class="kicker">恋爱日记</p>
      <h1 class="big">${days}<span>天</span></h1>
      <p class="since">从 ${sinceText} 起</p>
      <div class="rule" aria-hidden="true"><i></i></div>
      <p class="line">今天也想见你。</p>
    </div>
    <p class="hint">向下滑</p>
  </section>

  <section class="letter">
    <div class="letter-inner">
      <div class="mark" aria-hidden="true">日</div>
      <p class="letter-kicker">从那天起</p>
      <p class="letter-body">把平常的日子收起来，<br>偶尔翻一翻。</p>
      <p class="letter-sign">两个人的记录站</p>
    </div>
  </section>

  <script>
    (function () {
      var stars = document.getElementById('stars');
      for (var i = 0; i < 54; i++) {
        var s = document.createElement('i');
        s.style.left = (Math.random() * 100) + '%';
        s.style.top = (Math.random() * 60) + '%';
        s.style.animationDuration = (2.4 + Math.random() * 4) + 's';
        s.style.animationDelay = (-Math.random() * 6) + 's';
        s.style.opacity = (0.15 + Math.random() * 0.5).toFixed(2);
        stars.appendChild(s);
      }
      var snow = document.getElementById('snow');
      for (var j = 0; j < 30; j++) {
        var f = document.createElement('i');
        var size = 2 + Math.random() * 3;
        f.style.left = (Math.random() * 100) + '%';
        f.style.width = size + 'px';
        f.style.height = size + 'px';
        f.style.opacity = (0.15 + Math.random() * 0.4).toFixed(2);
        f.style.animationDuration = (12 + Math.random() * 14) + 's';
        f.style.animationDelay = (-Math.random() * 24) + 's';
        snow.appendChild(f);
      }
      var cover = document.getElementById('cover');
      cover.addEventListener('click', function () {
        var star = document.createElement('div');
        star.className = 'shooting';
        star.style.left = (10 + Math.random() * 55) + '%';
        star.style.top = (6 + Math.random() * 18) + '%';
        document.body.appendChild(star);
        setTimeout(function () { star.remove(); }, 1500);
      });
      var inner = document.querySelector('.letter-inner');
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) inner.classList.add('in');
          });
        }, { threshold: 0.25 }).observe(inner);
      } else {
        inner.classList.add('in');
      }
    })();
  </script>
</body>
</html>`;
}
