import React, { useState } from 'react';
import { X, Lock, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import GoogleSignInButton from './GoogleSignInButton';
import { loginApi, registerApi, oauth2LoginApi, linkGoogleApi } from '../services/api';
import { useTranslation } from 'react-i18next';


export default function AuthModal({ isOpen, onClose, onSuccess, linkGoogle = false }) {
  const { t } = useTranslation('auth');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleGoogleCredential = async (idToken) => {
    if (loading) return;
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await (linkGoogle ? linkGoogleApi(idToken) : oauth2LoginApi(idToken));
      if (res?.success && res.data) { onSuccess(res.data); onClose(); }
      else setErrorMessage(res?.message || t('error.googleFailed'));
    } catch { setErrorMessage(t('error.serverError')); }
    finally { setLoading(false); }
  };

  /* ── Username / Password ────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const res = isLoginMode
        ? await loginApi(identifier.trim(), password)
        : await registerApi(identifier.trim(), password);

      if (res?.success) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMessage(res?.data?.username || res?.data?.password || res?.data?.registrationIdentityValid
          || res?.data?.loginIdentityValid || res?.data?.email || res?.message || t('error.loginFailed'));
      }
    } catch {
      setErrorMessage(t('error.serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" className="bg-white dark:bg-[#111C32] rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90dvh] overflow-y-auto overflow-x-hidden border border-slate-200/80 dark:border-slate-800">

        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 id="auth-modal-title" className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
                {linkGoogle ? 'Liên kết Google' : isLoginMode ? t('title') : t('titleRegister')}
              </h3>
              <p className="text-xs text-slate-400">{linkGoogle ? 'Chọn tài khoản Google có cùng email với tài khoản hiện tại.' : t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng hộp đăng nhập"
            className="w-10 h-10 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <GoogleSignInButton disabled={loading} onCredential={handleGoogleCredential} onError={setErrorMessage} />

        {/* Divider */}
        {!linkGoogle && <div className="relative flex items-center justify-center gap-3">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t('orWithPassword')}
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>}

        {/* Error Alert */}
        {errorMessage && (
          <div role="alert" className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Password Form */}
        {!linkGoogle && <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-identifier" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t(isLoginMode ? 'loginIdentifier' : 'username')}</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-identifier"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                minLength={isLoginMode ? undefined : 3}
                maxLength={isLoginMode ? 255 : 32}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t(isLoginMode ? 'loginIdentifier' : 'usernamePlaceholder')}
                className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('password')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type="password"
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                minLength={isLoginMode ? undefined : 8}
                maxLength={isLoginMode ? undefined : 72}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading
              ? <span>{t('processing')}</span>
              : <><span>{isLoginMode ? t('loginNow') : t('createAccount')}</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </form>}

        {/* Toggle mode */}
        {!linkGoogle && <div className="text-center pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setIsLoginMode(!isLoginMode); setPassword(''); setErrorMessage(''); }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isLoginMode ? t('noAccount') : t('hasAccount')}
          </button>
        </div>}
      </div>
    </div>
  );
}
