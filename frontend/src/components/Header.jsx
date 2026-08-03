import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  History, 
  User, 
  Moon, 
  Sun, 
  LogOut, 
  ChevronDown
} from 'lucide-react';

export default function Header({ 
  user, 
  placeholder = "Tìm kiếm tài liệu, bài giảng...", 
  onOpenAuth,
  onOpenProfile,
  onLogout,
  darkMode,
  setDarkMode
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white/70 dark:bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 sticky top-0 right-0 z-20 px-8 flex items-center justify-between transition-colors">
      {/* Search Input matching screenshot dark mode (#172136) */}
      <div className="relative w-full max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={placeholder}
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
          title={darkMode ? "Chuyển sang Chế độ sáng" : "Chuyển sang Chế độ tối"}
          className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Notification Bell */}
        <button className="relative w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0B0F19] animate-ping"></span>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#0B0F19]"></span>
        </button>

        {/* History Button */}
        <button className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
          <History className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* User Profile Badge */}
        <div className="relative" ref={dropdownRef}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer p-1.5 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors group"
          >
            <div className="text-right hidden sm:block">
              <h4 className="font-['Outfit'] font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-end gap-1">
                <span>{user?.fullName || 'Minh Anh'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </h4>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {user?.role || 'Premium Student'}
              </p>
            </div>
            <div className="relative">
              <img
                src={user?.avatar || user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"}
                alt={user?.fullName || 'User'}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/20 group-hover:ring-blue-500/50 transition-all"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0B0F19]"></span>
            </div>
          </div>

          {/* Submenu Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111C32] rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 animate-in fade-in duration-200">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {user?.fullName || 'Minh Anh'}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-3 transition-colors"
                >
                  <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Thông tin cá nhân</span>
                </button>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800/60 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
                    <span>Chế độ tối (Dark Mode)</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                  </div>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-3 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
