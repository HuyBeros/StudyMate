import test from 'node:test';
import assert from 'node:assert/strict';
import { avatarInitials, buildStudyMetrics, dateKey, filterByPeriod, heatmapDays, startOfWeek } from '../src/lib/studyMetrics.js';

const now = new Date('2026-11-04T12:00:00');
const completed = (id, day) => ({ id, status: 'DONE', completedAt: `${day}T09:00:00` });

test('empty data and pending work never manufacture a streak or heatmap activity', () => {
  const metrics = buildStudyMetrics([{ id: 1, status: 'TODO', dueAt: '2026-11-04T10:00:00' }, { id: 2, status: 'DONE' }], [], now);
  assert.equal(metrics.streak, 0);
  assert.equal(metrics.activities.length, 0);
  assert.ok(heatmapDays(metrics.activities, now).every(day => day.level === 0));
});

test('streak counts unique consecutive dates and preserves yesterday until today ends', () => {
  const tasks = [completed(1, '2026-11-03'), completed(2, '2026-11-03'), completed(3, '2026-11-02')];
  assert.equal(buildStudyMetrics(tasks, [], now).streak, 2);
  tasks.push(completed(4, '2026-11-04'));
  assert.equal(buildStudyMetrics(tasks, [], now).streak, 3);
  assert.equal(buildStudyMetrics(tasks, [], new Date('2026-11-06T12:00:00')).streak, 0);
});

test('deleted, reopened, future and invalid completions do not count', () => {
  const tasks = [{ ...completed(1, '2026-11-04'), deleted: true }, { ...completed(2, '2026-11-04'), status: 'TODO' }, completed(3, '2026-11-05'), { ...completed(4, '2026-11-04'), completedAt: 'invalid' }];
  assert.deepEqual(buildStudyMetrics(tasks, [], now).activities, []);
});

test('focus sessions and task completions share one activity source; weekly hours respect Monday boundaries', () => {
  const sessions = [
    { id: 'last', minutes: 60, completedAt: '2026-11-01T23:59:00' },
    { id: 'monday', minutes: 25, completedAt: '2026-11-02T00:01:00' },
    { id: 'today', minutes: 25, completedAt: '2026-11-04T08:00:00' },
    { id: 'future', minutes: 50, completedAt: '2026-11-05T08:00:00' },
    { id: 'bad', minutes: -10, completedAt: '2026-11-04T08:00:00' },
  ];
  const metrics = buildStudyMetrics([completed(1, '2026-11-03')], sessions, now);
  assert.equal(metrics.streak, 4);
  assert.equal(metrics.weekHours, 50 / 60);
  assert.equal(metrics.previousWeekHours, 1);
  assert.equal(metrics.totalHours, 110 / 60);
  assert.equal(metrics.activities.length, 4);
});

test('heatmap is Monday-aligned, fills only real dates and leaves future cells empty', () => {
  const days = heatmapDays([{ date: '2026-11-02' }, { date: '2026-11-02' }, { date: '2026-11-03' }, { date: '2026-11-06' }], now, 2);
  assert.equal(days.length, 14);
  assert.equal(new Date(`${days[0].date}T12:00:00`).getDay(), 1);
  assert.equal(days.find(d => d.date === '2026-11-02').count, 2);
  assert.equal(days.find(d => d.date === '2026-11-04').count, 0);
  assert.equal(days.find(d => d.date === '2026-11-06').level, 0);
});

test('date keys use local calendar dates and never treat missing timestamps as today', () => {
  assert.equal(dateKey(new Date(2026, 10, 4, 0, 5)), '2026-11-04');
  assert.equal(dateKey(null), null);
  assert.equal(dateKey(undefined), null);
  assert.equal(dateKey('invalid'), null);
  assert.equal(dateKey(startOfWeek(new Date('2026-11-08T12:00:00'))), '2026-11-02');
});

test('subject and date filters include boundaries and exclude missing timestamps', () => {
  const items = [{ id: 1, subjectId: 3, createdAt: '2026-11-02T00:00:00' }, { id: 2, subjectId: 3, createdAt: '2026-11-04T23:59:59' }, { id: 3, subjectId: 4, createdAt: '2026-11-03T00:00:00' }, { id: 4, subjectId: 3 }];
  assert.deepEqual(filterByPeriod(items, 'createdAt', '3', '2026-11-02', '2026-11-04').map(x => x.id), [1, 2]);
});

test('avatar initials handle the reported name, blank names and one-word names', () => {
  assert.equal(avatarInitials('Quang Huy Nguyễn'), 'QH');
  assert.equal(avatarInitials('  Quang   Huy Nguyễn '), 'QH');
  assert.equal(avatarInitials(''), 'NH');
  assert.equal(avatarInitials('Huy'), 'H');
});
