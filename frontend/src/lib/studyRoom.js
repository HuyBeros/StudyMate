import { getAuthToken, request } from '../services/api';

const apiBase = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const roomsPath = '/study-rooms';
export const roomPath = id => roomsPath + '/' + id;
export const roomIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function socketUrl() {
  const url = new URL(apiBase, location.origin);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = url.pathname.replace(/\/api\/?$/, '') + '/ws/study-room';
  url.search = '';
  url.hash = '';
  return url.href;
}

export function roomCommand(path, data) {
  return request(path, { method: 'POST', ...(data ? { body: JSON.stringify(data) } : {}) });
}

export async function roomImage(id, messageId, signal) {
  const token = getAuthToken();
  const response = await fetch(apiBase + roomPath(id) + '/images/' + messageId, {
    headers: { Authorization: 'Bearer ' + token }, signal,
  });
  if (!response.ok || token !== getAuthToken()) throw new Error('Chưa mở được ảnh.');
  return response.blob();
}

export function inviteUrl(id) {
  const url = new URL(location.href);
  url.searchParams.set('room', id);
  return url.href;
}

export function timerText(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}

export const phaseLabels = { WAITING: 'Chờ bắt đầu', FOCUS: 'Tập trung', BREAK: 'Nghỉ ngắn' };
