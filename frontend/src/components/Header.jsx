import Avatar from './Avatar';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  History,
  User,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  LogIn,
  Settings,
  X,
  BookOpen,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PartyPopper
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Header({
  user,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  darkMode,
  setDarkMode,
  subjects = [],
  tasks = [],
  schedule = [],
  todayData = null,
  onNavigate
}) {
  const { t } = useTranslation('common');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Search State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // ── Notifications State ──
  const [showNotifications, setShowNotifications] = useState(false);
  const [dismissedNotifs, setDismissedNotifs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dismissedNotifs') || '[]'); } catch { return []; }
  });
  const notifRef = useRef(null);

  // ── Click Outside Handlers ──
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Ctrl+K Shortcut ──
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      }
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Search Logic (debounced, client-side) ──
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    const results = [];

    // Search subjects
    subjects.forEach(sub => {
      if (sub.name?.toLowerCase().includes(q) || sub.classCode?.toLowerCase().includes(q)) {
        results.push({ type: 'subject', id: sub.id, title: sub.name, subtitle: sub.classCode || sub.type, icon: BookOpen, color: sub.color || '#2563EB', tab: 'subjects' });
      }
    });

    // Search tasks
    tasks.forEach(task => {
      if (task.title?.toLowerCase().includes(q)) {
        results.push({ type: 'task', id: task.id, title: task.title, subtitle: task.subjectName || 'Nhiệm vụ', icon: CheckCircle2, color: '#10B981', tab: 'tasks' });
      }
    });

    // Search schedule
    schedule.forEach(slot => {
      const name = slot.subjectName || slot.subject?.name || '';
      if (name.toLowerCase().includes(q) || slot.room?.toLowerCase().includes(q) || slot.teacherName?.toLowerCase().includes(q)) {
        const time = [slot.startTime?.slice(0, 5), slot.endTime?.slice(0, 5)].filter(Boolean).join(' – ');
        results.push({ type: 'schedule', id: slot.id, title: name, subtitle: time, icon: Calendar, color: '#2563EB', tab: 'schedule' });
      }
    });

    return results.slice(0, 8);
  }, [searchQuery, subjects, tasks, schedule]);

  // ── Notification Generation ──
  const notifications = useMemo(() => {
    const notifs = [];
    const now = new Date();

    // Overdue tasks
    (tasks || []).forEach(task => {
      if (task.dueAt && !task.completed && task.status !== 'DONE') {
        const deadline = new Date(task.dueAt);
        const diffMs = deadline - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffMs < 0) {
          notifs.push({
            id: `overdue-${task.id}`,
            type: 'danger',
            icon: AlertTriangle,
            title: 'Nhiệm vụ quá hạn',
            message: `"${task.title}" đã quá hạn ${Math.abs(Math.round(diffHours))} giờ`,
            time: deadline,
          });
        } else if (diffHours <= 24) {
          notifs.push({
            id: `due-soon-${task.id}`,
            type: 'warning',
            icon: Clock,
            title: 'Sắp đến hạn',
            message: `"${task.title}" còn ${Math.round(diffHours)} giờ nữa`,
            time: deadline,
          });
        }
      }
    });

    // Upcoming class (within 60 mins)
    const todaySlots = todayData?.todaySlots || [];
    todaySlots.forEach(slot => {
      if (slot.startTime) {
        const [h, m] = slot.startTime.split(':').map(Number);
        const slotTime = new Date();
        slotTime.setHours(h, m, 0);
        const diffMin = (slotTime - now) / (1000 * 60);
        if (diffMin > 0 && diffMin <= 60) {
          notifs.push({
            id: `class-soon-${slot.id}`,
            type: 'info',
            icon: Calendar,
            title: 'Lịch học sắp bắt đầu',
            message: `${slot.subjectName || 'Lớp học'} bắt đầu trong ${Math.round(diffMin)} phút`,
            time: slotTime,
          });
        }
      }
    });

    // Completed daily goal
    const completedTasks = (tasks || []).filter(t => t.completed || t.status === 'DONE').length;
    const totalTasks = (tasks || []).length;
    if (totalTasks > 0 && completedTasks === totalTasks) {
      notifs.push({
        id: `all-done-today`,
        type: 'success',
        icon: PartyPopper,
        title: '🎉 Hoàn thành tất cả!',
        message: 'Bạn đã hoàn thành tất cả nhiệm vụ. Tuyệt vời!',
        time: now,
      });
    }

    return notifs.filter(n => !dismissedNotifs.includes(n.id)).sort((a, b) => b.time - a.time);
  }, [tasks, todayData, dismissedNotifs]);

  const dismissNotif = (id) => {
    const updated = [...dismissedNotifs, id];
    setDismissedNotifs(updated);
    localStorage.setItem('dismissedNotifs', JSON.stringify(updated));
  };

  const handleSearchSelect = (result) => {
    setShowSearchResults(false);
    setSearchQuery('');
    if (onNavigate) onNavigate(result.tab);
  };


  const notifTypeStyles = {
    danger: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
    info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
  };

  return (
    <header className="app-header h-20 bg-white/70 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 right-0 z-20 px-8 flex items-center justify-between transition-colors">

      {/* ── Search ── */}
      <div className="header-search relative w-full max-w-md" ref={searchRef}>
        <Search className="w-4 h-4 text-slate-600 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          ref={searchInputRef}
          type="text"
          aria-label="Tìm kiếm môn học, nhiệm vụ và lịch học" placeholder={t('header.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
          onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
          className="w-full bg-[#f1f5f9] dark:bg-[#172136] border border-transparent focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 pl-11 pr-12 py-2.5 rounded-full transition-all outline-none"
        />
        <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-[#0B0F19] px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
          {navigator.platform.toUpperCase().includes('MAC') ? '⌘K' : 'Ctrl K'}
        </kbd>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111C32] rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in duration-200 max-h-[400px] overflow-y-auto">
            <p className="px-4 py-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              {searchResults.length} kết quả
            </p>
            {searchResults.map((result, i) => {
              const Icon = result.icon;
              return (
                <button
                  key={`${result.type}-${result.id}-${i}`}
                  onClick={() => handleSearchSelect(result)}
                  className="w-full px-4 py-2.5 text-left hover:bg-blue-50 dark:hover:bg-slate-800/60 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${result.color}15` }}>
                    <Icon className="w-4 h-4" style={{ color: result.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{result.title}</p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{result.subtitle}</p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md capitalize shrink-0">
                    {result.type === 'subject' ? 'Môn học' : result.type === 'task' ? 'Nhiệm vụ' : 'Lịch học'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* No results */}
        {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#111C32] rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-6 z-50 text-center">
            <Search className="w-6 h-6 text-slate-600 dark:text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Không tìm thấy kết quả cho "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-4">

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title={t('header.darkMode')} aria-label={t('header.darkMode')} aria-pressed={darkMode}
          className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* ── Notification Bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            title="Thông báo" aria-label={`Thông báo${notifications.length ? `: ${notifications.length} mới` : ''}`} aria-expanded={showNotifications}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <>
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0B0F19] animate-ping" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0B0F19]" />
              </>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="notification-panel absolute right-0 mt-2 w-96 bg-white dark:bg-[#111C32] rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 z-50 animate-in fade-in duration-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h4 className="font-['Be_Vietnam_Pro'] font-bold text-sm text-slate-900 dark:text-white">Thông báo</h4>
                {notifications.length > 0 && (
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                    {notifications.length} mới
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bell className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Không có thông báo mới</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = notif.icon;
                    return (
                      <div
                        key={notif.id}
                        className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${notifTypeStyles[notif.type]?.split(' ').filter(c => c.startsWith('bg-')).join(' ') || 'bg-slate-100'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">{notif.message}</p>
                        </div>
                        <button
                          aria-label="Đánh dấu thông báo đã đọc" onClick={() => dismissNotif(notif.id)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 transition-all shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* History */}
        <button title="Xem lịch sử hoạt động học tập" aria-label="Xem lịch sử hoạt động học tập" onClick={() => onNavigate('statistics')} className="history-button w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
          <History className="w-5 h-5" />
        </button>

        {/* ── User area ── */}
        {!user ? (
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs font-['Inter'] text-slate-600 dark:text-slate-300">
              {t('header.notLoggedIn')}
            </span>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={onOpenAuth}
              className="relative group flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-['Inter'] font-semibold text-sm shadow-md shadow-blue-500/30 hover:shadow-lg hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
            >
              <span className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
              <LogIn className="w-4 h-4 shrink-0 relative z-10" />
              <span className="relative z-10">{t('header.login')}</span>
            </button>
          </div>
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button type="button" aria-label="Mở menu tài khoản" aria-expanded={isDropdownOpen}
              onClick={() => setIsDropdownOpen(open => !open)}
              className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors group"
            >
              <div className="text-right hidden sm:block">
                <h4 className="font-['Be_Vietnam_Pro'] font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-end gap-1">
                  <span>{user?.fullName || 'Bạn'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                </h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-300">{user?.email || user?.username}</p>
              </div>
              <div className="relative">
                <Avatar src={user?.avatar || user?.avatarUrl} name={user?.fullName || 'Người dùng'} className="w-10 h-10 ring-2 ring-blue-500/20" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0B0F19]" />
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111C32] rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in duration-200">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.fullName || 'Bạn'}</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">{user?.email || user?.username}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setIsDropdownOpen(false); onOpenProfile(); }}
                    className="w-full px-4 py-2.5 text-left font-['Inter'] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t('header.profile')}</span>
                  </button>

                  <button
                    onClick={() => { setIsDropdownOpen(false); onNavigate('settings'); }}
                    className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/60 flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Cài đặt</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => { setIsDropdownOpen(false); onLogout(); }}
                    className="w-full px-4 py-2.5 text-left font-['Inter'] text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('header.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
