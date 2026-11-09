import { useEffect, useRef, useState } from 'react';
import { getGoogleConfigApi } from '../services/api';

export default function GoogleSignInButton({ disabled, onCredential, onError }) {
  const container = useRef(null);
  const handlers = useRef({ onCredential, onError });
  handlers.current = { onCredential, onError };
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let poll;
    let timeout;
    let initialized = false;
    setStatus('loading');
    handlers.current.onError('');
    const fail = message => {
      clearInterval(poll);
      clearTimeout(timeout);
      if (active) { setStatus('error'); handlers.current.onError(message); }
    };
    const initialize = async () => {
      const config = await getGoogleConfigApi();
      if (!active) return;
      if (!config?.success || !config.data?.enabled || !config.data.clientId) {
        fail('Đăng nhập Google chưa sẵn sàng. Bạn có thể đăng nhập bằng email.');
        return;
      }
      const mount = () => {
        if (!active || initialized || !window.google?.accounts?.id || !container.current) return;
        initialized = true;
        clearInterval(poll);
        clearTimeout(timeout);
        try {
          container.current.replaceChildren();
          window.google.accounts.id.initialize({
            client_id: config.data.clientId,
            auto_select: false,
            callback: response => {
              if (!active) return;
              if (!response.credential) handlers.current.onError('Google chưa trả về thông tin xác thực. Vui lòng thử lại.');
              else handlers.current.onCredential(response.credential);
            },
          });
          window.google.accounts.id.renderButton(container.current, {
            type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', locale: 'vi',
            width: Math.max(200, Math.min(320, Math.floor(container.current.getBoundingClientRect().width))),
          });
          setStatus('ready');
        } catch { fail('Không khởi tạo được đăng nhập Google. Vui lòng thử lại.'); }
      };
      poll = setInterval(mount, 100);
      timeout = setTimeout(() => {
        clearInterval(poll);
        if (active && !initialized) fail('Không tải được đăng nhập Google. Hãy kiểm tra kết nối và thử lại.');
      }, 10000);
      mount();
    };
    initialize();
    return () => { active = false; clearInterval(poll); clearTimeout(timeout); };
  }, [attempt]);

  return <div aria-busy={disabled || status === 'loading'} className="w-full min-h-11">
    {status === 'loading' && <p role="status" className="text-sm text-slate-600 dark:text-slate-300">Đang chuẩn bị đăng nhập Google…</p>}
    {status === 'error' && <button className="secondary-button w-full" disabled={disabled} onClick={() => setAttempt(value => value + 1)}>Thử lại đăng nhập Google</button>}
    <div ref={container} inert={disabled || undefined} className="w-full flex justify-center" />
  </div>;
}
