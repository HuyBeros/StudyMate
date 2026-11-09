import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ClipboardList, Send, Sparkles, X } from 'lucide-react';
import { askDailyAssistantApi } from '../services/api';

const suggestions = [
  ['Việc hôm nay', 'Hôm nay có những nhiệm vụ gì?'],
  ['Tiết tiếp theo', 'Tiết tiếp theo học ở đâu?'],
  ['Lịch ngày mai', 'Lịch học ngày mai có gì?'],
  ['Bài sắp đến hạn', 'Tuần này có bài nào sắp đến hạn?'],
];

const displayDate = value => value.split('-').reverse().join('/');
const displayTime = value => value.slice(0, 5);

function LessonCard({ lesson, onNavigate }) {
  const clock = lesson.startTime
    ? displayTime(lesson.startTime) + (lesson.endTime ? ' – ' + displayTime(lesson.endTime) : '')
    : 'Chưa ghi giờ';
  return <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
    <button type="button" className="text-left font-semibold text-blue-700 hover:underline dark:text-blue-300"
      onClick={() => onNavigate('schedule', lesson.date)}>{lesson.subject}</button>
    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
      {displayDate(lesson.date)} · {clock}{lesson.periods ? ' · Tiết ' + lesson.periods : ''}
    </p>
    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
      {lesson.online && 'Học trực tuyến · '}{lesson.room?.trim() || 'Chưa có thông tin phòng học'}
    </p>
  </li>;
}

function DeadlineCard({ task }) {
  const [date, time] = task.dueAt.split('T');
  return <li className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
    <p className="font-semibold">{task.title}</p>
    <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
      {task.subject && task.subject + ' · '}{displayDate(date)} {displayTime(time)}
      {task.overdue && <span className="ml-2 font-semibold text-red-700 dark:text-red-300">Quá hạn</span>}
    </p>
  </li>;
}

function ResultGroup({ group, onNavigate }) {
  const shown = group.lessons.length + group.deadlines.length;
  return <section className="space-y-2">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-bold">{group.title} <span className="font-normal text-slate-600 dark:text-slate-300">({group.total})</span></h3>
      <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300"
        onClick={() => onNavigate(group.target, group.date)}>
        {group.target === 'schedule' ? <><CalendarDays className="h-4 w-4" />Mở lịch</> : <><ClipboardList className="h-4 w-4" />Mở nhiệm vụ</>}
      </button>
    </div>
    {shown ? <ul className="space-y-2">
      {group.lessons.map(lesson => <LessonCard key={lesson.id + ':' + lesson.date} lesson={lesson} onNavigate={onNavigate} />)}
      {group.deadlines.map(task => <DeadlineCard key={task.id} task={task} />)}
    </ul> : <p className="text-xs text-slate-600 dark:text-slate-300">Chưa có mục nào.</p>}
    {shown < group.total && <p className="text-xs text-slate-600 dark:text-slate-300">Đang hiển thị {shown}/{group.total}. Mở danh sách để xem thêm.</p>}
  </section>;
}

export default function DailyAssistant({ onClose, onNavigate }) {
  const dialog = useRef(null);
  const latest = useRef(null);
  const busyRef = useRef(false);
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!dialog.current.open) dialog.current.showModal();
  }, []);
  useEffect(() => { latest.current?.scrollIntoView({ block: 'end' }); }, [turns, busy]);

  async function send(value) {
    const message = value.trim();
    if (!message || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setQuestion('');
    setTurns(current => [...current.slice(-19), { question: message }]);
    try {
      const result = await askDailyAssistantApi(message);
      const response = result.success ? { reply: result.data }
        : { error: 'Chưa thể tra cứu. Hãy thử lại hoặc mở lịch và nhiệm vụ để kiểm tra.' };
      setTurns(current => current.map((turn, index) => index === current.length - 1 ? { ...turn, ...response } : turn));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return <dialog ref={dialog} onCancel={event => { event.preventDefault(); onClose(); }}
    aria-labelledby="daily-assistant-title"
    className="m-auto max-h-[88dvh] w-[92vw] max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl backdrop:bg-slate-950/60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
    <div className="flex max-h-[88dvh] flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4 dark:border-slate-700 sm:px-5">
        <div>
          <h2 id="daily-assistant-title" className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-blue-600" />Hỏi StudyMate</h2>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Tra lịch học, phòng học và nhiệm vụ từ tài khoản của bạn.</p>
        </div>
        <button type="button" className="secondary-button shrink-0" aria-label="Đóng trợ lý" onClick={onClose}><X className="h-4 w-4" /></button>
      </header>
      <div className="min-h-28 flex-1 space-y-4 overflow-y-auto p-4 text-sm sm:px-5" role="log" aria-label="Cuộc trò chuyện">
        {!turns.length && <p className="rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">Bạn có thể hỏi theo ngày, chẳng hạn “Lịch học ngày 26/10/2026”.</p>}
        {turns.map((turn, index) => <div key={index} className="space-y-3">
          <p className="ml-auto w-fit max-w-[90%] break-words rounded-xl bg-blue-600 px-3 py-2 text-white">{turn.question}</p>
          {turn.reply && <div className="space-y-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p>{turn.reply.message}</p>
            {turn.reply.groups.map(group => <ResultGroup key={group.title} group={group} onNavigate={onNavigate} />)}
          </div>}
          {turn.error && <p role="alert" className="text-red-700 dark:text-red-300">{turn.error}</p>}
        </div>)}
        {busy && <p role="status" className="text-slate-600 dark:text-slate-300">Đang tra cứu…</p>}
        <div ref={latest} />
      </div>
      <footer className="shrink-0 space-y-3 border-t border-slate-200 p-4 dark:border-slate-700 sm:px-5">
        <div className="flex flex-wrap gap-2">
          {suggestions.map(([label, value]) => <button key={label} type="button" disabled={busy}
            className="rounded-full border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950"
            onClick={() => send(value)}>{label}</button>)}
        </div>
        <form className="flex gap-2" onSubmit={event => { event.preventDefault(); send(question); }}>
          <input type="text" className="field min-w-0 flex-1" value={question} onChange={event => setQuestion(event.target.value)}
            maxLength={500} aria-label="Câu hỏi cho StudyMate" placeholder="Nhập câu hỏi…" />
          <button type="submit" className="primary-button shrink-0" disabled={busy || !question.trim()}><Send className="h-4 w-4" />Gửi</button>
        </form>
      </footer>
    </div>
  </dialog>;
}
