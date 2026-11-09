import { useEffect, useState } from 'react';
import { Bell, Clock, Download, Lock, Moon } from 'lucide-react';
import usePreferencesDraft from '../hooks/usePreferencesDraft';
import { changePasswordApi, getPasswordStatusApi } from '../services/api';
import { exportStudyData } from '../lib/exportStudyData';

const zones = [
  ['Asia/Ho_Chi_Minh', 'Việt Nam (UTC+7)'],
  ['Asia/Singapore', 'Singapore (UTC+8)'],
  ['Asia/Tokyo', 'Nhật Bản (UTC+9)'],
  ['Europe/London', 'Luân Đôn'],
  ['America/New_York', 'New York'],
  ['UTC', 'UTC'],
];

function PasswordSettings({ onLinkGoogle, canLinkGoogle }) {
  const [hasPassword, setHasPassword] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    getPasswordStatusApi().then(result => {
      if (active && result.success) setHasPassword(result.data);
      else if (active) setStatus('Chưa tải được trạng thái mật khẩu.');
    });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    setStatus(''); setLoading(true);
    try {
      const result = await changePasswordApi(hasPassword ? currentPassword : null, newPassword);
      if (!result.success) throw new Error(result.data?.newPassword || result.message || 'Không thể đổi mật khẩu.');
      setCurrentPassword(''); setNewPassword(''); setHasPassword(true);
      setStatus('Đã lưu mật khẩu mới.');
    } catch (error) { setStatus(error.message); }
    finally { setLoading(false); }
  }

  return <section className="surface p-5 space-y-4">
    <h3 className="flex items-center gap-2 text-lg font-bold"><Lock className="h-5 w-5" />Bảo mật</h3>
    {hasPassword !== null && <form className="space-y-3" onSubmit={save}>
      {hasPassword && <label className="form-label">Mật khẩu hiện tại<input className="field max-w-sm" type="password" autoComplete="current-password"
        required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>}
      <label className="form-label">Mật khẩu mới<input className="field max-w-sm" type="password" autoComplete="new-password"
        required minLength={8} maxLength={72} value={newPassword} onChange={e => setNewPassword(e.target.value)} /></label>
      <p className="text-sm text-slate-600 dark:text-slate-300">Ít nhất 8 ký tự, gồm chữ hoa, chữ số và ký tự đặc biệt (@$!%*?&amp;).</p>
      <button type="submit" className="primary-button" disabled={loading || !newPassword || hasPassword && !currentPassword}>
        {loading ? 'Đang lưu…' : hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'}
      </button>
    </form>}
    {status && <p role="status" className="text-sm text-slate-700 dark:text-slate-200">{status}</p>}
    {canLinkGoogle && <button className="secondary-button" onClick={onLinkGoogle}>Liên kết Google</button>}
  </section>;
}

export default function SettingsView({ user, preferences, darkMode, setDarkMode, timerMinutes, setTimerMinutes,
  onSavePreferences, onLogin, onLinkGoogle, onLogout, onImportLegacy, importNotice, busy, onNavigate }) {
  const { current, edit, save, saving, status, dirty, conflict, reset } = usePreferencesDraft(preferences, onSavePreferences);
  const [timerDraft, setTimerDraft] = useState(timerMinutes);
  const [timerStatus, setTimerStatus] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  async function download() {
    setExporting(true); setExportStatus('');
    try { await exportStudyData(); setExportStatus('Đã tải xuống bản sao dữ liệu học tập.'); }
    catch (error) { setExportStatus(error.message); }
    finally { setExporting(false); }
  }

  return <div className="page-shell space-y-5">
    <h2 className="text-2xl sm:text-3xl font-bold">Cài đặt</h2>
    <section className="surface p-5 space-y-4">
      <h3 className="text-lg font-bold">Giao diện</h3>
      <label className="flex items-center gap-3"><Moon className="h-5 w-5" />
        <input role="switch" type="checkbox" className="h-5 w-5 accent-blue-700" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />Giao diện tối
      </label>
      <p className="text-sm text-slate-700 dark:text-slate-300">Ngôn ngữ: Tiếng Việt</p>
    </section>
    <form className="surface p-5 space-y-4" onSubmit={event => {
      event.preventDefault();
      setTimerMinutes(Object.fromEntries(Object.entries(timerDraft).map(([key, value]) => [key, Number(value)])));
      setTimerStatus('Đã lưu thời lượng cho phiên mới.');
    }}>
      <h3 className="flex items-center gap-2 text-lg font-bold"><Clock className="h-5 w-5" />Pomodoro</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">Thời lượng lưu trên trình duyệt này và áp dụng từ phiên mới.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {[['focus', 'Tập trung', 240], ['short', 'Nghỉ ngắn', 60], ['long', 'Nghỉ dài', 60]].map(([key, label, max]) =>
          <label key={key} className="form-label">{label} (phút)<input className="field" type="number" min={1} max={max} step={1} required value={timerDraft[key]}
            onChange={e => { setTimerDraft(old => ({ ...old, [key]: e.target.value })); setTimerStatus(''); }} /></label>)}
      </div>
      <div className="flex flex-wrap items-center gap-3"><button type="submit" className="secondary-button">Lưu thời lượng</button><p role="status" className="text-sm">{timerStatus}</p></div>
    </form>
    {!user && <section className="surface p-5"><button className="primary-button" onClick={onLogin}>Đăng nhập để cài đặt tài khoản</button></section>}
    {user && <>
      <form className="surface p-5 space-y-4" onSubmit={save}>
        <h3 className="flex items-center gap-2 text-lg font-bold"><Bell className="h-5 w-5" />Mục tiêu và nhắc học</h3>
        <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
          <label className="form-label">Mục tiêu tuần (giờ)<input className="field" type="number" min={0.5} max={168} step={0.5} required
            value={current.weeklyGoalSeconds === '' ? '' : current.weeklyGoalSeconds / 3600}
            onChange={e => edit({ weeklyGoalSeconds: e.target.value === '' ? '' : Math.round(Number(e.target.value) * 3600) })} /></label>
          <label className="form-label">Múi giờ<select className="field" value={current.timezone} onChange={e => edit({ timezone: e.target.value })}>
            {!zones.some(([id]) => id === current.timezone) && <option value={current.timezone}>{current.timezone}</option>}
            {zones.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select></label>
          <label className="flex items-center gap-3 self-center text-sm"><input className="h-5 w-5 accent-blue-700" type="checkbox"
            checked={current.reminderEnabled} onChange={e => edit({ reminderEnabled: e.target.checked })} />Nhắc học khi ứng dụng đang mở</label>
          <label className="form-label">Giờ nhắc hằng ngày<input className="field" type="time" required disabled={!current.reminderEnabled}
            value={current.reminderTime} onChange={e => edit({ reminderTime: e.target.value })} /></label>
        </fieldset>
        <p className="text-sm text-slate-600 dark:text-slate-300">Múi giờ ảnh hưởng đến ngày thống kê và giờ nhắc. Giờ trong thời khóa biểu vẫn theo giờ đã nhập.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="primary-button" disabled={!dirty || saving || conflict}>Lưu cài đặt học tập</button>
          {conflict && <button type="button" className="secondary-button" onClick={reset}>Tải bản mới</button>}
          <p role="status" className="text-sm">{conflict ? 'Cài đặt đã thay đổi. Hãy tải bản mới trước khi lưu.' : status}</p>
        </div>
      </form>
      <PasswordSettings canLinkGoogle={!!user.email} onLinkGoogle={onLinkGoogle} />
      <section className="surface p-5 space-y-4">
        <h3 className="text-lg font-bold">Dữ liệu học tập</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">Tải bản JSON gồm môn học, lịch, nhiệm vụ, ghi chú và phiên tập trung.</p>
        <div className="flex flex-wrap gap-2">
          <button className="primary-button" disabled={exporting} onClick={download}><Download className="h-4 w-4" />{exporting ? 'Đang xuất…' : 'Xuất dữ liệu'}</button>
          {user.email && <button className="secondary-button" disabled={busy} onClick={onImportLegacy}>Nhập dữ liệu cũ</button>}
        </div>
        {(exportStatus || importNotice) && <p role="status" className="text-sm">{exportStatus || importNotice}</p>}
        <p className="text-sm text-slate-600 dark:text-slate-300">Để xóa từng mục, mở danh sách tương ứng.</p>
        <div className="flex flex-wrap gap-2">
          <button className="secondary-button" onClick={() => onNavigate('subjects')}>Quản lý môn học</button>
          <button className="secondary-button" onClick={() => onNavigate('schedule')}>Quản lý lịch học</button>
          <button className="secondary-button" onClick={() => onNavigate('tasks')}>Quản lý nhiệm vụ</button>
        </div>
      </section>
      <button className="secondary-button" onClick={onLogout}>Đăng xuất</button>
    </>}
  </div>;
}
