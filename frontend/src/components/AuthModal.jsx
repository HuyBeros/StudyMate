import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { loginApi, registerApi, oauth2LoginApi } from '../services/api';
import { useTranslation } from 'react-i18next';

const GOOGLE_CLIENT_ID = "809610594828-lvdaejskin02qevhhsgi5c8j5ps3css6.apps.googleusercontent.com";

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation('auth');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [fullName, setFullName]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  /* ── Google Login (OAuth2 Token Client — popup, không redirect) ── */
  const handleGoogleLogin = () => {
    setErrorMessage('');

    if (!window.google?.accounts?.oauth2) {
      setErrorMessage(t('error.googleNotLoaded'));
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse.error) {
          setErrorMessage('Google từ chối quyền truy cập: ' + tokenResponse.error);
          return;
        }
        setLoading(true);
        try {
          // Lấy thông tin user thật từ Google API
          const userInfoRes = await fetch(
            `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenResponse.access_token}`
          );
          const profile = await userInfoRes.json();

          if (!profile.email) {
            setErrorMessage('Không lấy được thông tin email từ Google.');
            return;
          }

          // Gửi thông tin thật lên backend
          const res = await oauth2LoginApi(
            'GOOGLE',
            profile.email,
            profile.name || profile.email.split('@')[0],
            profile.picture || ''
          );

          if (res?.success && res.data) {
            onSuccess(res.data);
            onClose();
          } else {
            setErrorMessage(res?.message || t('error.googleFailed'));
          }
        } catch (err) {
          console.error('[Google Login Error]:', err);
          setErrorMessage(t('error.serverError2'));
        } finally {
          setLoading(false);
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  /* ── Facebook Login ──────────────────────────────────────────── */
  const handleFacebookLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await oauth2LoginApi(
        'FACEBOOK',
        'facebook.user@studymate.app',
        'Facebook Student',
        ''
      );
      if (res?.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMessage(res?.message || t('error.facebookFailed'));
      }
    } catch {
      setErrorMessage(t('error.serverError'));
    } finally {
      setLoading(false);
    }
  };

  /* ── Email / Password ────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    try {
      const res = isLoginMode
        ? await loginApi(email, password)
        : await registerApi(email, password, fullName);

      if (res?.success) {
        onSuccess(res.data);
        onClose();
      } else {
        setErrorMessage(res?.message || t('error.loginFailed'));
      }
    } catch {
      setErrorMessage(t('error.serverError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-md w-full p-8 space-y-5 shadow-2xl relative overflow-hidden border border-slate-200/80 dark:border-slate-800">

        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
                {isLoginMode ? t('title') : t('titleRegister')}
              </h3>
              <p className="text-xs text-slate-400">{t('subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3">

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white dark:bg-[#172136] hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 text-slate-700 dark:text-slate-200 font-semibold text-sm py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-center gap-3 transition-all hover:shadow-md active:scale-[0.99]"
          >
            {loading ? (
              <span className="text-slate-500">{t('processing')}</span>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.1 0-5.74-2.1-6.68-4.93H1.32v3.15C3.33 21.36 7.38 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.32 14.27c-.24-.73-.38-1.5-.38-2.27s.14-1.54.38-2.27V6.58H1.32C.48 8.24 0 10.06 0 12s.48 3.76 1.32 5.42l4-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.38 0 3.33 2.64 1.32 6.58l4 3.15c.94-2.83 3.58-4.98 6.68-4.98z"/>
                </svg>
                <span>{t('continueGoogle')}</span>
              </>
            )}
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={handleFacebookLogin}
            disabled={loading}
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-60 text-white font-semibold text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-3 transition-all hover:shadow-md active:scale-[0.99]"
          >
            <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>{t('continueFacebook')}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center gap-3">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t('orWithEmail')}
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('fullName')}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('email')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{t('password')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
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
        </form>

        {/* Toggle mode */}
        <div className="text-center pt-1 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setIsLoginMode(!isLoginMode); setErrorMessage(''); }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isLoginMode ? t('noAccount') : t('hasAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
