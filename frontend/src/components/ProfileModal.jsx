import { useEffect, useRef, useState } from 'react';
import { AtSign, Camera, Mail, X } from 'lucide-react';
import Avatar from './Avatar';
import { getAuthToken, updateProfileApi } from '../services/api';

export default function ProfileModal({ onClose, user, onUpdateUser }) {
  const dialog = useRef(null);
  const [name, setName] = useState(user.fullName || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!dialog.current.open) dialog.current.showModal(); }, []);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function save(event) {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    const token = getAuthToken();
    try {
      const result = await updateProfileApi(name.trim(), file);
      if (getAuthToken() !== token) return;
      if (!result.success) throw new Error(result.message || 'Không thể lưu hồ sơ.');
      onUpdateUser({ ...user, fullName: result.data.fullName, avatar: result.data.avatarUrl, avatarUrl: result.data.avatarUrl });
      onClose();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const Identifier = user.username ? AtSign : Mail;
  return <dialog ref={dialog} aria-labelledby="profile-modal-title"
    onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}
    className="m-auto w-[92vw] max-w-lg max-h-[90dvh] overflow-hidden rounded-2xl bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/60 dark:bg-slate-900 dark:text-slate-100">
    <form onSubmit={save} className="flex max-h-[90dvh] flex-col">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-700">
        <div><h2 id="profile-modal-title" className="text-xl font-bold">Chỉnh sửa hồ sơ</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Cập nhật họ tên và ảnh đại diện.</p></div>
        <button type="button" className="secondary-button" aria-label="Đóng chỉnh sửa hồ sơ" onClick={onClose} disabled={saving}><X className="h-4 w-4" /></button>
      </header>
      <div className="min-h-0 overflow-y-auto p-5 space-y-4">
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <Avatar src={file ? preview : user.avatar || user.avatarUrl} name={name} className="h-20 w-20 text-2xl" />
          <div className="space-y-2">
            <label className="secondary-button cursor-pointer focus-within:ring-2 focus-within:ring-blue-600">
              <Camera className="h-4 w-4" />Đổi ảnh
              <input type="file" className="sr-only" accept="image/png,image/jpeg" disabled={saving} onChange={event => {
                const next = event.target.files?.[0];
                if (!next) return;
                if (!['image/png', 'image/jpeg'].includes(next.type) || next.size > 2 * 1024 * 1024) {
                  setError('Hãy chọn ảnh JPG hoặc PNG tối đa 2 MB.');
                  event.target.value = '';
                  return;
                }
                setError(''); setPreview(''); setFile(next);
              }} />
            </label>
            <p className="text-xs text-slate-600 dark:text-slate-300">JPG hoặc PNG · tối đa 2 MB</p>
          </div>
        </div>
        <label className="form-label">Họ và tên<input required maxLength={255} autoComplete="name" className="field" value={name} onChange={e => setName(e.target.value)} /></label>
        <div className="flex items-center gap-2 break-all rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
          <Identifier className="h-4 w-4 shrink-0" />{user.username || user.email}
        </div>
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
        <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>Hủy</button>
        <button type="submit" className="primary-button" disabled={saving || !name.trim()}>{saving ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
      </footer>
    </form>
  </dialog>;
}
