import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { createEntry, updateEntry, deletePhoto, uploadPhoto } from '../api';
import { compressPhoto, compressThumb } from '../lib/image';
import { todayCN } from '../lib/format';

export default function Composer({ entry, onSaved, onCancel }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(todayCN());
  const [files, setFiles] = useState([]);
  const [existing, setExisting] = useState([]);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setTitle(entry ? entry.title : '');
    setBody(entry ? entry.body_md : '');
    setDate(entry ? entry.entry_date : todayCN());
    setExisting(entry && entry.photos ? entry.photos : []);
    setFiles([]);
    setMsg('');
    setPreview(false);
  }, [entry]);

  const previewHtml = useMemo(
    () => ({ __html: DOMPurify.sanitize(marked.parse(body || '')) }),
    [body]
  );

  function addFiles(list) {
    const items = Array.from(list).map((file) => ({ file, url: URL.createObjectURL(file) }));
    setFiles((prev) => [...prev, ...items]);
  }

  function removeFile(index) {
    setFiles((prev) => {
      const next = [...prev];
      const [gone] = next.splice(index, 1);
      if (gone) URL.revokeObjectURL(gone.url);
      return next;
    });
  }

  async function removeExisting(photo) {
    await deletePhoto(photo.id);
    setExisting((prev) => prev.filter((p) => p.id !== photo.id));
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setMsg('');
    try {
      const payload = { title, body_md: body, entry_date: date };
      let id = entry ? entry.id : null;
      if (id) {
        await updateEntry(id, payload);
      } else {
        const res = await createEntry(payload);
        id = res.id;
      }
      for (const item of files) {
        const [full, thumb] = await Promise.all([
          compressPhoto(item.file),
          compressThumb(item.file)
        ]);
        const fd = new FormData();
        fd.append('file', full, 'photo.webp');
        fd.append('thumb', thumb, 'photo-thumb.webp');
        fd.append('entry_id', String(id));
        await uploadPhoto(fd);
      }
      files.forEach((f) => URL.revokeObjectURL(f.url));
      setFiles([]);
      setMsg('已经收好了');
      if (onSaved) onSaved();
    } catch (e) {
      setMsg('保存失败：' + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="paper">
      <input
        className="paper-title"
        placeholder="给今天起个名字"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="paper-meta">
        <input
          className="paper-date"
          type="date"
          value={date}
          aria-label="日记日期"
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="paper-toggle"
          type="button"
          onClick={() => setPreview((v) => !v)}
        >
          {preview ? '写' : '预览'}
        </button>
      </div>
      {preview ? (
        <div
          className="paper-body paper-preview markdown"
          dangerouslySetInnerHTML={previewHtml}
        />
      ) : (
        <textarea
          className="paper-body paper-textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="今天想写点什么…"
        />
      )}
      <div className="paper-foot">
        <div className="paper-tools">
          {existing.map((photo) => (
            <div className="photo-chip" key={photo.id}>
              <img src={`/media/${photo.thumb_key || photo.r2_key}`} alt="" />
              <button type="button" onClick={() => removeExisting(photo)} aria-label="删除照片">
                ×
              </button>
            </div>
          ))}
          {files.map((item, index) => (
            <div className="photo-chip" key={item.url}>
              <img src={item.url} alt="" />
              <button type="button" onClick={() => removeFile(index)} aria-label="移除照片">
                ×
              </button>
            </div>
          ))}
          <label className="photo-add">
            <span>+</span>
            照片
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
        </div>
        <div className="paper-actions">
          {msg && <span className="paper-msg">{msg}</span>}
          {onCancel && (
            <button className="text-btn muted" type="button" onClick={onCancel}>
              取消
            </button>
          )}
          <button className="btn-primary" type="button" onClick={save} disabled={busy}>
            {busy ? '保存中…' : entry ? '保存修改' : '收进今天'}
          </button>
        </div>
      </div>
    </div>
  );
}
