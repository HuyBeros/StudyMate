import React, { useState, useEffect } from 'react';
import { X, User, Mail, Camera, Lock, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { updateProfileApi } from '../services/api';

export default function ProfileModal({ isOpen, onClose, user, onUpdateUser }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setAvatarUrl(user.avatar || user.avatarUrl || '');
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const res = await updateProfileApi(fullName, avatarUrl, newPassword);
      if (res && res.success) {
        setSuccessMessage('Cập nhật thông tin cá nhân thành công!');
        onUpdateUser({
          ...user,
          fullName: res.data.fullName,
          avatar: res.data.avatarUrl || avatarUrl,
          avatarUrl: res.data.avatarUrl || avatarUrl,
        });
        setNewPassword('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(res?.message || 'Cập nhật thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      setErrorMessage('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-200/80 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-bold text-xl text-slate-900 dark:text-slate-100">
                Thông tin cá nhân
              </h3>
              <p className="text-xs text-slate-400 font-medium">Xem và chỉnh sửa hồ sơ người dùng</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Profile Avatar Preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative group">
            <img 
              src={avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"} 
              alt={fullName} 
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20 group-hover:ring-blue-500/50 transition-all shadow-md"
            />
          </div>
          <p className="text-xs text-slate-400 font-medium">Nhập URL hình ảnh đính kèm bên dưới để thay đổi ảnh</p>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và tên</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Minh Anh"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Địa chỉ Email (Cố định)</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">URL Ảnh đại diện</label>
            <div className="relative">
              <Camera className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Đổi mật khẩu mới (Để trống nếu giữ nguyên)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
