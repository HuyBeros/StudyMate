import React, { useState, useMemo, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Video, 
  GraduationCap,
  CalendarOff,
  ClipboardList,
  CalendarDays
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────

const VI_DAY_LABELS = ['CHỦ NHẬT', 'THỨ 2', 'THỨ 3', 'THỨ 4', 'THỨ 5', 'THỨ 6', 'THỨ 7'];

function getStartOfWeek(date) {
  // Tuần bắt đầu từ THỨ 2 (Monday)
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return {
      date: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      fullDate: new Date(d),
      // Thứ 2 → index 0 trong mảng, Sunday → index 6
      label: i === 6 ? 'CHỦ NHẬT' : `THỨ ${i + 2}`,
    };
  });
}

function formatMonthYear(date) {
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

function isSameDay(a, b) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ScheduleView({ schedule = [], tasks = [], onOpenNewSession, onOpenAiTutor }) {
  const today = useMemo(() => new Date(), []);

  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(today));
  const [selectedDay, setSelectedDay] = useState(() => today);
  const [taskList, setTaskList] = useState(tasks);
  const dateInputRef = useRef(null);

  // Sync taskList khi prop tasks thay đổi
  React.useEffect(() => {
    setTaskList(tasks);
  }, [tasks]);

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);

  // Tên tháng hiển thị — dùng tháng của ngày được chọn hoặc tuần hiện tại
  const displayMonth = formatMonthYear(selectedDay);

  // Lọc lịch theo ngày đã chọn
  const scheduleForDay = useMemo(() => {
    if (!schedule || schedule.length === 0) return [];
    return schedule.filter(item => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      return isSameDay(itemDate, selectedDay);
    });
  }, [schedule, selectedDay]);

  // Stats nhiệm vụ
  const totalTasks = taskList.length;
  const doneTasks = taskList.filter(t => t.completed || t.status === 'DONE').length;
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const remainingTasks = totalTasks - doneTasks;

  const toggleTask = (id) => {
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const goToPrevWeek = () => {
    setWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToToday = () => {
    setWeekStart(getStartOfWeek(today));
    setSelectedDay(today);
  };

  // Xử lý khi user chọn ngày từ date picker
  const handleDatePickerChange = (e) => {
    if (!e.target.value) return;
    const picked = new Date(e.target.value + 'T00:00:00');
    setWeekStart(getStartOfWeek(picked));
    setSelectedDay(picked);
  };

  // Format ngày hiện tại sang YYYY-MM-DD cho value của input
  const datePickerValue = [
    selectedDay.getFullYear(),
    String(selectedDay.getMonth() + 1).padStart(2, '0'),
    String(selectedDay.getDate()).padStart(2, '0'),
  ].join('-');

  const isSelectedDayToday = isSameDay(selectedDay, today);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* 1. Month Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-['Be_Vietnam_Pro'] font-bold text-3xl text-slate-900 dark:text-white">
            {displayMonth}
          </h2>

          {/* Date Picker Button */}
          <div className="relative">
            <button
              onClick={() => dateInputRef.current?.showPicker()}
              title="Chọn ngày nhanh"
              className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-400 dark:hover:border-blue-500 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-2xs"
            >
              <CalendarDays className="w-5 h-5" />
            </button>
            {/* Input ẩn, trigger bằng nút bên trên */}
            <input
              ref={dateInputRef}
              type="date"
              value={datePickerValue}
              onChange={handleDatePickerChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              style={{ colorScheme: 'light dark' }}
            />
          </div>

          {!isSelectedDayToday && (
            <button
              onClick={goToToday}
              className="text-xs font-['Inter'] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            >
              Về hôm nay
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextWeek}
            className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Days of Week Selector Bar */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day) => {
          const isDaySelected = isSameDay(day.fullDate, selectedDay);
          const isDayToday = isSameDay(day.fullDate, today);
          return (
            <button
              key={`${day.year}-${day.month}-${day.date}`}
              onClick={() => setSelectedDay(day.fullDate)}
              className={`p-4 rounded-3xl flex flex-col items-center justify-center transition-all duration-200 ${
                isDaySelected
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'bg-white dark:bg-[#111C32] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              <span className={`text-[11px] font-bold tracking-wider mb-1 ${
                isDaySelected ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'
              }`}>
                {day.label}
              </span>
              <span className="font-['Manrope'] font-extrabold text-2xl">
                {day.date}
              </span>
              {/* Chấm tròn nhỏ đánh dấu hôm nay */}
              {isDayToday && !isDaySelected && (
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Main 2-Column Schedule Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Tasks List & Progress */}
        <div className="lg:col-span-5 space-y-6">

          {/* Tasks Container */}
          <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Nhiệm vụ
              </h3>
              <button
                onClick={onOpenNewSession}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline font-['Inter']"
              >
                + Thêm mới
              </button>
            </div>

            {taskList.length === 0 ? (
              /* Empty state tasks */
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardList className="w-10 h-10 text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">Chưa có nhiệm vụ nào</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Thêm nhiệm vụ mới để bắt đầu theo dõi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {taskList.slice(0, 4).map((task) => {
                  const isCompleted = task.completed || task.status === 'DONE';
                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isCompleted
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-transparent opacity-60'
                          : 'bg-slate-50/50 dark:bg-[#172136] border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-[#111C32] hover:border-blue-200 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-blue-600 dark:text-blue-400">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold text-slate-900 dark:text-white ${
                            isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                          }`}>
                            {task.title}
                          </p>
                          {(task.priority || task.subjectName) && (
                            <span className={`inline-block text-[10px] font-['Inter'] font-bold px-2 py-0.5 rounded-md mt-1 ${
                              task.priorityClass || 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                            }`}>
                              {task.priority || task.subjectName || 'BÌNH THƯỜNG'}
                            </span>
                          )}
                        </div>
                      </div>

                      {task.deadlineTime && (
                        <span className="text-xs font-['Inter'] font-medium text-slate-400 shrink-0">
                          {task.deadlineTime}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dashed Add Task Button */}
            <button
              onClick={onOpenNewSession}
              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl text-xs font-['Inter'] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhiệm vụ mới</span>
            </button>
          </div>

          {/* Today Progress Widget — chỉ hiện nếu có tasks */}
          {totalTasks > 0 && (
            <div className="bg-blue-50/80 dark:bg-[#172136] border border-blue-100 dark:border-slate-800 rounded-3xl p-6 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-blue-900 dark:text-blue-300">
                <span>Tiến độ hôm nay</span>
                <span className="font-['Manrope'] text-xl text-blue-600 dark:text-blue-400 font-bold">
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-blue-200/50 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {remainingTasks > 0
                  ? `Còn ${remainingTasks} nhiệm vụ cần hoàn thành`
                  : '🎉 Bạn đã hoàn thành tất cả nhiệm vụ hôm nay!'}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Timetable Timeline */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Lịch trình chi tiết
            </h3>

            <span className={`text-xs font-['Inter'] font-semibold px-3 py-1 rounded-full ${
              isSelectedDayToday
                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {isSelectedDayToday
                ? 'Hôm nay'
                : `${selectedDay.getDate()}/${selectedDay.getMonth() + 1}/${selectedDay.getFullYear()}`}
            </span>
          </div>

          {/* Timeline Slots hoặc Empty State */}
          {scheduleForDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarOff className="w-14 h-14 text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-base font-['Be_Vietnam_Pro'] font-semibold text-slate-400 dark:text-slate-500">
                Không có lịch học
              </p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1 max-w-xs">
                {isSelectedDayToday
                  ? 'Hôm nay bạn không có lịch học. Hãy tận dụng thời gian ôn tập!'
                  : 'Ngày này chưa có lịch học được lên kế hoạch.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6 relative pl-4 border-l-2 border-slate-100 dark:border-slate-800">
              {scheduleForDay.map((item) => (
                <div key={item.id} className="relative pl-6 group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-[#111C32] shadow-xs" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <span className="font-['Inter'] font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.time || `${item.startTime || ''} - ${item.endTime || ''}`}
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl border transition-all bg-blue-50/50 dark:bg-[#172136] border-blue-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-['Be_Vietnam_Pro'] font-bold text-lg leading-tight mb-2 text-slate-900 dark:text-white">
                          {item.subjectName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs opacity-80 text-slate-600 dark:text-slate-300">
                          {item.room && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" /> {item.room}
                            </span>
                          )}
                          {item.teacher && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" /> {item.teacher}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#111C32] flex items-center justify-center shrink-0 shadow-2xs">
                        {item.iconType === 'Video' ? (
                          <Video className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        ) : (
                          <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom AI Schedule Optimizer Banner */}
      <div
        onClick={onOpenAiTutor}
        className="bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles className="w-7 h-7 text-teal-200 animate-pulse" />
          </div>
          <div>
            <h4 className="font-['Be_Vietnam_Pro'] font-bold text-xl">
              Cần giúp tối ưu hóa lịch trình?
            </h4>
            <p className="text-teal-100 text-sm font-medium">
              Hãy hỏi AI để sắp xếp lại các nhiệm vụ dựa trên độ ưu tiên và thời gian của bạn.
            </p>
          </div>
        </div>

        <button className="bg-white hover:bg-teal-50 text-teal-900 font-['Inter'] font-bold text-sm py-3.5 px-6 rounded-2xl shadow-md transition-all shrink-0 flex items-center gap-2">
          <span>Hỏi AI Trợ Lý</span>
          <Sparkles className="w-4 h-4 text-teal-600" />
        </button>
      </div>

    </div>
  );
}
