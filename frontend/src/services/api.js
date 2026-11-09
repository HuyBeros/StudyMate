// API Service kết nối 100% với Spring Boot REST API Backend

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Token Storage
export const getAuthToken = () => localStorage.getItem('accessToken');
export const setAuthToken = (token) => localStorage.setItem('accessToken', token);
export const getRefreshToken = () => localStorage.getItem('refreshToken');
export const setRefreshToken = (token) => localStorage.setItem('refreshToken', token);
export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};
export const setStoredUser = (user) => localStorage.setItem('user', JSON.stringify(user));

// Generic HTTP Request Handler
export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && token === getAuthToken() && !['/auth/login', '/auth/oauth2', '/auth/google/link'].includes(endpoint)) {
      clearAuthTokens();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const data = await response.json();
    return { ...data, httpStatus: response.status };
  } catch (error) {
    console.error(`[API Error] Failed to fetch ${endpoint}:`, error);
    return { success: false, httpStatus: 0, message: error.message || 'Lỗi kết nối máy chủ' };
  }
}

// ── 1. AUTH API ──────────────────────────────────────────
export function askDailyAssistantApi(question) {
  return request('/assistant/ask', { method: 'POST', body: JSON.stringify({ question }) });
}

export async function loginApi(identifier, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(identifier.includes('@') ? { email: identifier, password } : { username: identifier, password }),
  });
  if (res.success && res.data) {
    setAuthToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    setStoredUser({
      id: res.data.userId,
      email: res.data.email,
      username: res.data.username,
      fullName: res.data.fullName,
      avatarUrl: res.data.avatarUrl,
    });
  }
  return res;
}

export async function registerApi(username, password) {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  if (res.success && res.data) {
    setAuthToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    setStoredUser({
      id: res.data.userId,
      email: res.data.email,
      username: res.data.username,
      fullName: res.data.fullName,
      avatarUrl: res.data.avatarUrl,
    });
  }
  return res;
}

export async function oauth2LoginApi(token) {
  const res = await request('/auth/oauth2', {
    method: 'POST',
    body: JSON.stringify({ provider: 'GOOGLE', token }),
  });
  if (res.success && res.data) {
    setAuthToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    setStoredUser({
      id: res.data.userId,
      email: res.data.email,
      username: res.data.username,
      fullName: res.data.fullName,
      avatarUrl: res.data.avatarUrl,
    });
  }
  return res;
}

export async function getGoogleConfigApi() {
  return request('/auth/google/config');
}

export async function linkGoogleApi(token) {
  const res = await request('/auth/google/link', {
    method: 'POST', body: JSON.stringify({ provider: 'GOOGLE', token }),
  });
  if (res.success && res.data) {
    setAuthToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
  }
  return res;
}

export function updateProfileApi(fullName, avatarFile) {
  if (avatarFile) {
    const body = new FormData();
    body.append('file', avatarFile);
    body.append('fullName', fullName);
    return request('/auth/profile/avatar', { method: 'PUT', body });
  }
  return request('/auth/profile', { method: 'PUT', body: JSON.stringify({ fullName }) });
}

export function uploadUrl(path) {
  return path?.startsWith('/uploads/') ? BASE_URL.replace(/\/api\/?$/, '') + path : path;
}

export function avatarSrc(path) {
  return path?.startsWith('/uploads/avatars/') ? uploadUrl(path) : path;
}

export function getPasswordStatusApi() {
  return request('/auth/password');
}

export async function changePasswordApi(currentPassword, newPassword) {
  const token = getAuthToken();
  const result = await request('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
  if (result.success && getAuthToken() === token) {
    setAuthToken(result.data.accessToken);
    setRefreshToken(result.data.refreshToken);
  }
  return result;
}

export async function getMeApi() {
  return await request('/auth/me');
}

export async function logoutApi() {
  const rToken = getRefreshToken();
  if (rToken) {
    await request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: rToken }),
    });
  }
  clearAuthTokens();
}

// ── 2. DASHBOARD & STATS API ────────────────────────────
export async function getTodayDashboardApi() {
  return await request('/dashboard/today');
}

export async function getWeekDashboardApi() {
  return await request('/dashboard/week');
}

export async function getWeeklyStatsApi() {
  return await request('/stats/weekly');
}

// ── 3. SUBJECT API ──────────────────────────────────────
export async function getSubjectsApi(type) {
  const query = type && type !== 'ALL' ? `?type=${type}` : '';
  return await request(`/subjects${query}`);
}

export async function getSubjectByIdApi(id) {
  return await request(`/subjects/${id}`);
}

export async function createSubjectApi(subjectData) {
  return await request('/subjects', {
    method: 'POST',
    body: JSON.stringify(subjectData),
  });
}

export async function updateSubjectApi(id, subjectData) {
  return await request(`/subjects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(subjectData),
  });
}

export async function deleteSubjectApi(id) {
  return await request(`/subjects/${id}`, {
    method: 'DELETE',
  });
}

// ── 4. SCHEDULE API ─────────────────────────────────────
export async function getScheduleApi(day, subjectId) {
  const params = new URLSearchParams();
  if (day) params.append('day', day);
  if (subjectId) params.append('subjectId', subjectId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await request(`/schedule${query}`);
}

export async function getTodayScheduleApi() {
  return await request('/schedule/today');
}

export async function createScheduleSlotApi(slotData) {
  return await request('/schedule/manual', {
    method: 'POST',
    body: JSON.stringify(slotData),
  });
}

export async function updateScheduleSlotApi(id, slotData) {
  return await request(`/schedule/${id}`, {
    method: 'PUT',
    body: JSON.stringify(slotData),
  });
}

export async function deleteScheduleSlotApi(id) {
  return await request(`/schedule/${id}`, {
    method: 'DELETE',
  });
}

export async function exportScheduleIcsApi() {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/schedule/export/ics`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error('Lỗi khi tải file lịch học');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'studymate-schedule.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  return { success: true };
}

export async function checkScheduleConflictApi(slotData) {
  return await request('/schedule/check-conflict', {
    method: 'POST',
    body: JSON.stringify(slotData),
  });
}

// ── 5. TASK API ─────────────────────────────────────────
export async function getTasksApi(status, subjectId) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (subjectId) params.append('subjectId', subjectId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await request(`/tasks${query}`);
}

export async function getTodayTasksApi() {
  return await request('/tasks/today');
}

export async function createTaskApi(taskData) {
  return await request('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
}

export async function updateTaskStatusApi(id, status) {
  return await request(`/tasks/${id}/status?status=${status}`, {
    method: 'PATCH',
  });
}

export async function deleteTaskApi(id) {
  return await request(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

// ── 6. NOTE API ─────────────────────────────────────────
export async function getNotesApi(subjectId, importanceLevel, search) {
  const params = new URLSearchParams();
  if (subjectId) params.append('subjectId', subjectId);
  if (importanceLevel) params.append('importanceLevel', importanceLevel);
  if (search) params.append('search', search);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await request(`/notes${query}`);
}

export async function getNoteByIdApi(id) {
  return await request(`/notes/${id}`);
}

export async function createNoteApi(noteData) {
  return await request('/notes', {
    method: 'POST',
    body: JSON.stringify(noteData),
  });
}

export async function uploadNoteImageApi(noteId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return await request(`/notes/${noteId}/images`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteNoteApi(id) {
  return await request(`/notes/${id}`, {
    method: 'DELETE',
  });
}

// ── 7. DOCUMENT API ─────────────────────────────────────
export async function getSubjectDocumentsApi(subjectId) {
  return await request(`/subjects/${subjectId}/documents`);
}

export async function getDocumentByIdApi(id) {
  return await request(`/documents/${id}`);
}

export async function uploadDocumentApi(subjectId, file, scheduleSlotId) {
  const formData = new FormData();
  formData.append('file', file);
  if (scheduleSlotId) formData.append('scheduleSlotId', scheduleSlotId);

  return await request(`/subjects/${subjectId}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
}

export async function deleteDocumentApi(id) {
  return await request(`/documents/${id}`, {
    method: 'DELETE',
  });
}

export async function askDocumentApi(documentId, question) {
  return await request(`/documents/${documentId}/ask`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

// ── 8. AI GEMINI INTEGRATION API (Instant + Async Polling) ──────────
export async function generateQuizFromNoteApi(noteId, config) {
  const payload = typeof config === 'number' ? { numberOfQuestions: config } : (config || {});
  const jobRes = await request(`/jobs/notes/${noteId}/quiz`, { 
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (jobRes && jobRes.success && jobRes.data?.jobId) {
    return await pollJobUntilDone(jobRes.data.jobId);
  }
  return { success: false, message: jobRes?.message || 'Không thể khởi động tác vụ AI' };
}

export async function generateMindmapFromNoteApi(noteId, config) {
  const payload = typeof config === 'object' && config !== null ? config : {};
  const jobRes = await request(`/jobs/notes/${noteId}/mindmap`, { 
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (jobRes && jobRes.success && jobRes.data?.jobId) {
    return await pollJobUntilDone(jobRes.data.jobId);
  }
  return { success: false, message: jobRes?.message || 'Không thể khởi động tác vụ AI' };
}

export async function summarizeNoteApi(noteId, config) {
  const payload = typeof config === 'object' && config !== null ? config : {};
  const jobRes = await request(`/jobs/notes/${noteId}/summarize`, { 
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (jobRes && jobRes.success && jobRes.data?.jobId) {
    return await pollJobUntilDone(jobRes.data.jobId);
  }
  return { success: false, message: jobRes?.message || 'Không thể khởi động tác vụ AI' };
}

export async function generateQuizFromDocApi(docId, config) {
  const payload = typeof config === 'number' ? { numberOfQuestions: config } : (config || {});
  const jobRes = await request(`/jobs/documents/${docId}/quiz`, { 
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (jobRes && jobRes.success && jobRes.data?.jobId) {
    return await pollJobUntilDone(jobRes.data.jobId);
  }
  return { success: false, message: jobRes?.message || 'Không thể khởi động tác vụ AI' };
}

export async function generateMindmapFromDocApi(docId, config) {
  const payload = typeof config === 'object' && config !== null ? config : {};
  const jobRes = await request(`/jobs/documents/${docId}/mindmap`, { 
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (jobRes && jobRes.success && jobRes.data?.jobId) {
    return await pollJobUntilDone(jobRes.data.jobId);
  }
  return { success: false, message: jobRes?.message || 'Không thể khởi động tác vụ AI' };
}

export async function summarizeDocumentApi(docId, config) {
  const payload = typeof config === 'object' && config !== null ? config : {};
  const jobRes = await request(`/jobs/documents/${docId}/summarize`, { 
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (jobRes && jobRes.success && jobRes.data?.jobId) {
    return await pollJobUntilDone(jobRes.data.jobId);
  }
  return { success: false, message: jobRes?.message || 'Không thể khởi động tác vụ AI' };
}

export async function saveAiOutputApi(type, payload) {
  return await request(`/ai-outputs/${type}/save`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getQuizByIdApi(quizId) {
  return await request(`/quizzes/${quizId}`);
}

export async function attemptQuizApi(quizId, userAnswers) {
  const answers = Object.fromEntries(userAnswers.map(({ questionId, selectedOption }) => [questionId, selectedOption]));
  return await request(`/quizzes/${quizId}/attempt`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  });
}

export async function getMindmapByIdApi(mindmapId) {
  return await request(`/mindmaps/${mindmapId}`);
}

// ── 8.5. MEMO (Ghi chú) API ──────────────────────────────────
export async function getMemosApi(date, taskId, subjectId) {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (taskId) params.append('taskId', taskId);
  if (subjectId) params.append('subjectId', subjectId);
  const query = params.toString() ? `?${params.toString()}` : '';
  return await request(`/memos${query}`);
}

export async function createMemoApi(memoData) {
  return await request('/memos', {
    method: 'POST',
    body: JSON.stringify(memoData),
  });
}

export async function updateMemoApi(id, memoData) {
  return await request(`/memos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(memoData),
  });
}

export async function deleteMemoApi(id) {
  return await request(`/memos/${id}`, {
    method: 'DELETE',
  });
}


// ── 9. ASYNC JOB POLLING API ────────────────────────────
export async function getJobStatusApi(jobId) {
  return await request(`/jobs/${jobId}`);
}

export async function pollJobUntilDone(jobId, intervalMs = 2000, maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await getJobStatusApi(jobId);
    if (res && res.success && res.data) {
      const { status, resultJson, errorMessage } = res.data;
      if (status === 'COMPLETED') {
        try {
          return { success: true, data: JSON.parse(resultJson) };
        } catch (e) {
          return { success: true, data: resultJson };
        }
      }
      if (status === 'FAILED') {
        return { success: false, message: errorMessage || 'Xử lý AI thất bại, vui lòng thử lại.' };
      }
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  return { success: false, message: 'Tác vụ AI xử lý quá lâu, vui lòng kiểm tra lại sau.' };
}

export async function getAiOutputsBySubjectApi(subjectId) {
  return await request(`/ai-outputs/subjects/${subjectId}`);
}
