export function dateKey(value = new Date()) {
  if (arguments.length && (arguments[0] == null || arguments[0] === '')) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function startOfWeek(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return date;
}

// Historical pre-P1 calculation, retained only for the legacy regression fixtures.
// Production screens use /api/study/overview through useStudyData; do not call this for account metrics.
export function buildStudyMetrics(tasks = [], sessions = [], now = new Date()) {
  const validSessions = sessions.filter(s => s.completedAt && new Date(s.completedAt) <= now && Number.isFinite(s.minutes) && s.minutes > 0);
  const activities = [
    ...tasks.filter(t => !t.deleted && t.status === 'DONE' && t.completedAt && new Date(t.completedAt) <= now)
      .map(t => ({ date: dateKey(t.completedAt), subjectId: t.subjectId, taskId: t.id, minutes: 0 })),
    ...validSessions.map(s => ({ date: dateKey(s.completedAt), subjectId: s.subjectId, sessionId: s.id, minutes: s.minutes })),
  ].filter(a => a.date);
  const activeDates = new Set(activities.map(a => a.date));
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  if (!activeDates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (activeDates.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  const weekStart = startOfWeek(now);
  const previousWeekStart = new Date(weekStart);
  previousWeekStart.setDate(previousWeekStart.getDate() - 7);
  const weekMinutes = validSessions.filter(s => new Date(s.completedAt) >= weekStart).reduce((sum, s) => sum + s.minutes, 0);
  const previousMinutes = validSessions.filter(s => new Date(s.completedAt) >= previousWeekStart && new Date(s.completedAt) < weekStart).reduce((sum, s) => sum + s.minutes, 0);
  return { activities, streak, weekHours: weekMinutes / 60, previousWeekHours: previousMinutes / 60,
    totalHours: validSessions.reduce((sum, s) => sum + s.minutes, 0) / 60 };
}

export function filterByPeriod(items, dateField, subjectId, from, to) {
  return items.filter(item => {
    const key = dateKey(item[dateField]);
    return key && (!subjectId || String(item.subjectId) === String(subjectId)) && (!from || key >= from) && (!to || key <= to);
  });
}

export function heatmapDays(activities, now = new Date(), weeks = 30) {
  const end = startOfWeek(now);
  end.setDate(end.getDate() + 6);
  const start = new Date(end);
  start.setDate(start.getDate() - weeks * 7 + 1);
  const counts = new Map();
  activities.forEach(a => counts.set(a.date, (counts.get(a.date) || 0) + 1));
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const date = dateKey(day);
    const future = date > dateKey(now);
    const count = future ? 0 : counts.get(date) || 0;
    return { date, count, future, level: Math.min(4, count) };
  });
}

export function avatarInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map(w => Array.from(w)[0]).join('') || 'NH').toLocaleUpperCase('vi-VN');
}
