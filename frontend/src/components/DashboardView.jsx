import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  TrendingUp,
  ChevronRight,
  Play,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  FileText,
  BarChart3,
  Target,
  Flame
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function DashboardView({ data, onNavigate, onOpenNewSubject, onOpenAiTutor, onSubjectClick }) {
  const { t, i18n } = useTranslation('dashboard');
  const [tasks, setTasks] = useState(data.tasks || []);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(tk => tk.id === id ? { ...tk, completed: !tk.completed } : tk));
  };

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting');
    if (hour < 18) return t('greetingAfternoon');
    return t('greetingEvening');
  }, [t, i18n.language]);

  // Dynamic values
  const goalPercent = data.user?.dailyGoalPercent || 0;
  const hoursStudied = data.user?.hoursStudied || 0;
  const goalHours = data.user?.goalHours || 6.0;
  const streak = data.user?.streak || 0;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const totalTasksCount = tasks.length;
  const nextSlot = data.todayData?.todaySlots?.[0];

  // ── Weekly study hours from schedule ──
  const weeklyChartData = useMemo(() => {
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const labels = i18n.language === 'en'
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const dayEnumMap = { THU_2: 0, THU_3: 1, THU_4: 2, THU_5: 3, THU_6: 4, THU_7: 5, CHU_NHAT: 6 };
    const hours = [0, 0, 0, 0, 0, 0, 0];
    (data.schedule || []).forEach(slot => {
      const idx = dayEnumMap[slot.dayOfWeek];
      if (idx !== undefined && slot.startTime && slot.endTime) {
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const [eh, em] = slot.endTime.split(':').map(Number);
        hours[idx] += Math.max(0, Math.round(((eh + em / 60) - (sh + sm / 60)) * 10) / 10);
      }
    });
    return labels.map((label, i) => ({ name: label, hours: hours[i] }));
  }, [data.schedule, i18n.language]);

  const totalWeekHours = weeklyChartData.reduce((s, d) => s + d.hours, 0).toFixed(1);

  // Stats cards
  const totalNotes = data.subjects?.reduce((acc, s) => acc + (s.totalNotes || 0), 0) || 0;
  const totalDocs = data.subjects?.reduce((acc, s) => acc + (s.totalDocuments || 0), 0) || 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-[#172136] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs">
        <p className="font-bold text-slate-900 dark:text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.value}h</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* 1. Greeting Header + View Stats Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-['Be_Vietnam_Pro'] font-bold text-3xl text-slate-900 dark:text-white flex items-center gap-2">
            {greeting}, {data.user?.fullName || 'Học viên'}! <span className="animate-bounce inline-block">👋</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-['Be_Vietnam_Pro'] font-medium text-base">
            {t('progressSubtitle', { percent: goalPercent })}
          </p>
        </div>
        <button
          onClick={() => onNavigate('statistics')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold text-sm transition-all border border-blue-200/60 dark:border-blue-800/60"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Xem Thống Kê</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Stats Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: BookOpen, label: t('mySubjects'), value: data.subjects?.length || 0, color: '#2563EB', bg: 'bg-blue-50 dark:bg-blue-950/40' },
          { icon: CheckCircle2, label: t('tasks'), value: `${completedTasksCount}/${totalTasksCount}`, color: '#10B981', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
          { icon: FileText, label: t('notes'), value: totalNotes, color: '#8B5CF6', bg: 'bg-violet-50 dark:bg-violet-950/40' },
          { icon: Flame, label: t('streak'), value: `⚡ ${streak}`, color: '#F59E0B', bg: 'bg-amber-50 dark:bg-amber-950/40' },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white dark:bg-[#111C32] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-md transition-all group">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}>
                <Icon className="w-4.5 h-4.5" style={{ color: card.color }} />
              </div>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-0.5">{card.label}</p>
              <p className="font-['Manrope'] font-extrabold text-xl text-slate-900 dark:text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* 3. Main 2-Column Grid (Chart + Next Up / Tasks) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Weekly Study Hours Bar Chart */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Weekly Study Hours
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {i18n.language === 'en' ? 'Comparing this week to last week' : 'So sánh số giờ học trong tuần'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{totalWeekHours}h</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyChartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" fill="#2563EB" radius={[8, 8, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Progress Ring + Next Class */}
        <div className="lg:col-span-5 space-y-5 flex flex-col">

          {/* Progress Ring Card */}
          <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-6">
            {/* SVG Ring */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#F1F5F9" className="dark:stroke-slate-800/80" strokeWidth="10" fill="transparent" />
                <circle cx="60" cy="60" r="50" stroke="#2563EB" strokeWidth="10"
                  strokeDasharray="314" strokeDashoffset={314 - (314 * goalPercent) / 100}
                  strokeLinecap="round" fill="transparent" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-['Manrope'] font-extrabold text-2xl text-slate-900 dark:text-white">{goalPercent}%</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">{t('completedLabel')}</span>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                <TrendingUp className="w-3 h-3" />
                {t('betterThanYesterday', { percent: goalPercent > 0 ? 15 : 0 })}
              </div>
              <h4 className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white">{t('dailyProgress')}</h4>
              <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">{t('exercises')}</span>
                  <span className="font-['Manrope'] font-bold text-sm text-slate-900 dark:text-white">{completedTasksCount}/{totalTasksCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">{t('notes')}</span>
                  <span className="font-['Manrope'] font-bold text-sm text-slate-900 dark:text-white">{totalNotes}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">{t('streak')}</span>
                  <span className="font-['Manrope'] font-bold text-sm text-slate-900 dark:text-white">⚡ {streak}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Next Class Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg shadow-blue-500/20 relative overflow-hidden group flex-1 flex flex-col justify-between">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <div className="relative z-10 space-y-3">
              <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-blue-100">
                {t('nextClass')}
              </div>
              {nextSlot ? (
                <div>
                  <h4 className="font-['Be_Vietnam_Pro'] font-bold text-xl leading-tight">{nextSlot.subjectName}</h4>
                  <p className="text-blue-100 text-xs font-medium mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {nextSlot.startTime && nextSlot.endTime ? `${nextSlot.startTime} - ${nextSlot.endTime}` : 'Hôm nay'}
                    {nextSlot.room ? ` • ${nextSlot.room}` : ''}
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="font-['Be_Vietnam_Pro'] font-bold text-lg opacity-90">Không có tiết học tiếp theo</h4>
                  <p className="text-blue-100 text-xs font-medium mt-1">Hãy tận dụng thời gian để ôn tập!</p>
                </div>
              )}
              <button
                onClick={() => onNavigate('schedule')}
                className="w-full bg-white hover:bg-blue-50 text-blue-600 font-['Inter'] font-bold text-xs py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                {nextSlot ? t('startNow') : 'Xem lịch học'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tasks Section */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            {t('tasks')}
          </h4>
          <button onClick={onOpenNewSubject} className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Chưa có nhiệm vụ nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.slice(0, 6).map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  task.completed
                    ? 'bg-slate-50 dark:bg-[#070C18]/60 border-transparent opacity-75'
                    : 'bg-white dark:bg-[#111C32] border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700'
                }`}
              >
                <button className="mt-0.5 text-blue-600 dark:text-blue-400 transition-transform active:scale-90">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 hover:text-blue-500" />
                  )}
                </button>
                <div className="flex-1 space-y-1">
                  <p className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                    {task.title}
                  </p>
                  <span
                    className="inline-block px-2.5 py-0.5 text-[10px] font-['Inter'] font-bold rounded-md"
                    style={{ backgroundColor: `${task.subjectColor || '#2563EB'}20`, color: task.subjectColor || '#2563EB' }}
                  >
                    {task.subject}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. AI Tutor Suggestion */}
      <div
        onClick={onOpenAiTutor}
        className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-blue-50 dark:from-[#111C32] dark:via-blue-950/40 dark:to-[#111C32] border border-blue-200/80 dark:border-blue-900/50 rounded-3xl p-6 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-all group flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t('aiSuggestion')}
            </span>
            <p className="text-slate-700 dark:text-slate-300 text-sm italic font-medium leading-relaxed max-w-3xl">
              {i18n.language === 'en'
                ? "Let AI Tutor analyze your study documents, generate quizzes, and build mindmaps for faster learning!"
                : "Hãy để AI Tutor phân tích tài liệu học tập, tạo bộ câu hỏi ôn tập và vẽ sơ đồ tư duy giúp bạn học nhanh hơn!"}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm hover:text-blue-700 shrink-0 group-hover:translate-x-1 transition-transform">
          <span>{t('viewDetailSuggestion')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 6. My Subjects Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-['Be_Vietnam_Pro'] font-bold text-2xl text-slate-900 dark:text-white">{t('mySubjects')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('mySubjectsDesc')}</p>
          </div>
          <button onClick={() => onNavigate('subjects')} className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold text-sm hover:underline">
            <span>{t('viewAllSubjects')}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(data.subjects || []).slice(0, 3).map((sub) => (
            <div key={sub.id} onClick={() => onSubjectClick ? onSubjectClick(sub.id) : onNavigate('subjects')} className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden cursor-pointer card-hover-effect flex flex-col justify-between transition-colors">
              <div className="h-32 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img src={sub.image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80"} alt={sub.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="font-['Be_Vietnam_Pro'] font-bold text-lg leading-tight block">{sub.name}</span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-['Inter'] font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">{t('completed')}</span>
                    <span className="text-slate-900 dark:text-white font-bold">{sub.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${sub.progress || 0}%`, backgroundColor: sub.color || '#2563EB' }}></div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span>{sub.totalDocuments || 0} {t('documents')}</span>
                  <span>•</span>
                  <span>{sub.totalNotes || 0} {t('subjectNotes')}</span>
                </div>
              </div>
            </div>
          ))}

          <div onClick={onOpenNewSubject} className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-slate-900/50 group min-h-[220px]">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7" />
            </div>
            <span className="font-['Be_Vietnam_Pro'] font-bold text-slate-800 dark:text-slate-200 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {t('addNewSubject')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
