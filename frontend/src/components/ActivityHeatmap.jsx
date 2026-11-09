import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

const colors = ['#e2e8f0', '#bfdbfe', '#60a5fa', '#2563eb', '#1e3a8a'];
const legend = ['Không có', 'Có hoạt động', 'Từ 10 phút', 'Từ 30 phút', 'Từ 60 phút'];
export default function ActivityHeatmap({ activities, from, to }) {
  const [selected, setSelected] = useState(null);
  const lookup = new Map(activities.map(day => [day.date, day]));
  const start = new Date(`${from}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  const end = new Date(`${to}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + (7 - end.getUTCDay()) % 7);
  const days = [];
  for (let at = start.getTime(); at <= end.getTime(); at += 86400000) {
    const date = new Date(at).toISOString().slice(0, 10);
    const day = lookup.get(date) || { focusSeconds: 0, completedTasks: 0, qualifies: false };
    const level = day.focusSeconds >= 3600 ? 4 : day.focusSeconds >= 1800 ? 3 : day.focusSeconds >= 600 ? 2 : day.focusSeconds || day.completedTasks ? 1 : 0;
    days.push({ ...day, date, level });
  }
  return <section className="surface p-5 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-4"><h3 className="font-bold text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5 text-blue-600" />Hoạt động học tập</h3><div className="flex gap-2 items-center text-xs text-slate-600 dark:text-slate-300" aria-label={`Thang màu tăng dần: ${legend.join(', ')}`}><span>Ít</span>{colors.map((color, i) => <span key={color} title={legend[i]} className="h-3.5 w-3.5 rounded-sm border border-slate-400/30" style={{ backgroundColor: color }} />)}<span>Nhiều</span></div></div>
    <p className="text-xs text-slate-600 dark:text-slate-300">Màu đậm hơn khi giờ tập trung tăng. Nhiệm vụ hoàn thành có mức màu tối thiểu 1; chạm từng ngày để xem điều kiện chuỗi.</p>
    {!activities.length && <p className="rounded-xl bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">Chưa có hoạt động trong khoảng thời gian này.</p>}
    <div className="overflow-x-auto pb-2"><div className="flex gap-3 min-w-max"><div className="grid grid-rows-7 gap-1 text-[11px] text-slate-600 dark:text-slate-300" aria-hidden="true">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day} className="h-6 flex items-center">{day}</span>)}</div><div className="grid grid-rows-7 grid-flow-col gap-1">{days.map(day => {
      const outside = day.date < from || day.date > to;
      const label = `${day.date}: ${outside ? 'Ngoài khoảng đã chọn' : `${day.completedTasks} nhiệm vụ, ${(day.focusSeconds / 60).toFixed(1)} phút tập trung · ${day.qualifies ? 'Đủ điều kiện chuỗi' : 'Chưa đủ điều kiện chuỗi'}`}`;
      return <button key={day.date} title={label} aria-label={label} disabled={outside} onFocus={() => setSelected(label)} onMouseEnter={() => setSelected(label)} onClick={() => setSelected(label)} className={`h-6 w-6 rounded-sm border border-slate-400/20 transition-transform hover:scale-110 ${outside ? 'opacity-20' : ''}`} style={{ backgroundColor: colors[day.level] }} />;
    })}</div></div></div>
    <p className="text-xs text-slate-600 dark:text-slate-300 min-h-5" aria-live="polite">{selected || 'Chạm, rê chuột hoặc dùng phím Tab để xem từng ngày.'}</p>
  </section>;
}
