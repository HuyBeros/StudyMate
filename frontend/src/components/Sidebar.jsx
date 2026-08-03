import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Sparkles, 
  User, 
  Plus, 
  Settings, 
  HelpCircle,
  GraduationCap
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenNewSession }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'ai-tutor', label: 'AI Tutor', icon: Sparkles, badge: 'AI' },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-white/90 dark:bg-[#070C18] backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/60 h-screen fixed left-0 top-0 flex flex-col justify-between p-5 z-30 transition-colors duration-300">
      <div>
        {/* Logo EduFlow */}
        <div className="flex items-center gap-3 px-2 py-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-['Outfit'] font-bold text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              EduFlow
            </h1>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full inline-block">
              Study Smart
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xs animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Lower Section */}
      <div className="space-y-4">
        {/* + New Study Session Action Button */}
        <button
          onClick={onOpenNewSession}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm py-3.5 px-4 rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" />
          <span>New Study Session</span>
        </button>

        {/* Settings & Help */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          <button 
            onClick={() => setActiveTab('settings')}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
          <button 
            onClick={() => setActiveTab('help')}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
