import { BookOpen, CheckCircle2, Flame, Plus, BarChart3, Clock, Sparkles } from 'lucide-react';
import TodoList from './TodoList';
import FocusTimer from './FocusTimer';
import { useState } from 'react';

export default function DashboardView({ data, metrics, preferences, study, timerMinutes, onLogin, onNavigate, onOpenAssistant, onOpenNewSubject, onTaskAdd, onTaskUpdate, onTaskDelete, onSessionComplete }) {
  const tasks = data.tasks || [];
  const [selectedTask, setSelectedTask] = useState(null);
  const total = metrics.today.totalTasks, done = metrics.today.completedTasks;
  const percent = metrics.today.progressPercent;
  const hour = new Date().getHours();
  return <div className="page-shell space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">{hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'}, {data.user?.fullName || 'bạn'}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{total ? `Bạn đã hoàn thành ${percent}% nhiệm vụ hôm nay (${done}/${total}).` : 'Hãy đặt mục tiêu đầu tiên cho hôm nay'}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="primary-button" onClick={onOpenAssistant}><Sparkles className="w-4 h-4" />Hỏi StudyMate</button>
        <button className="secondary-button" onClick={() => onNavigate('statistics')}><BarChart3 className="w-4 h-4" />Xem thống kê</button>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      {[
        { icon: BookOpen, label: 'Môn học', value: data.subjects.length },
        { icon: CheckCircle2, label: 'Nhiệm vụ hôm nay', value: total ? `${done}/${total}` : 'Chưa có mục tiêu' },
        { icon: Clock, label: 'Giờ tập trung tuần này', value: `${metrics.weekHours.toFixed(1)} giờ` },
        { icon: Flame, label: 'Chuỗi ngày học', value: `${metrics.streak} ngày` },
      ].map(({ icon: Icon, label, value }) => <div key={label} className="surface p-4 flex items-center gap-3"><Icon className="w-5 h-5 text-blue-600 dark:text-blue-300 shrink-0" /><div><p className="text-xs text-slate-600 dark:text-slate-300">{label}</p><p className="font-bold text-lg tabular-nums">{value}</p></div></div>)}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,1fr)] gap-5 items-start">
      <div id="dashboard-tasks" className="space-y-3 scroll-mt-24">
        <div className="flex items-center justify-between gap-3"><h3 className="font-bold text-lg">Việc cần làm</h3><button onClick={onOpenNewSubject} className="primary-button"><Plus className="w-4 h-4" />Thêm nhiệm vụ</button></div>
        <TodoList tasks={tasks} subjects={data.subjects} onTaskAdd={onTaskAdd} onTaskUpdate={onTaskUpdate} onTaskDelete={onTaskDelete} onStartPomodoro={task => { setSelectedTask(task); document.getElementById('focus-timer')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} />
      </div>
      <div className="space-y-4">
        <FocusTimer subjects={data.subjects} tasks={tasks} timerMinutes={timerMinutes} selectedTask={selectedTask} session={study.data.activeSession} receivedAt={study.data.receivedAt} busy={study.busy} pending={study.pending} onCreate={study.createSession} onTransition={study.transitionSession} onComplete={onSessionComplete} user={data.user} onLogin={onLogin} />
        <section className="surface p-5 space-y-3"><h3 className="font-bold">Mục tiêu tuần</h3><p className="text-sm text-slate-600 dark:text-slate-300">{metrics.weekHours.toFixed(1)} / {preferences.weeklyGoal} giờ tập trung</p><progress className="w-full h-2 accent-blue-600" value={metrics.weekHours} max={preferences.weeklyGoal} /><button className="text-sm font-semibold text-blue-700 dark:text-blue-300" onClick={() => onNavigate('settings')}>Điều chỉnh mục tiêu và nhắc học →</button></section>
      </div>
    </div>
    <p className="text-xs text-slate-600 dark:text-slate-300">Một ngày được tính vào chuỗi khi hoàn thành ít nhất một nhiệm vụ hoặc tập trung từ 10 phút. Số liệu dùng múi giờ {preferences.timezone} và được lưu trên tài khoản.</p>
  </div>;
}
