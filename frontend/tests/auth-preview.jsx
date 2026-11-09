// Isolated Google UI fixture. No Google login, real token, persistent storage or backend writes.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AuthModal from '../src/components/AuthModal';
import '../src/i18n';
import '../src/index.css';

const query = new URLSearchParams(location.search);
const linking = query.get('mode') === 'link';
const failure = query.get('failure');
const memory = new Map(linking ? [['accessToken', 'fixture-existing-access'], ['refreshToken', 'fixture-existing-refresh']] : []);
Object.defineProperty(window, 'localStorage', { value: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value), removeItem: key => memory.delete(key) } });
let googleCallback;
window.google = { accounts: { id: {
  initialize: config => { googleCallback = config.callback; },
  renderButton: element => {
    const button = document.createElement('button');
    button.textContent = 'Tiếp tục với Google (kiểm thử)';
    button.className = 'secondary-button w-full';
    button.onclick = () => googleCallback({ credential: 'fixture-id-token' });
    element.replaceChildren(button);
  },
} } };
window.fetch = async (input, options = {}) => {
  const url = new URL(input, location.href);
  if (url.pathname.endsWith('/auth/google/config')) return new Response(JSON.stringify({ success: failure !== 'config', data: { enabled: failure !== 'config', clientId: 'fixture-web-client' } }));
  if (url.pathname.endsWith('/auth/oauth2') || url.pathname.endsWith('/auth/google/link')) {
    const body = JSON.parse(options.body);
    if (body.token !== 'fixture-id-token' || body.provider !== 'GOOGLE' || Object.keys(body).length !== 2) throw new Error('Invalid fixture request');
    if (linking && options.headers.Authorization !== 'Bearer fixture-existing-access') throw new Error('Missing fixture authentication');
    if (failure === 'credential') return new Response(JSON.stringify({ success: false, message: 'Token Google không hợp lệ (kiểm thử).' }), { status: 401 });
    return new Response(JSON.stringify({ success: true, data: { userId: 7, email: 'verified@example.test', fullName: 'Người dùng kiểm thử', accessToken: 'fixture-new-access', refreshToken: 'fixture-new-refresh' } }));
  }
  throw new Error('This fixture does not call real endpoints');
};

export default function Preview() {
  const [open, setOpen] = useState(true);
  const [result, setResult] = useState('');
  return <main className="page-shell"><h1 className="text-2xl font-bold">Kiểm thử giao diện Google</h1><p>Chỉ dùng bộ nhớ và Google SDK giả trong trang kiểm thử.</p>
    {result && <p role="status">{result}</p>}
    <AuthModal isOpen={open} linkGoogle={linking} onClose={() => setOpen(false)} onSuccess={() => setResult(linking ? 'Đã liên kết tài khoản trong bản kiểm thử.' : 'Đã đăng nhập trong bản kiểm thử.')} />
  </main>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><Preview /></React.StrictMode>);
