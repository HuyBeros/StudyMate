// P1 keeps only a pending session command locally. Canonical study data lives on the server.
export const defaultPreferences = { school: '', major: '', timezone: 'Asia/Ho_Chi_Minh', weeklyGoalSeconds: 21600, reminderEnabled: false, reminderTime: '19:00', version: 0 };
export const accountKey = user => user?.id != null ? `${user.id}:${user.email}` : '';
export const pendingKey = account => `studymate:p1:pending:${account}`;
export function readJson(storage, key, fallback = null) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function deviceId(storage) {
  const key = 'studymate:device-id';
  let id = storage.getItem(key);
  if (!isUuid(id)) { id = crypto.randomUUID(); storage.setItem(key, id); }
  return id;
}
export function isUuid(value) { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
export function beginCommand(storage, account, endpoint, payload) {
  if (readJson(storage, pendingKey(account))) throw new Error('Còn một yêu cầu chưa xác nhận. Hãy thử gửi lại trước khi thao tác tiếp.');
  const command = { account, endpoint, payload, key: crypto.randomUUID() };
  // Fail before sending if the browser cannot retain a retry key.
  storage.setItem(pendingKey(account), JSON.stringify(command));
  return command;
}
export async function sendCommand(storage, account, command, sender) {
  if (!command || command.account !== account) throw new Error('Yêu cầu thuộc tài khoản khác.');
  const result = await sender(command.endpoint, command.payload, command.key);
  if (result.success || [400, 403, 404, 409, 422].includes(result.httpStatus)) storage.removeItem(pendingKey(account));
  if (!result.success) throw Object.assign(new Error(result.message || 'Chưa thể xác nhận yêu cầu. Hãy thử gửi lại.'), { httpStatus: result.httpStatus });
  return result.data;
}
export function legacyBatch(storage, email, preferences, now = Date.now()) {
  const source = readJson(storage, `studymate:study:${email}`);
  if (!source || typeof source !== 'object') return null;
  const marker = readJson(storage, `studymate:p1:imported:${email}`, { ids: [], preferences: false });
  const acknowledged = new Set(Array.isArray(marker.ids) ? marker.ids : []);
  const originals = Array.isArray(source.sessions) ? source.sessions : [];
  let invalid = 0;
  const sessions = [];
  const seen = new Set();
  for (const session of originals) {
    const seconds = Math.round(Number(session?.minutes) * 60);
    const at = Date.parse(session?.completedAt);
    if (!isUuid(session?.id) || !Number.isFinite(at) || at > now || !Number.isFinite(seconds) || seconds < 1 || seconds > 14400) { invalid++; continue; }
    if (seen.has(session.id)) { invalid++; continue; }
    seen.add(session.id);
    if (!acknowledged.has(session.id)) sessions.push({ publicId: session.id, subjectId: Number.isSafeInteger(session.subjectId) ? session.subjectId : null, completedAt: new Date(at).toISOString(), durationSeconds: seconds });
  }
  const goal = Number(source.weeklyGoal);
  const localPreferences = !marker.preferences && preferences.legacyImportedAt == null ? {
    ...defaultPreferences, timezone: preferences.timezone, version: preferences.version,
    school: typeof source.school === 'string' ? source.school.slice(0, 160) : '',
    major: typeof source.major === 'string' ? source.major.slice(0, 160) : '',
    weeklyGoalSeconds: Number.isFinite(goal) && goal >= .5 && goal <= 168 ? Math.round(goal * 3600) : 21600,
    reminderEnabled: source.reminderEnabled === true,
    reminderTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(source.reminderTime) ? source.reminderTime : '19:00',
  } : null;
  return { sessions: sessions.slice(0, 100), preferences: localPreferences, invalid, remaining: Math.max(0, sessions.length - 100), marker };
}
export function acknowledgeLegacy(storage, email, result) {
  const key = `studymate:p1:imported:${email}`;
  const prior = readJson(storage, key, { ids: [] });
  storage.setItem(key, JSON.stringify({ ids: [...new Set([...(prior.ids || []), ...result.acknowledged])], preferences: true }));
  // Keep the original local records for backup and inspection, including malformed entries.
}
export function zonedDate(instant, timezone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(instant)).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export function remainingSeconds(session, elapsed = 0) {
  if (!session) return 1500;
  if (session.status !== 'RUNNING') return session.remainingSeconds;
  return Math.max(0, Math.ceil((Date.parse(session.deadline) - Date.parse(session.serverNow)) / 1000 - elapsed));
}
export function displayMetrics(metrics) {
  return { ...metrics, weekHours: metrics.weekFocusSeconds / 3600, previousWeekHours: metrics.previousWeekFocusSeconds / 3600, totalHours: metrics.totalFocusSeconds / 3600, activities: metrics.days };
}
export function emptyOverview() {
  const progress = { totalTasks: 0, completedTasks: 0, progressPercent: null };
  return { preferences: defaultPreferences, activeSession: null, metrics: { metricsVersion: 'study-metrics-v1', timezone: defaultPreferences.timezone, asOf: new Date().toISOString(), syncRevision: 0, streak: 0, totalFocusSeconds: 0, weekFocusSeconds: 0, previousWeekFocusSeconds: 0, legacyFocusSeconds: 0, progress, today: progress, days: [], period: { from: null, to: null, subjectId: null, focusSeconds: 0, weekFocusSeconds: 0, previousWeekFocusSeconds: 0, progress, taskStatus: {}, subjects: [], days: [] } } };
}
