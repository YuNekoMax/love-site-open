import { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import { getHealth } from '../api';

const REFRESH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-2.6-6.4" />
    <path d="M21 4v5h-5" />
  </svg>
);

function detailOf(row) {
  if (!row.ok) return row.detail || row.error || '异常';
  if (row.ms != null) return `${row.ms} ms`;
  return row.detail || '正常';
}

export default function Check() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [ranAt, setRanAt] = useState('');

  async function run() {
    if (busy) return;
    setBusy(true);
    const started = performance.now();
    try {
      const health = await getHealth();
      const apiMs = Math.round(performance.now() - started);
      const next = [
        { key: 'api', label: '接口', ok: true, ms: apiMs },
        { key: 'db', label: '数据库', ...(health.db || { ok: false, detail: '没有返回' }) },
        { key: 'kv', label: '照片存储', ...(health.kv || { ok: false, detail: '没有返回' }) }
      ];
      if (health.photoKey) {
        const t = performance.now();
        let ok = false;
        let detail = '';
        try {
          const res = await fetch('/media/' + encodeURIComponent(health.photoKey));
          ok = res.ok;
          detail = ok ? '' : `HTTP ${res.status}`;
          if (res.body) res.body.cancel().catch(() => {});
        } catch (e) {
          detail = e.message;
        }
        next.push({ key: 'photo', label: '最近的照片', ok, ms: Math.round(performance.now() - t), detail });
      } else {
        next.push({ key: 'photo', label: '最近的照片', ok: true, detail: '还没有照片' });
      }
      setRows(next);
      setRanAt(
        new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    } catch (e) {
      setRows([{ key: 'api', label: '接口', ok: false, detail: e.message }]);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allOk = rows.length > 0 && rows.every((row) => row.ok);
  const summary = busy ? '正在体检…' : !rows.length ? '' : allOk ? `全部正常${ranAt ? ` · ${ranAt}` : ''}` : '有项目不正常';

  return (
    <div className="page">
      <div className="in">
        <PageHeader
          title="站点体检"
          back="/tools"
          action={
            <button className="round-btn" type="button" aria-label="重新体检" onClick={run} disabled={busy}>
              {REFRESH_ICON}
            </button>
          }
        />
        <section className="card check-card">
          {rows.map((row) => (
            <div className="check-row" key={row.key}>
              <span className={`check-dot ${row.ok ? 'ok' : 'bad'}`} aria-hidden="true" />
              <span className="check-label">{row.label}</span>
              <span className={`check-detail${row.ok ? '' : ' bad'}`}>{detailOf(row)}</span>
            </div>
          ))}
          {summary && <p className="check-sum">{summary}</p>}
        </section>
      </div>
    </div>
  );
}
