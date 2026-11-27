import { useState } from 'react';
import { zip, strToU8 } from 'fflate';
import PageHeader from '../components/PageHeader';
import { getMe, getEntries, getPhotos, getDates, getStatus, getCapsules } from '../api';
import { todayCN } from '../lib/format';

async function collect() {
  const [me, entries, photos, dates, status, capsules] = await Promise.all([
    getMe(),
    getEntries(),
    getPhotos(),
    getDates(),
    getStatus(),
    getCapsules()
  ]);
  return {
    exportedAt: new Date().toISOString(),
    me,
    entries,
    photos,
    dates,
    status,
    capsules
  };
}

function save(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

const ICON = {
  json: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M9 14h6M9 17h4" />
    </svg>
  ),
  zip: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
      <path d="M3 8h18M12 3v5M9 11h6M9 15h6M9 19h6" />
    </svg>
  )
};

export default function Export() {
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  async function exportJson() {
    if (busy) return;
    setBusy('数据');
    setMsg('');
    try {
      const data = await collect();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      save(blob, `恋爱日记-数据-${todayCN()}.json`);
      setMsg('数据已经下载了');
    } catch (e) {
      setMsg('导出失败：' + e.message);
    } finally {
      setBusy('');
    }
  }

  async function exportZip() {
    if (busy) return;
    setBusy('准备中…');
    setMsg('');
    try {
      const data = await collect();
      const photos = data.photos.photos || [];
      const files = { 'backup.json': strToU8(JSON.stringify(data, null, 2)) };
      let skipped = 0;
      for (let i = 0; i < photos.length; i++) {
        setBusy(`照片 ${i + 1} / ${photos.length}`);
        const photo = photos[i];
        try {
          const res = await fetch('/media/' + encodeURIComponent(photo.r2_key));
          if (!res.ok) throw new Error('missing');
          const buf = new Uint8Array(await res.arrayBuffer());
          files[`photos/${photo.taken_at || 'unknown'}/${photo.id}.webp`] = buf;
        } catch (e) {
          skipped += 1;
        }
      }
      setBusy('打包中…');
      const packed = await new Promise((resolve, reject) => {
        zip(files, { level: 0 }, (err, out) => (err ? reject(err) : resolve(out)));
      });
      save(new Blob([packed], { type: 'application/zip' }), `恋爱日记-完整备份-${todayCN()}.zip`);
      setMsg(skipped ? `打包好了，有 ${skipped} 张照片没取到` : '打包好了');
    } catch (e) {
      setMsg('打包失败：' + e.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="page">
      <div className="in">
        <PageHeader title="导出" back="/tools" />
        {msg && <p className="paper-msg tool-msg">{msg}</p>}
        <section className="card export-card">
          <div className="export-row">
            <span className="tool-ico">{ICON.json}</span>
            <span className="tool-text">
              <b>数据备份</b>
            </span>
            <button className="btn-primary sm" type="button" onClick={exportJson} disabled={!!busy}>
              导出
            </button>
          </div>
          <div className="export-row">
            <span className="tool-ico">{ICON.zip}</span>
            <span className="tool-text">
              <b>完整备份</b>
            </span>
            <button className="btn-primary sm" type="button" onClick={exportZip} disabled={!!busy}>
              打包
            </button>
          </div>
          {busy && <p className="export-progress">{busy}</p>}
        </section>
      </div>
    </div>
  );
}
