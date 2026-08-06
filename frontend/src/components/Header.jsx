import React, { useState, useRef, useEffect } from 'react';
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
  GraduationCap,
  Languages,
  Check
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n';

export default function Header({ 
  user, 
  onOpenAuth,
  onOpenProfile,
  onLogout,
  darkMode,
  setDarkMode
}) {
  const { t, i18n } = useTranslation('common');
  const [isDropdownOpen, setIsDropdownOpen]   = useState(false);
  const [showLangMenu, setShowLangMenu]       = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        setShowLangMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language)
    ?? SUPPORTED_LANGUAGES[0];

  const handleChangeLang = (code) => {
    i18n.changeLanguage(code);
    setShowLangMenu(false);
  };

  return (
    <header className="h-20 bg-white/70 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 right-0 z-20 px-8 flex items-center justify-between transition-colors">

      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t('header.searchPlaceholder')}
          className="w-full bg-slate-100/80 dark:bg-[#172136] border border-transparent focus:border-blue-500 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 pl-11 pr-12 py-2.5 rounded-full transition-all outline-none"
        />
        <kbd className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 dark:text-slate-400 bg-white dark:bg-[#0B0F19] px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs">
          ⌘K
        </kbd>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          title={darkMode ? t('header.darkMode') : t('header.darkMode')}
          className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Notification Bell */}
        <button className="relative w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0B0F19] animate-ping" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0B0F19]" />
        </button>

        {/* History */}
        <button className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
          <History className="w-5 h-5" />
        </button>

        {/* ── User area ───────────────────────────────────────────── */}
        {!user || !user.email ? (

          /* Chưa đăng nhập */
          <div className="flex items-center gap-3">
            <span className="hidden md:block text-xs font-['Inter'] text-slate-400 dark:text-slate-500">
              {t('header.notLoggedIn')}
            </span>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={onOpenAuth}
              className="
                relative group flex items-center gap-2.5
                px-5 py-2.5 rounded-2xl
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:from-blue-500 hover:to-indigo-500
                dark:from-blue-500 dark:to-indigo-500
                dark:hover:from-blue-400 dark:hover:to-indigo-400
                text-white font-['Inter'] font-semibold text-sm
                shadow-md shadow-blue-500/30 dark:shadow-blue-500/20
                hover:shadow-lg hover:shadow-blue-500/40
                hover:scale-[1.03] active:scale-[0.97]
                transition-all duration-200
              "
            >
              <span className="absolute inset-0 rounded-2xl bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
              <LogIn className="w-4 h-4 shrink-0 relative z-10" />
              <span className="relative z-10">{t('header.login')}</span>
              <span className="absolute -inset-0.5 rounded-[18px] border border-blue-400/40 dark:border-blue-300/30 group-hover:border-transparent transition-colors duration-200" />
            </button>
          </div>

        ) : (

          /* Đã đăng nhập: Profile badge + dropdown */
          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => { setIsDropdownOpen(!isDropdownOpen); setShowLangMenu(false); }}
              className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors group"
            >
              <div className="text-right hidden sm:block">
                <h4 className="font-['Be_Vietnam_Pro'] font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-end gap-1">
                  <span>{user?.fullName || 'Bạn'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {user?.role || 'Student'}
                </p>
              </div>
              <div className="relative">
                <img
                  src={user?.avatar || user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"}
                  alt={user?.fullName || 'User'}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500/50 transition-all"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0B0F19]" />
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111C32] rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in duration-200">

                {/* User info */}
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.fullName || 'Bạn'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {user?.email || ''}
                  </p>
                </div>

                <div className="py-1">

                  {/* Profile */}
                  <button
                    onClick={() => { setIsDropdownOpen(false); onOpenProfile(); }}
                    className="w-full px-4 py-2.5 text-left font-['Inter'] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t('header.profile')}</span>
                  </button>

                  {/* Dark Mode toggle */}
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-full px-4 py-2.5 text-left font-['Inter'] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                      <span>{t('header.darkMode')}</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </button>

                  {/* ── Language Switcher ──────────────────────────── */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLangMenu(!showLangMenu)}
                      className="w-full px-4 py-2.5 text-left font-['Inter'] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Languages className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                        <span>{t('header.language')}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base leading-none">{currentLang.flag}</span>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                          {currentLang.code.toUpperCase()}
                        </span>
                        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${showLangMenu ? '-rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Language submenu */}
                    {showLangMenu && (
                      <div className="mx-2 mb-1 rounded-xl bg-slate-50 dark:bg-[#172136] border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                        {SUPPORTED_LANGUAGES.map(lang => {
                          const isActive = i18n.language === lang.code;
                          return (
                            <button
                              key={lang.code}
                              onClick={() => handleChangeLang(lang.code)}
                              className={`w-full px-4 py-2.5 text-left font-['Inter'] text-xs font-semibold flex items-center justify-between transition-colors ${
                                isActive
                                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base leading-none">{lang.flag}</span>
                                <span>{lang.label}</span>
                              </div>
                              {isActive && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Logout */}
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
