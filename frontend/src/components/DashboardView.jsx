import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Pause,
  RotateCcw,
  Timer,
  Coffee,
  CalendarCheck,
  ClipboardList,
  BookOpen,
  FileText,
  BarChart3,
  Target,
  Flame,
  TreePine
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import TodoList from './TodoList';

export default function DashboardView({ data, onNavigate, onOpenNewSubject, onSubjectClick }) {
  const { t, i18n } = useTranslation('dashboard');
  const [tasks, setTasks] = useState(data.tasks || []);

  // ── Pomodoro Timer State ──
  const [pomodoroMode, setPomodoroMode] = useState('WORK'); // 'WORK' | 'SHORT_BREAK' | 'LONG_BREAK'
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [pomodoroSubject, setPomodoroSubject] = useState('');

  const modeTimes = useMemo(() => ({
    WORK: 25 * 60,
    SHORT_BREAK: 5 * 60,
    LONG_BREAK: 15 * 60,
  }), []);

  const handleSwitchMode = (mode) => {
    setPomodoroMode(mode);
    setIsPomodoroRunning(false);
    setPomodoroSeconds(modeTimes[mode]);
  };

  const resetPomodoro = () => {
    setIsPomodoroRunning(false);
    setPomodoroSeconds(modeTimes[pomodoroMode]);
  };

  const togglePomodoro = () => {
    setIsPomodoroRunning(prev => !prev);
  };

  useEffect(() => {
    let timer = null;
    if (isPomodoroRunning) {
      timer = setInterval(() => {
        setPomodoroSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsPomodoroRunning(false);
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              osc.start();
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
              osc.stop(ctx.currentTime + 1.2);
            } catch (e) {}

            if (pomodoroMode === 'WORK') {
              setCompletedPomodoros(c => c + 1);
              setPomodoroMode('SHORT_BREAK');
              return modeTimes.SHORT_BREAK;
            } else {
              setPomodoroMode('WORK');
              return modeTimes.WORK;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPomodoroRunning, pomodoroMode, modeTimes]);

  const pMinutes = String(Math.floor(pomodoroSeconds / 60)).padStart(2, '0');
  const pSeconds = String(pomodoroSeconds % 60).padStart(2, '0');
  const pTotal = modeTimes[pomodoroMode];
  const pProgress = ((pTotal - pomodoroSeconds) / pTotal) * 100;

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
          <span>Xem thống kê</span>
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
              <p className="text-[12px] font-bold text-slate-500 dark:text-slate-300 mb-0.5">{card.label}</p>
              <p className="font-['Manrope'] font-extrabold text-xl text-slate-900 dark:text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* 3. Main Layout: TodoList (Left) + Pomodoro & Progress (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: TodoList */}
        <div className="lg:col-span-7 h-[650px]">
          <TodoList
            tasks={tasks}
            subjects={data.subjects}
            onTaskAdd={(t) => {
              // Add optimistic logic or call parent prop if it exists
              // For now, we update local state if parent prop doesn't exist
              const newTask = { ...t, id: Date.now(), createdAt: new Date().toISOString() };
              setTasks(prev => [newTask, ...prev]);
            }}
            onTaskUpdate={(id, updates) => {
              setTasks(prev => prev.map(tk => tk.id === id ? { ...tk, ...updates } : tk));
            }}
            onTaskDelete={(id) => {
              setTasks(prev => prev.filter(tk => tk.id !== id));
            }}
            onStartPomodoro={(task) => {
              if (task.subjectId) {
                setPomodoroSubject(task.subjectId.toString());
              }
              setIsPomodoroRunning(true);
            }}
          />
        </div>

        {/* Right: Pomodoro + Progress Ring */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Pomodoro Focus Timer Widget */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 border border-indigo-500/20 shadow-xl relative overflow-hidden flex-shrink-0">
            <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex flex-col items-center justify-between gap-4 relative z-10 text-center">
              
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mx-auto">
                  <Timer className="w-3.5 h-3.5" />
                  <span>Pomodoro tập trung</span>
                </div>
                <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-white">
                  {pomodoroMode === 'WORK' ? 'Tập trung' : pomodoroMode === 'SHORT_BREAK' ? 'Nghỉ ngắn' : 'Nghỉ dài'}
                </h3>
              </div>

              <div className="font-['Manrope'] font-black text-5xl sm:text-6xl tracking-wider text-white font-mono drop-shadow-md my-2">
                {pMinutes}:{pSeconds}
              </div>

              <select
                value={pomodoroSubject}
                onChange={(e) => setPomodoroSubject(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-400 mb-2"
              >
                <option value="" className="text-slate-900">Đang học: [Tự do]</option>
                {(data.subjects || []).map(s => (
                  <option key={s.id} value={s.id} className="text-slate-900">{s.name}</option>
                ))}
              </select>

              <div className="flex items-center justify-center gap-2 w-full">
                <button
                  onClick={togglePomodoro}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all ${
                    isPomodoroRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isPomodoroRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPomodoroRunning ? 'Tạm dừng' : 'Bắt đầu'}</span>
                </button>

                <button
                  onClick={resetPomodoro}
                  title="Đặt lại"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="flex items-center justify-center gap-1 mt-2 w-full bg-black/20 p-1 rounded-xl">
                <button onClick={() => handleSwitchMode('WORK')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${pomodoroMode === 'WORK' ? 'bg-blue-500/80 text-white' : 'text-slate-400 hover:text-white'}`}>25m</button>
                <button onClick={() => handleSwitchMode('SHORT_BREAK')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${pomodoroMode === 'SHORT_BREAK' ? 'bg-emerald-500/80 text-white' : 'text-slate-400 hover:text-white'}`}>5m</button>
                <button onClick={() => handleSwitchMode('LONG_BREAK')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${pomodoroMode === 'LONG_BREAK' ? 'bg-purple-500/80 text-white' : 'text-slate-400 hover:text-white'}`}>15m</button>
              </div>

            </div>
          </div>

          {/* Progress Ring Card */}
          <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-6 flex-1">
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#F1F5F9" className="dark:stroke-slate-800/80" strokeWidth="10" fill="transparent" />
                <circle cx="60" cy="60" r="50" stroke="#2563EB" strokeWidth="10"
                  strokeDasharray="314" strokeDashoffset={314 - (314 * goalPercent) / 100}
                  strokeLinecap="round" fill="transparent" className="transition-all duration-1000 ease-out" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-['Manrope'] font-extrabold text-2xl text-slate-900 dark:text-white">{goalPercent}%</span>
                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('completedLabel')}</span>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                <TrendingUp className="w-3 h-3" />
                {goalPercent > 0 ? "Tiến độ học tập rất tốt!" : "Hãy bắt đầu nhiệm vụ đầu tiên hôm nay"}
              </div>
              <h4 className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white">Tiến độ hằng ngày</h4>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Weekly Study Hours Bar Chart */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs mt-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Giờ học trong tuần
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Số giờ học mỗi ngày trong tuần này
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{totalWeekHours}h</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={weeklyChartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={25} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="hours" fill="#2563EB" radius={[8, 8, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
