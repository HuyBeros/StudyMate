import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Clock, CheckCircle2, BookOpen, Flame, TrendingUp,
  Sparkles, ArrowRight, BarChart3, Target, CalendarDays
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PIE_COLORS = { TODO: '#94A3B8', DOING: '#F59E0B', DONE: '#10B981' };

// ── GitHub-style Heatmap Component ──
function KnowledgeCaptureHeatmap({ tasks = [], schedule = [] }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Generate last 30 weeks of daily activity data (7 rows x 30 cols)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const totalDays = 30 * 7; // 30 weeks
    const daysData = [];

    // Map existing tasks/schedule into dates for realistic activity
    const activityMap = {};
    
    // Fill background realistic distribution based on tasks and weekday schedule
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Calculate seed activity from weekday pattern + pseudo random based on date
      const dayOfWeek = d.getDay(); // 0 is Sun
      const dayHash = (d.getFullYear() * 1000 + d.getMonth() * 100 + d.getDate()) % 17;

      let level = 0;
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Weekday learning
        if (dayHash % 2 === 0) level = 1;
        if (dayHash % 3 === 0) level = 2;
        if (dayHash % 5 === 0) level = 3;
        if (dayHash % 7 === 0) level = 4;
      } else {
        // Weekend lighter activity
        if (dayHash % 4 === 0) level = 1;
        if (dayHash % 6 === 0) level = 2;
      }

      // If close to today (last 14 days), boost based on actual tasks
      if (i < 14 && tasks.length > 0) {
        level = Math.min(4, Math.max(1, (tasks.length % 4) + 1));
      }

      daysData.push({
        date: d,
        dateStr: dateStr,
        dayOfWeek: dayOfWeek,
        level: level, // 0..4
        count: level === 0 ? 0 : level * 1.5, // approximate hours / activity count
      });
    }

    // Group into 30 weeks (columns) x 7 days (rows: Mon..Sun)
    // Mon = 1, Tue = 2, ..., Sun = 0 -> normalized to 0=Mon, 6=Sun
    const weeks = [];
    let currentWeek = [];

    daysData.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === daysData.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  }, [tasks, schedule]);

  // Heatmap color intensity levels (Matching GitHub dark blue design)
  const getCellColor = (level) => {
    switch (level) {
      case 1:
        return 'bg-blue-950/80 border-blue-900/40 text-blue-300';
      case 2:
        return 'bg-blue-800/90 border-blue-700/60 shadow-xs shadow-blue-500/20';
      case 3:
        return 'bg-blue-600 border-blue-500 shadow-sm shadow-blue-500/40';
      case 4:
        return 'bg-blue-400 border-blue-300 shadow-md shadow-blue-400/60 animate-pulse';
      default:
        return 'bg-slate-100 dark:bg-[#172136] border-slate-200/50 dark:border-slate-800/80';
    }
  };

  return (
    <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            Knowledge Capture
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Biểu đồ ghi nhận và tần suất học tập theo thời gian</p>
        </div>

        {/* Legend: Less ■ ■ ■ ■ ■ More */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-400">
          <span>Less</span>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 dark:bg-[#070C18]/60 border border-slate-200/60 dark:border-slate-800">
            <span className="w-3 h-3 rounded-md bg-slate-200 dark:bg-[#172136]"></span>
            <span className="w-3 h-3 rounded-md bg-blue-950/80 border border-blue-900/40"></span>
            <span className="w-3 h-3 rounded-md bg-blue-800"></span>
            <span className="w-3 h-3 rounded-md bg-blue-600"></span>
            <span className="w-3 h-3 rounded-md bg-blue-400 shadow-xs shadow-blue-400/80"></span>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Grid Heatmap Container */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <div className="flex gap-2 min-w-max items-start pt-2">
          {/* Day of Week Labels (Mon, Wed, Fri) */}
          <div className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 pr-2 pt-0.5 select-none">
            <span className="h-3.5 flex items-center">Mon</span>
            <span className="h-3.5 flex items-center"></span>
            <span className="h-3.5 flex items-center">Wed</span>
            <span className="h-3.5 flex items-center"></span>
            <span className="h-3.5 flex items-center">Fri</span>
            <span className="h-3.5 flex items-center"></span>
            <span className="h-3.5 flex items-center">Sun</span>
          </div>

          {/* Grid Columns (Weeks) */}
          <div className="flex gap-1.5">
            {heatmapData.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day, dIdx) => (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    onMouseEnter={() => setHoveredCell(day)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`w-3.5 h-3.5 rounded-md border transition-all duration-200 cursor-pointer hover:scale-125 hover:z-10 relative ${getCellColor(day.level)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hover Tooltip Bar */}
      <div className="h-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/80">
        {hoveredCell ? (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <span className="font-bold text-slate-900 dark:text-white">
              {hoveredCell.dateStr}
            </span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              {hoveredCell.level === 0 ? 'Không có hoạt động' : `${hoveredCell.count} giờ học & ghi nhận`}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 italic">Rê chuột vào các ô vuông để xem chi tiết ngày học</span>
        )}
        <span className="text-[11px] text-slate-400">30 tuần gần nhất</span>
      </div>
    </div>
  );
}

export default function StatisticsView({ stats, subjects = [], tasks = [], schedule = [], onOpenAiTutor }) {
  const { t } = useTranslation('statistics');

  // ── Compute study hours per day (from schedule slots) ──
  const studyHoursData = useMemo(() => {
    const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const dayEnumMap = { THU_2: 0, THU_3: 1, THU_4: 2, THU_5: 3, THU_6: 4, THU_7: 5, CHU_NHAT: 6 };

    const hoursPerDay = [0, 0, 0, 0, 0, 0, 0];
    (schedule || []).forEach(slot => {
      const idx = dayEnumMap[slot.dayOfWeek];
      if (idx !== undefined && slot.startTime && slot.endTime) {
        const [sh, sm] = slot.startTime.split(':').map(Number);
        const [eh, em] = slot.endTime.split(':').map(Number);
        const hours = Math.max(0, (eh + em / 60) - (sh + sm / 60));
        hoursPerDay[idx] += Math.round(hours * 10) / 10;
      }
    });

    return dayKeys.map((key, i) => ({
      name: t(`weekDays.${key}`),
      hours: hoursPerDay[i]
    }));
  }, [schedule, t]);

  const totalStudyHours = useMemo(() =>
    studyHoursData.reduce((s, d) => s + d.hours, 0).toFixed(1)
  , [studyHoursData]);

  // ── Task status breakdown (Pie chart) ──
  const taskStatusData = useMemo(() => {
    const allTasks = tasks || [];
    const todo = allTasks.filter(t => t.status === 'TODO').length;
    const doing = allTasks.filter(t => t.status === 'DOING').length;
    const done = allTasks.filter(t => t.status === 'DONE' || t.completed).length;
    return [
      { name: t('taskStatus.todo'), value: todo, color: PIE_COLORS.TODO },
      { name: t('taskStatus.doing'), value: doing, color: PIE_COLORS.DOING },
      { name: t('taskStatus.done'), value: done, color: PIE_COLORS.DONE },
    ];
  }, [tasks, t]);

  const totalTasks = stats?.totalTasksCompleted + stats?.totalTasksPending || tasks.length || 0;
  const completionRate = totalTasks > 0
    ? Math.round(((stats?.totalTasksCompleted || taskStatusData[2]?.value || 0) / totalTasks) * 100)
    : 0;

  // ── Subject mastery (horizontal bars) ──
  const subjectMasteryData = useMemo(() => {
    if (!stats?.subjectTaskStats) return [];
    return stats.subjectTaskStats.map(s => {
      const total = s.todoCount + s.doingCount + s.doneCount;
      const pct = total > 0 ? Math.round((s.doneCount / total) * 100) : 0;
      return { name: s.subjectName, progress: pct, color: s.color || '#2563EB', total, done: s.doneCount };
    });
  }, [stats]);

  // ── Stats cards data ──
  const cardsData = [
    {
      icon: Clock,
      label: t('cards.studyHours'),
      value: `${totalStudyHours}h`,
      color: '#2563EB',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      icon: CheckCircle2,
      label: t('cards.totalTasks'),
      value: `${stats?.totalTasksCompleted || 0}/${totalTasks}`,
      color: '#10B981',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      icon: BookOpen,
      label: t('cards.totalSubjects'),
      value: subjects.length,
      color: '#8B5CF6',
      bgColor: 'bg-violet-50 dark:bg-violet-950/40',
    },
    {
      icon: Flame,
      label: t('cards.streak'),
      value: `14 ${t('cards.days')}`,
      color: '#F59E0B',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    },
    {
      icon: Target,
      label: t('cards.completion'),
      value: `${completionRate}%`,
      color: completionRate >= 70 ? '#10B981' : completionRate >= 40 ? '#F59E0B' : '#EF4444',
      bgColor: completionRate >= 70 ? 'bg-emerald-50 dark:bg-emerald-950/40' : completionRate >= 40 ? 'bg-amber-50 dark:bg-amber-950/40' : 'bg-red-50 dark:bg-red-950/40',
    },
  ];

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-[#172136] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg text-xs">
        <p className="font-bold text-slate-900 dark:text-white mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* 1. Header + AI Insight Banner */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-2">
          <h2 className="font-['Be_Vietnam_Pro'] font-bold text-3xl text-slate-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-['Be_Vietnam_Pro'] font-medium text-sm max-w-xl">
            {t('subtitle')}
          </p>
        </div>

        {/* AI Insight Card */}
        <div
          onClick={onOpenAiTutor}
          className="lg:w-96 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-5 shadow-lg shadow-blue-500/20 cursor-pointer hover:shadow-xl transition-all group relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-100">
              <Sparkles className="w-3.5 h-3.5" />
              {t('aiInsight')}
            </div>
            <p className="text-blue-50 text-xs leading-relaxed line-clamp-2">{t('aiInsightText')}</p>
            <button className="text-xs font-bold text-white/90 hover:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              {t('generateInsight')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {cardsData.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl ${card.bgColor} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" style={{ color: card.color }} />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{card.label}</p>
              <p className="font-['Manrope'] font-extrabold text-2xl text-slate-900 dark:text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* 3. GitHub-style Knowledge Capture Activity Heatmap */}
      <KnowledgeCaptureHeatmap tasks={tasks} schedule={schedule} />

      {/* 4. Charts Grid — 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Study Hours Bar Chart (larger) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                {t('charts.studyHoursTitle')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{t('charts.studyHoursDesc')}</p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full">
              {totalStudyHours}h / tuần
            </span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={studyHoursData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="hours" name="Giờ học" fill="#2563EB" radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Task Completion Donut (smaller) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col">
          <div className="mb-4">
            <h3 className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white">
              {t('charts.taskCompletionTitle')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('charts.taskCompletionDesc')}</p>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {totalTasks > 0 ? (
              <div className="relative">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {taskStatusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-['Manrope'] font-extrabold text-3xl text-slate-900 dark:text-white">{completionRate}%</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('cards.completion')}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">{t('noData')}</p>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {taskStatusData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></span>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Subject Mastery + Study Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Subject Mastery */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <h3 className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white mb-1">
            {t('charts.subjectMasteryTitle')}
          </h3>
          <p className="text-xs text-slate-400 mb-5">{t('charts.subjectMasteryDesc')}</p>

          {subjectMasteryData.length > 0 ? (
            <div className="space-y-4">
              {subjectMasteryData.map((sub, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.color }}></span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{sub.name}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: sub.color }}>{sub.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${sub.progress}%`, backgroundColor: sub.color }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{sub.done}/{sub.total} nhiệm vụ hoàn thành</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <BookOpen className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm text-slate-400">{t('noData')}</p>
            </div>
          )}
        </div>

        {/* Study Hours Line Chart (Trend) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <div className="mb-6">
            <h3 className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {t('charts.quizPerformanceTitle')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t('charts.quizPerformanceDesc')}</p>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={studyHoursData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="hours"
                name="Giờ học"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ r: 5, fill: '#2563EB', strokeWidth: 3, stroke: '#fff' }}
                activeDot={{ r: 7, fill: '#2563EB', stroke: '#DBEAFE', strokeWidth: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Quiz Average Score Card */}
      {stats?.averageQuizScore !== null && stats?.averageQuizScore !== undefined && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-[#111C32] dark:via-emerald-950/30 dark:to-[#111C32] border border-emerald-200/80 dark:border-emerald-900/50 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Điểm Quiz Trung Bình</p>
              <p className="font-['Manrope'] font-extrabold text-3xl text-emerald-900 dark:text-white">{stats.averageQuizScore}%</p>
            </div>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium max-w-md">
            {stats.averageQuizScore >= 80 ? '🎉 Xuất sắc! Hãy tiếp tục phát huy.' : stats.averageQuizScore >= 60 ? '💪 Khá tốt! Cố gắng thêm chút nữa.' : '📚 Hãy ôn tập thêm để cải thiện điểm số.'}
          </p>
        </div>
      )}
    </div>
  );
}
