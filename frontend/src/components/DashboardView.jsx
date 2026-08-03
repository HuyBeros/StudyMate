import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  TrendingUp, 
  ChevronRight,
  Play
} from 'lucide-react';

export default function DashboardView({ data, onNavigate, onOpenNewSubject, onOpenAiTutor }) {
  const [tasks, setTasks] = useState(data.tasks);

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* 1. Greeting Header */}
      <div className="space-y-1">
        <h2 className="font-['Outfit'] font-bold text-3xl text-slate-900 dark:text-white flex items-center gap-2">
          Chào buổi sáng, {data.user?.fullName || 'Minh Anh'}! <span className="animate-bounce inline-block">👋</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-base">
          Bạn đã hoàn thành {data.user?.dailyGoalPercent || 75}% mục tiêu ngày hôm nay. Tiếp tục nhé!
        </p>
      </div>

      {/* 2. Top Main 2-Column Grid (Progress Card & Right Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Progress Ring & Stats (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111C32] rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-col justify-between transition-colors">
          <div className="flex flex-col md:flex-row items-center gap-8 my-auto">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#F1F5F9"
                  className="dark:stroke-slate-800/80"
                  strokeWidth="14"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#2563EB"
                  strokeWidth="14"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * (data.user?.dailyGoalPercent || 75)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-['Outfit'] font-extrabold text-4xl text-slate-900 dark:text-white">
                  {data.user?.dailyGoalPercent || 75}%
                </span>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                  Đã xong
                </span>
              </div>
            </div>

            {/* Right Progress Description */}
            <div className="space-y-4 text-center md:text-left flex-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tiến độ tốt hơn hôm qua 15%</span>
              </div>

              <h3 className="font-['Outfit'] font-bold text-2xl text-slate-900 dark:text-white leading-snug">
                Tiến độ học tập hàng ngày
              </h3>

              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Bạn đã dành <strong className="text-slate-800 dark:text-slate-200 font-semibold">{data.user?.hoursStudied || 4.5} giờ</strong> để học tập trong hôm nay. Mục tiêu của bạn là {data.user?.goalHours || 6.0} giờ.
              </p>

              {/* Sub-stats Grid */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Bài tập</span>
                  <span className="font-['Outfit'] font-bold text-lg text-slate-900 dark:text-white">12/15</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Ghi chú</span>
                  <span className="font-['Outfit'] font-bold text-lg text-slate-900 dark:text-white">8</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium block">Streak</span>
                  <span className="font-['Outfit'] font-bold text-lg text-slate-900 dark:text-white flex items-center justify-center md:justify-start gap-1">
                    ⚡ {data.user?.streak || 14} ngày
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Next Session Card & Tasks List (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          
          {/* Next Class Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold tracking-wide text-blue-100">
                Tiếp theo
              </div>

              <div>
                <h4 className="font-['Outfit'] font-bold text-2xl leading-tight">
                  Toán học: Giải tích
                </h4>
                <p className="text-blue-100 text-xs font-medium mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Bắt đầu lúc 14:00 (Trong 25 phút nữa)
                </p>
              </div>

              <button 
                onClick={() => onNavigate('schedule')}
                className="w-full bg-white hover:bg-blue-50 text-blue-600 dark:text-blue-600 font-bold text-sm py-3 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bắt đầu ngay</span>
              </button>
            </div>
          </div>

          {/* Tasks Container */}
          <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex-1 flex flex-col justify-between transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-['Outfit'] font-bold text-xl text-slate-900 dark:text-white">
                Nhiệm vụ
              </h4>
              <button className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-start gap-3.5 p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
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
                    <p className={`text-sm font-semibold text-slate-900 dark:text-slate-100 transition-all ${
                      task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}>
                      {task.title}
                    </p>
                    <span 
                      className="inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-md"
                      style={{ backgroundColor: `${task.subjectColor}20`, color: task.subjectColor }}
                    >
                      {task.subject}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 3. AI Tutor Suggestion Banner */}
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
              Gợi ý từ AI Tutor
            </span>
            <p className="text-slate-700 dark:text-slate-300 text-sm italic font-medium leading-relaxed max-w-3xl">
              "Có vẻ như bạn đang gặp khó khăn với phần <strong className="text-blue-900 dark:text-blue-200 not-italic">Tích phân</strong>. Tôi đã chuẩn bị một bài tóm tắt ngắn gọn và 5 bài tập thực hành dành riêng cho bạn."
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm hover:text-blue-700 shrink-0 group-hover:translate-x-1 transition-transform">
          <span>Xem gợi ý chi tiết</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4. My Subjects Section Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-['Outfit'] font-bold text-2xl text-slate-900 dark:text-white">
              Môn học của bạn
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              Quản lý và theo dõi các khóa học đang tham gia
            </p>
          </div>

          <button 
            onClick={() => onNavigate('subjects')}
            className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold text-sm hover:underline"
          >
            <span>Xem tất cả môn học</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.subjects.slice(0, 3).map((sub) => (
            <div
              key={sub.id}
              onClick={() => onNavigate('subjects')}
              className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden cursor-pointer card-hover-effect flex flex-col justify-between transition-colors"
            >
              {/* Card Banner Image */}
              <div className="h-32 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img 
                  src={sub.image} 
                  alt={sub.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-3 left-4 text-white">
                  <span className="font-['Outfit'] font-bold text-lg leading-tight block">
                    {sub.name}
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">Đã hoàn thành</span>
                    <span className="text-slate-900 dark:text-white font-bold">{sub.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500" 
                      style={{ width: `${sub.progress}%`, backgroundColor: sub.color }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span>{sub.totalDocuments} tài liệu</span>
                  <span>•</span>
                  <span>{sub.totalNotes} ghi chú</span>
                </div>
              </div>
            </div>
          ))}

          {/* Add New Subject Card */}
          <div
            onClick={onOpenNewSubject}
            className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-blue-50/50 dark:hover:bg-slate-900/50 group min-h-[220px]"
          >
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-7 h-7" />
            </div>
            <span className="font-['Outfit'] font-bold text-slate-800 dark:text-slate-200 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Thêm môn học mới
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
