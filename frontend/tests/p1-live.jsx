// Development-only harness. It uses real HTTP + PostgreSQL on the dedicated test server.
// Authentication/preferences are isolated from the user's localStorage, including after reload.
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
if (import.meta.env.VITE_API_BASE_URL !== 'http://localhost:8091/api') throw new Error('P1 harness requires the dedicated local test API on port 8091.');
const backing = window.sessionStorage;
const prefix = 'studymate:p1-live:';
const isolatedStorage = {
  getItem: key => backing.getItem(prefix + key),
  setItem: (key, value) => backing.setItem(prefix + key, String(value)),
  removeItem: key => backing.removeItem(prefix + key),
};
Object.defineProperty(window, 'localStorage', { value: isolatedStorage });
if (!isolatedStorage.getItem('seeded')) {
  isolatedStorage.setItem('studymate:study:p1-ui-20261104@example.test', JSON.stringify({ school: 'Trường cũ', major: '', weeklyGoal: 6, reminderEnabled: false, reminderTime: '19:00', sessions: [{ id: '11111111-1111-4111-8111-111111111111', subjectId: null, minutes: 25, completedAt: '2026-11-03T02:00:00Z' }] }));
  isolatedStorage.setItem('seeded', 'true');
}
await import('../src/i18n');
const { default: App } = await import('../src/App');
createRoot(document.getElementById('root')).render(<App />);
