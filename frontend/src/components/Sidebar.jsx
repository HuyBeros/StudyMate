import React from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  BarChart3,
  User, 
  Settings, 
  Users,
  HelpCircle,
  GraduationCap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { t } = useTranslation('common');

  const navItems = [
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
    { id: 'subjects',  labelKey: 'nav.subjects',  icon: BookOpen },
    { id: 'schedule',  labelKey: 'nav.schedule',  icon: Calendar },
    { id: 'study-rooms', labelKey: 'nav.studyRooms', icon: Users },
    { id: 'statistics', labelKey: 'nav.statistics', icon: BarChart3 },
    { id: 'profile',    labelKey: 'nav.profile',     icon: User },
  ];

  return (
    <>
    <aside className="hidden md:flex w-64 bg-white/90 dark:bg-[#070C18] backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/60 h-screen fixed left-0 top-0 flex flex-col justify-between p-5 z-30 transition-colors duration-300">
      <div>
        {/* Logo StudyMate */}
        <div className="flex items-center gap-3 px-2 py-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-['Space_Grotesk'] font-bold text-xl text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              StudyMate
            </h1>
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full inline-block">
              Học tập thông minh
            </span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (item.id === 'subjects' && activeTab === 'subject-detail');
            return (
              <button
                aria-current={isActive ? 'page' : undefined}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-['Inter'] font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`} />
                  <span>{t(item.labelKey)}</span>
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

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
          <button 
            onClick={() => setActiveTab('settings')}
            aria-current={activeTab === 'settings' ? 'page' : undefined}
            className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-['Inter'] text-sm transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950 dark:text-blue-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <Settings className="w-4 h-4" />
            <span>{t('nav.settings')}</span>
          </button>
          <button 
            onClick={() => setActiveTab('help')}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-['Inter'] text-sm text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t('nav.help')}</span>
          </button>
        </div>
    </aside>
    <nav aria-label="Điều hướng chính" className="mobile-nav md:hidden fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-700 grid grid-cols-6 px-1">
      {navItems.map(item => { const Icon = item.icon; const selected = activeTab === item.id || (item.id === 'subjects' && activeTab === 'subject-detail'); return <button key={item.id} onClick={() => setActiveTab(item.id)} aria-current={selected ? 'page' : undefined} className={`flex flex-col items-center justify-center gap-1 min-h-16 px-1 text-[10px] font-semibold ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}><Icon className="w-5 h-5" /><span>{item.id === 'dashboard' ? 'Trang chủ' : t(item.labelKey)}</span></button>; })}
    </nav>
    </>
  );
}
