import test from 'node:test';
import assert from 'node:assert/strict';
import { beginCommand, sendCommand, readJson, pendingKey, legacyBatch, acknowledgeLegacy, remainingSeconds, zonedDate, displayMetrics } from '../src/lib/studyClient.js';
const store = () => { const items = new Map(); return { getItem: k => items.get(k) ?? null, setItem: (k, v) => items.set(k, v), removeItem: k => items.delete(k) }; };
const account = '7:owner@example.test';
test('lost response retains the exact command; retry reuses its ID and payload', async () => {
  const storage = store(); const command = beginCommand(storage, account, '/study/sessions', { publicId: crypto.randomUUID(), targetSeconds: 1500 });
  await assert.rejects(sendCommand(storage, account, command, async () => ({ success: false, httpStatus: 0 })), /xác nhận/);
  const retry = readJson(storage, pendingKey(account));
  assert.deepEqual(retry, command);
  assert.throws(() => beginCommand(storage, account, '/different', {}), /chưa xác nhận/);
  const data = await sendCommand(storage, account, retry, async (path, body, key) => { assert.equal(path, command.endpoint); assert.deepEqual(body, command.payload); assert.equal(key, command.key); return { success: true, data: { status: 'RUNNING' } }; });
  assert.equal(data.status, 'RUNNING'); assert.equal(storage.getItem(pendingKey(account)), null);
});
test('a server error retains pending state, a definite conflict clears it, another account cannot send it', async () => {
  const storage = store(), command = beginCommand(storage, account, '/study/sessions', {});
  await assert.rejects(sendCommand(storage, '8:other@example.test', command, () => assert.fail('must not send')), /tài khoản khác/);
  await assert.rejects(sendCommand(storage, account, command, async () => ({ success: false, httpStatus: 503 })));
  await assert.rejects(sendCommand(storage, account, command, async () => ({ success: false, httpStatus: 401 })));
  assert.ok(readJson(storage, pendingKey(account)));
  await assert.rejects(sendCommand(storage, account, command, async () => ({ success: false, httpStatus: 409 })));
  assert.equal(storage.getItem(pendingKey(account)), null);
});
test('storage failure prevents a session command from being created', () => {
  assert.throws(() => beginCommand({ getItem: () => null, setItem: () => { throw new Error('quota'); } }, account, '/study/sessions', {}), /quota/);
});
test('legacy imports are bounded, acknowledged only after success, and preserve the original records', () => {
  const storage = store(), email = 'owner@example.test';
  const original = { school: 'Original', weeklyGoal: 8, sessions: Array.from({ length: 102 }, () => ({ id: crypto.randomUUID(), minutes: 25, completedAt: '2026-11-03T02:00:00Z' })) };
  original.sessions.push({ id: 'broken', minutes: 25, completedAt: 'invalid' });
  storage.setItem(`studymate:study:${email}`, JSON.stringify(original));
  const prefs = { timezone: 'Asia/Ho_Chi_Minh', version: 0 };
  const batch = legacyBatch(storage, email, prefs, Date.parse('2026-11-04T00:00Z'));
  assert.equal(batch.sessions.length, 100); assert.equal(batch.remaining, 2); assert.equal(batch.invalid, 1);
  assert.equal(batch.preferences.weeklyGoalSeconds, 28800);
  assert.deepEqual(legacyBatch(storage, email, prefs, Date.parse('2026-11-04T00:00Z')).sessions, batch.sessions);
  acknowledgeLegacy(storage, email, { acknowledged: batch.sessions.map(s => s.publicId) });
  const next = legacyBatch(storage, email, prefs, Date.parse('2026-11-04T00:00Z'));
  assert.equal(next.sessions.length, 2); assert.equal(next.preferences, null);
  assert.deepEqual(readJson(storage, `studymate:study:${email}`), original);
  assert.equal(legacyBatch(storage, 'other@example.test', prefs), null);
});
test('future, overlong and invalid sessions remain unacknowledged; newer preferences are not offered for import', () => {
  const storage = store(), email = 'owner@example.test';
  storage.setItem(`studymate:study:${email}`, JSON.stringify({ sessions: [{ id: crypto.randomUUID(), minutes: 300, completedAt: '2026-11-03T00:00Z' }, { id: crypto.randomUUID(), minutes: 25, completedAt: '2099-01-01T00:00Z' }] }));
  const batch = legacyBatch(storage, email, { legacyImportedAt: '2026-11-02T00:00Z' });
  assert.equal(batch.invalid, 2); assert.equal(batch.sessions.length, 0); assert.equal(batch.preferences, null);
});
test('timer uses server timestamps and elapsed monotonic time; pause is constant and reload restores remaining time', () => {
  const session = { status: 'RUNNING', serverNow: '2026-11-04T02:00Z', deadline: '2026-11-04T02:25Z', remainingSeconds: 1500 };
  assert.equal(remainingSeconds(session, 30), 1470); assert.equal(remainingSeconds(session, 1600), 0);
  assert.equal(remainingSeconds({ ...session, status: 'PAUSED', remainingSeconds: 900 }, 600), 900);
  assert.equal(remainingSeconds({ ...session, serverNow: '2026-11-04T02:10Z' }), 900);
});
test('account day uses its timezone; display conversion cannot invent or recalculate streak', () => {
  assert.equal(zonedDate('2026-11-03T18:00:00Z', 'Asia/Ho_Chi_Minh'), '2026-11-04');
  const display = displayMetrics({ streak: 3, weekFocusSeconds: 1800, previousWeekFocusSeconds: 900, totalFocusSeconds: 3600, days: [] });
  assert.equal(display.streak, 3); assert.equal(display.weekHours, .5); assert.equal(display.totalHours, 1);
});
