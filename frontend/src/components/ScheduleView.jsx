import React, { useState } from 'react';
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
  GraduationCap
} from 'lucide-react';

export default function ScheduleView({ schedule, tasks, onOpenNewSession, onOpenAiTutor }) {
  const [selectedDay, setSelectedDay] = useState(17);
  const [taskList, setTaskList] = useState(tasks);

  const daysOfWeek = [
    { label: 'THỨ 2', date: 16 },
    { label: 'THỨ 3', date: 17 },
    { label: 'THỨ 4', date: 18 },
    { label: 'THỨ 5', date: 19 },
    { label: 'THỨ 6', date: 20 },
    { label: 'THỨ 7', date: 21 },
    { label: 'CHỦ NHẬT', date: 22 },
  ];

  const toggleTask = (id) => {
    setTaskList(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Month Navigation Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-['Outfit'] font-bold text-3xl text-slate-900 dark:text-white">
          Tháng 10, 2023
        </h2>

        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-2xs">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-2xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shadow-2xs">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Days of Week Selector Bar */}
      <div className="grid grid-cols-7 gap-3">
        {daysOfWeek.map((day) => {
          const isActive = selectedDay === day.date;
          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(day.date)}
              className={`p-4 rounded-3xl flex flex-col items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                  : 'bg-white dark:bg-[#111C32] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/80'
              }`}
            >
              <span className={`text-[11px] font-bold tracking-wider mb-1 ${isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'}`}>
                {day.label}
              </span>
              <span className="font-['Outfit'] font-extrabold text-2xl">
                {day.date}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Main 2-Column Schedule Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Tasks List & Today Progress */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Tasks Container */}
          <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-['Outfit'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Nhiệm vụ
              </h3>
              <button 
                onClick={onOpenNewSession}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-3">
              {taskList.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    task.completed 
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-transparent opacity-60' 
                      : 'bg-slate-50/50 dark:bg-[#172136] border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-[#111C32] hover:border-blue-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button className="text-blue-600 dark:text-blue-400">
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                    <div>
                      <p className={`text-sm font-semibold text-slate-900 dark:text-white ${task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        {task.title}
                      </p>
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1 ${task.priorityClass || 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'}`}>
                        {task.priority || 'BÌNH THƯỜNG'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-medium text-slate-400 dark:text-slate-400">
                    {task.deadlineTime || '14:00'}
                  </span>
                </div>
              ))}
            </div>

            {/* Dashed Add Task Button */}
            <button 
              onClick={onOpenNewSession}
              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm nhiệm vụ mới</span>
            </button>
          </div>

          {/* Today Progress Widget */}
          <div className="bg-blue-50/80 dark:bg-[#172136] border border-blue-100 dark:border-slate-800 rounded-3xl p-6 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-blue-900 dark:text-blue-300">
              <span>Tiến độ hôm nay</span>
              <span className="font-['Outfit'] text-xl text-blue-600 dark:text-blue-400">68%</span>
            </div>
            <div className="w-full h-2.5 bg-blue-200/50 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: '68%' }}></div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Còn 3 nhiệm vụ cần hoàn thành
            </p>
          </div>

        </div>

        {/* Right Column: Detailed Timetable Timeline */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-['Outfit'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Lịch trình chi tiết
            </h3>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 rounded-full">
                Hôm nay
              </span>
            </div>
          </div>

          {/* Timeline Slots */}
          <div className="space-y-6 relative pl-4 border-l-2 border-slate-100 dark:border-slate-800">
            {schedule.map((item) => (
              <div key={item.id} className="relative pl-6 group">
                {/* Timeline Dot */}
                <div className="absolute -left-[25px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-4 border-white dark:border-[#111C32] shadow-xs"></div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <span className="font-['Outfit'] font-bold text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {item.time}
                  </span>
                </div>

                <div className="p-5 rounded-2xl border transition-all bg-blue-50/50 dark:bg-[#172136] border-blue-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-['Outfit'] font-bold text-lg leading-tight mb-2 text-slate-900 dark:text-white">
                        {item.subjectName}
                      </h4>
                      <div className="flex flex-wrap items-center gap-4 text-xs opacity-80 text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {item.room}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {item.teacher}
                        </span>
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

            {/* Lunch break indicator */}
            <div className="text-center py-2 text-xs italic font-medium text-slate-400 dark:text-slate-500">
              Nghỉ trưa (12:00 - 13:30)
            </div>
          </div>
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
            <h4 className="font-['Outfit'] font-bold text-xl">
              Cần giúp tối ưu hóa lịch trình?
            </h4>
            <p className="text-teal-100 text-sm font-medium">
              Hãy hỏi AI để sắp xếp lại các nhiệm vụ dựa trên độ ưu tiên và thời gian của bạn.
            </p>
          </div>
        </div>

        <button className="bg-white hover:bg-teal-50 text-teal-900 font-bold text-sm py-3.5 px-6 rounded-2xl shadow-md transition-all shrink-0 flex items-center gap-2">
          <span>Hỏi AI Trợ Lý</span>
          <Sparkles className="w-4 h-4 text-teal-600" />
        </button>
      </div>

    </div>
  );
}
