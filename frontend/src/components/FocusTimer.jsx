import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, Timer, Square, Trash2 } from 'lucide-react';
import { remainingSeconds } from '../lib/studyClient';

export default function FocusTimer({ subjects, tasks, timerMinutes, selectedTask, session, receivedAt, busy, pending, onCreate, onTransition, onComplete, user, onLogin }) {
  const [taskId, setTaskId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [mode, setMode] = useState('focus');
  const breakMinutes = mode === 'focus' ? 0 : timerMinutes[mode];
  const focusSeconds = timerMinutes.focus * 60;
  const [breakEnd, setBreakEnd] = useState(null);
  const attempted = useRef('');
  useEffect(() => { if (selectedTask) { setTaskId(selectedTask.publicId || ''); setMode('focus'); setBreakEnd(null); } }, [selectedTask]);
  useEffect(() => {
    const tick = () => setElapsed(Math.max(0, (performance.now() - (receivedAt ?? performance.now())) / 1000));
    tick(); const timer = setInterval(tick, 250); return () => clearInterval(timer);
  }, [receivedAt]);
  const [breakRemaining, setBreakRemaining] = useState(0);
  useEffect(() => {
    if (!breakEnd) return;
    const tick = () => { const left = Math.max(0, Math.ceil((breakEnd - performance.now()) / 1000)); setBreakRemaining(left); if (!left) setBreakEnd(null); };
    tick(); const timer = setInterval(tick, 250); return () => clearInterval(timer);
  }, [breakEnd]);
  const seconds = session ? remainingSeconds(session, elapsed) : breakMinutes ? breakEnd ? breakRemaining : breakMinutes * 60 : focusSeconds;
  const transition = useCallback(async action => {
    const result = await onTransition(session.publicId, action, session.version);
    if (result && ['COMPLETED', 'STOPPED'].includes(result.status)) onComplete(result);
  }, [session, onTransition, onComplete]);
  useEffect(() => {
    if (session?.status !== 'RUNNING' || seconds !== 0 || busy || pending) return;
    const key = `${session.publicId}:${session.version}`;
    if (attempted.current === key) return;
    attempted.current = key;
    transition('COMPLETE');
  }, [session, seconds, busy, pending, transition]);
  const disabled = busy || pending;
  const openTasks = tasks.filter(t => t.status !== 'DONE' && t.publicId);
  const task = openTasks.find(t => t.publicId === taskId);
  const subject = subjects.find(s => String(s.id) === subjectId);
  return <section id="focus-timer" className="surface focus-widget p-4 space-y-2 scroll-mt-24" aria-label="Đồng hồ Pomodoro" aria-busy={busy}>
    <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-bold"><Timer className="w-5 h-5 text-blue-600" />Pomodoro</h3><span className="text-xs text-slate-600 dark:text-slate-300">{session?.status === 'PAUSED' ? 'Đã tạm dừng' : breakMinutes && !session ? 'Nghỉ ngơi' : 'Tập trung'}</span></div>
    {!session && <div className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">{['focus', 'short', 'long'].map(key => <button key={key} disabled={disabled} onClick={() => { setMode(key); setBreakEnd(null); }} aria-pressed={mode === key} className={`flex-1 rounded-lg px-1 py-2 text-xs font-semibold ${mode === key ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-200 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}>{key === 'focus' ? 'Học' : 'Nghỉ'} {timerMinutes[key]} phút</button>)}</div>}
    <p className="text-center text-5xl font-extrabold tabular-nums tracking-tight py-1" role="timer" aria-label="Thời gian còn lại">{String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}</p>
    {session && <p className="text-sm font-semibold break-words">{session.taskTitle || 'Học tự do'} · {session.subjectName || 'Không gắn môn'}</p>}
    <div className="flex flex-wrap gap-2">
      {session ? <>
        <button className="primary-button flex-1 justify-center" disabled={disabled || seconds === 0} onClick={() => transition(session.status === 'RUNNING' ? 'PAUSE' : 'RESUME')}>{session.status === 'RUNNING' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{session.status === 'RUNNING' ? 'Tạm dừng' : 'Tiếp tục'}</button>
        <button className="secondary-button" disabled={disabled} onClick={() => transition('STOP')}><Square className="w-4 h-4" />Dừng và lưu</button>
        <button className="secondary-button" disabled={disabled} aria-label="Hủy phiên, không ghi giờ" title="Hủy phiên, không ghi giờ" onClick={() => transition('DISCARD')}><Trash2 className="w-4 h-4" /></button>
      </> : <button className="primary-button w-full justify-center" disabled={disabled} onClick={() => {
        if (breakMinutes) { setBreakEnd(breakEnd ? null : performance.now() + breakMinutes * 60000); return; }
        if (!user) { onLogin(); return; }
        onCreate({ taskId: task?.publicId || null, subjectId: task ? null : subject?.id ?? null, targetSeconds: focusSeconds });
      }}><Play className="w-4 h-4" />{breakEnd ? 'Đặt lại giờ nghỉ' : busy ? 'Đang lưu…' : !user && !breakMinutes ? 'Đăng nhập để bắt đầu' : 'Bắt đầu'}</button>}
    </div>
    {!session && !breakMinutes && <details className="text-sm">
      <summary className="cursor-pointer py-2 text-slate-700 dark:text-slate-200 break-words">{task?.title || subject?.name || 'Gắn nhiệm vụ hoặc môn học'}</summary>
      <div className="space-y-2 pb-2">
        <label className="form-label">Nhiệm vụ<select className="field w-full" disabled={disabled} value={task?.publicId || ''} onChange={e => setTaskId(e.target.value)}><option value="">Không gắn nhiệm vụ</option>{openTasks.map(t => <option key={t.publicId} value={t.publicId}>{t.title}</option>)}</select></label>
        {!task && <label className="form-label">Môn học<select className="field w-full" disabled={disabled} value={subject?.id || ''} onChange={e => setSubjectId(e.target.value)}><option value="">Học tự do</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
      </div>
    </details>}
    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{breakMinutes && !session ? 'Giờ nghỉ không cộng vào giờ học.' : 'Giờ học được ghi khi hoàn tất hoặc chọn Dừng và lưu.'}</p>
  </section>;
}
