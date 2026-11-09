// Read-only UI fixture. All /api requests are intercepted; no real account or backend writes.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import '../src/i18n';
import App from '../src/App';
import { emptyOverview, zonedDate } from '../src/lib/studyClient';
const user = { id: 1, fullName: 'Quang Huy Nguyễn', email: 'preview@example.test', avatar: '/tests/missing-avatar.png' };
const memory = new Map([['accessToken', 'preview-only'], ['user', JSON.stringify(user)]]);
Object.defineProperty(window, 'localStorage', { value: { getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, String(value)), removeItem: key => memory.delete(key) } });
const subjects = [
  { id: 1, name: 'Cấu trúc dữ liệu và giải thuật', color: '#2563eb', type: 'SCHOOL', totalNotes: 0, totalDocuments: 0 },
  { id: 2, name: 'Tiếng Anh', color: '#0f766e', type: 'LANGUAGE', totalNotes: 2, totalDocuments: 1 },
  { id: 3, name: 'Cơ sở dữ liệu', color: '#475569', type: 'SCHOOL', totalNotes: 0, totalDocuments: 0 },
];
const schedule = [{ id: 1, subjectId: 1, subjectName: subjects[0].name, dayOfWeek: 'THU_4', isRecurring: true, startTime: '09:00:00', endTime: '11:00:00', room: 'A201' }];
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, options = {}) => {
  const url = new URL(input, location.href);
  if (!url.pathname.startsWith('/api/')) return originalFetch(input, options);
  const route = url.pathname.replace('/api', '');
  if (options.method && options.method !== 'GET') return new Response(JSON.stringify({ success: false, message: 'Bản xem giao diện chỉ đọc. Dùng p1-live.html với PostgreSQL thử nghiệm để kiểm tra lưu dữ liệu.' }), { status: 409 });
  let data = [];
  if (route === '/study/overview') {
    data = emptyOverview();
    const today = zonedDate(data.metrics.asOf, data.preferences.timezone);
    const monday = new Date(`${today}T00:00Z`); monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
    Object.assign(data.metrics.period, { from: url.searchParams.get('from') || monday.toISOString().slice(0, 10), to: url.searchParams.get('to') || today,
      subjects: subjects.map(s => ({ subjectId: s.id, name: s.name, totalTasks: 0, completedTasks: 0, progressPercent: null })) });
  } else if (route === '/subjects') data = subjects;
  else if (route === '/schedule') data = schedule;
  else if (route === '/dashboard/today') data = { todaySlots: [], todayTasks: [], totalPendingTasks: 0 };
  else if (route === '/stats/weekly') data = { averageQuizScore: null };
  else if (route === '/auth/google/config') data = { enabled: false };
  return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } });
};
createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
