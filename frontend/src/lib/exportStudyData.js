import { getAuthToken, getMemosApi, getNotesApi, getScheduleApi, getSubjectsApi, getTasksApi, request } from '../services/api';

export async function exportStudyData() {
  const token = getAuthToken();
  function read(response) {
    if (!token || token !== getAuthToken()) throw new Error('Tài khoản đã thay đổi. Hãy thử xuất lại.');
    if (!response.success) throw new Error('Chưa tải được đầy đủ dữ liệu. Hãy thử lại.');
    return response.data;
  }

  const [subjects, schedule, tasks, notes, memos, preferences] = (await Promise.all([
    getSubjectsApi(), getScheduleApi(), getTasksApi(), getNotesApi(), getMemosApi(), request('/study/preferences'),
  ])).map(read);
  const sessions = [];
  let offset = 0;
  for (;;) {
    const page = read(await request('/study/sessions?limit=100&offset=' + offset));
    sessions.push(...page.items);
    if (!page.hasMore) break;
    offset += page.items.length;
  }
  const data = { format: 'studymate-study-data-v1', exportedAt: new Date().toISOString(), subjects, schedule, tasks, notes, memos, preferences, sessions };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'studymate-data.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
