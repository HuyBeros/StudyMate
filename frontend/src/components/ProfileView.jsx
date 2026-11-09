import { Award, CheckCircle2, Clock, Flame } from 'lucide-react';
import Avatar from './Avatar';
import usePreferencesDraft from '../hooks/usePreferencesDraft';

export default function ProfileView({ user, metrics, preferences, onSavePreferences, onEditProfile, onLogin, onOpenSettings }) {
  const { current, edit, save, saving, status, dirty, conflict, reset } = usePreferencesDraft(preferences, onSavePreferences);
  const totals = [
    [Flame, 'Chuỗi ngày học', metrics.streak + ' ngày'],
    [Clock, 'Tổng giờ tập trung', metrics.totalHours.toFixed(1) + ' giờ'],
    [CheckCircle2, 'Nhiệm vụ đã xong', metrics.progress.completedTasks],
  ];
  return <div className="page-shell space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl sm:text-3xl font-bold">Hồ sơ</h2>
      <button type="button" className="secondary-button" onClick={onOpenSettings}>Mở cài đặt</button></div>
    <section className="surface p-5 sm:p-7 flex flex-wrap items-center gap-5">
      <Avatar src={user?.avatar || user?.avatarUrl} name={user?.fullName} className="h-24 w-24 text-3xl" />
      <div className="flex-1 min-w-36">
        <h3 className="text-2xl font-bold break-words">{user?.fullName || 'Chào bạn'}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 break-all">{user?.username || user?.email}</p>
      </div>
      <button className="primary-button" onClick={user ? onEditProfile : onLogin}>{user ? 'Chỉnh sửa hồ sơ' : 'Đăng nhập'}</button>
    </section>
    <div className="grid gap-4 sm:grid-cols-3">
      {totals.map(([Icon, label, value]) => <div key={label} className="surface p-5">
        <Icon className="mb-3 h-5 w-5 text-blue-600 dark:text-blue-300" />
        <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p><p className="text-xl font-bold">{value}</p>
      </div>)}
    </div>
    {user && <form className="surface space-y-4 p-5" onSubmit={save}>
      <h3 className="text-lg font-bold">Trường và ngành học</h3>
      <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
        <label className="form-label">Trường học<input className="field" maxLength={160} value={current.school} onChange={e => edit({ school: e.target.value })} /></label>
        <label className="form-label">Ngành học<input className="field" maxLength={160} value={current.major} onChange={e => edit({ major: e.target.value })} /></label>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="primary-button" disabled={!dirty || saving || conflict}>Lưu thông tin học tập</button>
        {conflict && <button type="button" className="secondary-button" onClick={reset}>Tải bản mới</button>}
        <p role="status" className="text-sm text-slate-700 dark:text-slate-200">{conflict ? 'Thông tin đã thay đổi. Hãy tải bản mới trước khi lưu.' : status}</p>
      </div>
    </form>}
    <section className="surface space-y-3 p-5">
      <h3 className="flex items-center gap-2 text-lg font-bold"><Award className="h-5 w-5 text-blue-600" />Huy hiệu thành tích</h3>
      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        {[['Bước đầu tiên', metrics.activities.length > 0], ['Đều đặn mỗi ngày', metrics.streak >= 7], ['Chạm mục tiêu', metrics.weekHours >= preferences.weeklyGoal]].map(([label, earned]) =>
          <li key={label} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"><strong>{label}</strong><p className="text-slate-600 dark:text-slate-300">{earned ? 'Đã đạt' : 'Chưa đạt'}</p></li>)}
      </ul>
    </section>
  </div>;
}
