// API Service kết nối 100% với Spring Boot REST API Backend

const BASE_URL = 'http://localhost:8080/api';

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

    if (response.status === 401) {
      clearAuthTokens();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`[API Error] Failed to fetch ${endpoint}:`, error);
    return { success: false, message: error.message || 'Lỗi kết nối máy chủ' };
  }
}

// ── 1. AUTH API ──────────────────────────────────────────
export async function loginApi(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.success && res.data) {
    setAuthToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    setStoredUser({
      id: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      avatarUrl: res.data.avatarUrl,
    });
  }
  return res;
}

export async function registerApi(email, password, fullName) {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });
  if (res.success && res.data) {
    setAuthToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    setStoredUser({
      id: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      avatarUrl: res.data.avatarUrl,
    });
  }
  return res;
}

export async function oauth2LoginApi(provider, email, fullName, avatarUrl) {
  const res = await request('/auth/oauth2', {
    method: 'POST',
    body: JSON.stringify({ provider, email, fullName, avatarUrl }),
  });
  if (res.success && res.data) {
    setAuthToken(res.data.accessToken);
    setRefreshToken(res.data.refreshToken);
    setStoredUser({
      id: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      avatarUrl: res.data.avatarUrl,
    });
  }
  return res;
}

export async function updateProfileApi(fullName, avatarUrl, newPassword) {
  const res = await request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify({ fullName, avatarUrl, newPassword }),
  });
  if (res.success && res.data) {
    setStoredUser({
      id: res.data.userId,
      email: res.data.email,
      fullName: res.data.fullName,
      avatarUrl: res.data.avatarUrl,
    });
  }
  return res;
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

export async function deleteScheduleSlotApi(id) {
  return await request(`/schedule/${id}`, {
    method: 'DELETE',
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

// ── 8. AI GEMINI INTEGRATION API ────────────────────────
export async function summarizeNoteApi(noteId) {
  return await request(`/notes/${noteId}/summarize`, { method: 'POST' });
}

export async function generateQuizFromNoteApi(noteId, count = 5) {
  return await request(`/notes/${noteId}/quiz?numberOfQuestions=${count}`, { method: 'POST' });
}

export async function generateMindmapFromNoteApi(noteId) {
  return await request(`/notes/${noteId}/mindmap`, { method: 'POST' });
}

export async function summarizeDocumentApi(docId) {
  return await request(`/documents/${docId}/summarize`, { method: 'POST' });
}

export async function generateQuizFromDocApi(docId, count = 5) {
  return await request(`/documents/${docId}/quiz?numberOfQuestions=${count}`, { method: 'POST' });
}

export async function generateMindmapFromDocApi(docId) {
  return await request(`/documents/${docId}/mindmap`, { method: 'POST' });
}

export async function getQuizByIdApi(quizId) {
  return await request(`/quizzes/${quizId}`);
}

export async function attemptQuizApi(quizId, userAnswers) {
  return await request(`/quizzes/${quizId}/attempt`, {
    method: 'POST',
    body: JSON.stringify({ answers: userAnswers }),
  });
}

export async function getMindmapByIdApi(mindmapId) {
  return await request(`/mindmaps/${mindmapId}`);
}
