import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, CheckCircle2, BookOpen, Flame, Info } from 'lucide-react';
import ActivityHeatmap from './ActivityHeatmap';
import { zonedDate } from '../lib/studyClient';

export default function StatisticsView({ stats, subjects = [], metrics, preferences, filters, onFilterChange }) {
  const today = zonedDate(metrics.asOf, metrics.timezone);
  const recentStart = new Date(Date.parse(today) - 29 * 86400000).toISOString().slice(0, 10);
  const period = metrics.period;
  const [subjectId, setSubjectId] = useState(filters.subjectId || '');
  const [from, setFrom] = useState(filters.from || recentStart);
  const [to, setTo] = useState(filters.to || period.to || today);

  useEffect(() => {
    if (period.from && !filters.from) onFilterChange({ from: recentStart, to: today });
  }, [filters.from, onFilterChange, period.from, recentStart, today]);

  function applyPreset(start) {
    setFrom(start);
    setTo(today);
    onFilterChange({ from: start, to: today, subjectId });
  }
  const taskStatuses = [
    ['TODO', 'Chưa làm', 'bg-slate-500'],
    ['DOING', 'Đang làm', 'bg-amber-600'],
    ['DONE', 'Hoàn thành', 'bg-emerald-600'],
  ];
  const invalidRange = !from || !to || from > to || to > today || (Date.parse(to) - Date.parse(from)) / 86400000 > 365;
  const delta = (period.weekFocusSeconds - period.previousWeekFocusSeconds) / 3600;
  const chartData = [];
  const days = new Map(period.days.map(day => [day.date, day]));
  if (period.from && period.to) {
    for (let at = Date.parse(period.from); at <= Date.parse(period.to); at += 86400000) {
      const date = new Date(at).toISOString().slice(0, 10);
      chartData.push({ date, name: `${date.slice(8)}/${date.slice(5, 7)}`, hours: (days.get(date)?.focusSeconds || 0) / 3600 });
    }
  }
  return <div className="page-shell space-y-6">
    <div><h2 className="text-2xl sm:text-3xl font-bold">Thống kê học tập</h2><p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Số liệu đã xác nhận trên tài khoản · múi giờ {metrics.timezone}</p></div>
    <form onSubmit={e => { e.preventDefault(); if (!invalidRange) onFilterChange({ from, to, subjectId }); }} className="surface p-4 flex flex-wrap gap-4 items-end">
      <label className="text-xs font-semibold flex flex-col gap-2 flex-1 min-w-40">Môn học<select className="field" value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">Tất cả môn học</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="text-xs font-semibold flex flex-col gap-2">Từ ngày<input required className="field" type="date" value={from} max={to} onChange={e => setFrom(e.target.value)} /></label>
      <label className="text-xs font-semibold flex flex-col gap-2">Đến ngày<input required className="field" type="date" value={to} min={from} max={today} onChange={e => setTo(e.target.value)} /></label>
      <button type="submit" className="primary-button" disabled={invalidRange}>Áp dụng</button>
      <button type="button" className="secondary-button" onClick={() => applyPreset(recentStart)}>30 ngày gần nhất</button>
      <button type="button" className="secondary-button" onClick={() => {
        const monday = new Date(today);
        monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
        applyPreset(monday.toISOString().slice(0, 10));
      }}>Tuần này</button>
    </form>
    {invalidRange && <p role="alert" className="text-red-700 dark:text-red-300">Chọn khoảng thời gian hợp lệ, tối đa 366 ngày.</p>}
    <p className="text-sm text-slate-600 dark:text-slate-300">Kỳ đang hiển thị: {period.from || today} → {period.to || today} · {subjects.find(s => s.id === period.subjectId)?.name || 'Tất cả môn học'}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        { icon: Clock, label: 'Giờ tập trung trong kỳ', value: `${(period.focusSeconds / 3600).toFixed(1)} giờ`, hint: `Tuần này: ${(period.weekFocusSeconds / 3600).toFixed(1)} giờ · ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} giờ so với tuần trước` },
        { icon: CheckCircle2, label: 'Nhiệm vụ tạo trong kỳ', value: `${period.progress.completedTasks}/${period.progress.totalTasks}`, hint: 'Số đã hoàn thành / tổng số tạo trong kỳ' },
        { icon: BookOpen, label: 'Mục tiêu tuần', value: `${metrics.weekHours.toFixed(1)} / ${preferences.weeklyGoal} giờ`, hint: 'Tổng thời gian tập trung tuần này', progress: true },
        { icon: Flame, label: 'Chuỗi ngày học', value: `${metrics.streak} ngày`, hint: 'Toàn tài khoản · không phụ thuộc bộ lọc' },
      ].map(({ icon: Icon, label, value, hint, progress }) => <section key={label} className="surface p-5 space-y-2"><Icon className="w-5 h-5 text-blue-600 dark:text-blue-300" /><p className="text-xs text-slate-600 dark:text-slate-300">{label}</p><p className="text-2xl font-bold tabular-nums">{value}</p>{progress && <progress aria-label="Tiến độ mục tiêu tuần" className="w-full h-2 accent-blue-600" value={metrics.weekHours} max={preferences.weeklyGoal} />}<p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{hint}</p></section>)}
    </div>
    <ActivityHeatmap key={`${period.subjectId}-${period.from}-${period.to}`} activities={period.days} from={period.from || today} to={period.to || today} />
    <section className="surface p-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-lg">Giờ tập trung theo ngày</h3>
        <details className="relative shrink-0">
          <summary aria-label="Cách tính số liệu" title="Cách tính số liệu" className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><Info className="w-5 h-5" /></summary>
          <div className="absolute right-0 top-full z-10 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Chỉ cộng giờ từ phiên đã lưu. Một ngày được tính vào chuỗi khi hoàn thành một nhiệm vụ hoặc tập trung từ 10 phút.
          </div>
        </details>
      </div>
      {period.focusSeconds > 0 ? <div className="h-64 w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--chart-label)' }} /><YAxis tick={{ fontSize: 11, fill: 'var(--chart-label)' }} width={35} /><Tooltip formatter={value => [`${Number(value).toFixed(2)} giờ`, 'Tập trung']} /><Bar dataKey="hours" name="Giờ tập trung" fill="#2563eb" radius={[5, 5, 0, 0]} maxBarSize={40} /></BarChart></ResponsiveContainer></div> : <p className="empty-state">Chưa có giờ tập trung được xác nhận trong khoảng thời gian này.</p>}
    </section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <section className="surface p-5 space-y-4"><h3 className="font-bold text-lg">Trạng thái nhiệm vụ</h3>{period.progress.totalTasks ? taskStatuses.map(([status, label, color]) => {
        const count = period.taskStatus[status] || 0;
        return <div key={status} className="space-y-2">
          <div className="flex justify-between text-sm"><span>{label}</span><span>{count}</span></div>
          <div role="progressbar" aria-label={label} aria-valuenow={count} aria-valuemin={0} aria-valuemax={period.progress.totalTasks} className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className={`h-full rounded-full ${color}`} style={{ width: `${100 * count / period.progress.totalTasks}%` }} />
          </div>
        </div>;
      }) : <p className="empty-state">Chưa có nhiệm vụ được tạo trong khoảng thời gian này.</p>}</section>
      <section className="surface p-5 space-y-4"><h3 className="font-bold text-lg">Tiến độ theo môn</h3>{period.subjects.map(subject => <div key={subject.subjectId} className="space-y-2"><div className="flex justify-between gap-3 text-sm"><span className="min-w-0 break-words">{subject.name}</span><span className="shrink-0">{subject.totalTasks ? `${subject.completedTasks}/${subject.totalTasks}` : 'Chưa có nhiệm vụ'}</span></div>{subject.totalTasks > 0 && <progress value={subject.completedTasks} max={subject.totalTasks} className="w-full h-2 accent-blue-600" />}</div>)}{!period.subjects.length && <p className="empty-state">Thêm môn học để theo dõi tiến độ.</p>}</section>
    </div>
    <section className="surface p-5">
      <h3 className="font-bold text-lg">Điểm trắc nghiệm trung bình</h3>
      {stats?.averageQuizScore != null
        ? <><p className="text-2xl font-bold mt-2">{stats.averageQuizScore}%</p><p className="text-sm text-slate-600 dark:text-slate-300 mt-2">Tính trên các lượt làm bài của toàn tài khoản.</p></>
        : <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{stats === null ? 'Đang tải điểm trắc nghiệm…' : stats?.unavailable ? 'Chưa tải được điểm trắc nghiệm.' : 'Chưa có điểm trắc nghiệm để hiển thị.'}</p>}
    </section>
  </div>;
}
