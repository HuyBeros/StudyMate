import { dateKey } from '../lib/studyMetrics';
import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Circle, Play,
  Trash2, Calendar as CalendarIcon, Tag, Plus, Star
} from 'lucide-react';

export default function TodoList({ tasks, subjects, onTaskAdd, onTaskUpdate, onTaskDelete, onStartPomodoro }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, TODAY, SUBJECT
  const [filterSubjectId, setFilterSubjectId] = useState('');
  const [pending, setPending] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const runTask = async (id, action) => { setPending(id); try { await action(); } finally { setPending(null); } };

  // Grouping logic
  const groupedTasks = useMemo(() => {
    const groups = { OVERDUE: [], TODAY: [], UPCOMING: [], DONE: [] };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filteredTasks = (tasks || []).filter(t => {
      if (filter === 'TODAY') {
        if (!t.dueAt) return t.status === 'DONE' ? dateKey(t.completedAt) === dateKey(today) : true;
        const d = new Date(t.dueAt);
        const tDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        return tDate.getTime() === today.getTime();
      }
      if (filter === 'SUBJECT' && filterSubjectId) {
        return t.subjectId === parseInt(filterSubjectId);
      }
      return true;
    });

    filteredTasks.forEach(t => {
      if (t.status === 'DONE') {
        groups.DONE.push(t);
        return;
      }
      if (t.dueAt) {
        const d = new Date(t.dueAt);
        const tDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        if (tDate.getTime() < today.getTime()) {
          groups.OVERDUE.push(t);
        } else if (tDate.getTime() === today.getTime()) {
          groups.TODAY.push(t);
        } else {
          groups.UPCOMING.push(t);
        }
      } else {
        groups.TODAY.push(t); // No date -> assume today
      }
    });
    
    return groups;
  }, [tasks, filter, filterSubjectId]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsAdding(true);
    try {
      const saved = await onTaskAdd({ title: newTaskTitle.trim(), priority: 'MEDIUM', status: 'TODO', subjectId: filterSubjectId ? Number(filterSubjectId) : null });
      if (saved) setNewTaskTitle('');
    } finally { setIsAdding(false); }
  };

  const renderTask = (task, overdue = false) => (
    <div key={task.id} className={`group flex items-center gap-3 py-3 px-2 transition-all duration-200 ${overdue ? 'mb-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40' : 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'} ${task.status === 'DONE' ? 'task-completed' : ''}`}>
      <button disabled={pending === task.id} aria-label={`${task.status === 'DONE' ? 'Mở lại' : 'Hoàn thành'}: ${task.title}`} onClick={() => runTask(task.id, () => onTaskUpdate(task.id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' }))} className="transition-transform active:scale-90 flex-shrink-0">
        {task.status === 'DONE' ? (
          <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white" />
        ) : (
          <Circle className="w-5 h-5 text-slate-600 hover:text-blue-500" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium truncate ${task.status === 'DONE' ? 'line-through text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'}`}>
            {task.title}
          </p>
          <div className="flex items-center gap-1 task-actions transition-opacity flex-shrink-0">
            {task.status !== 'DONE' && (
              <button onClick={() => onStartPomodoro(task)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 dark:hover:bg-slate-700 transition-colors" title="Đến đồng hồ Pomodoro" aria-label="Đến đồng hồ Pomodoro">
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            )}
            <button disabled={pending === task.id} aria-label={`Xóa: ${task.title}`} onClick={() => runTask(task.id, () => onTaskDelete(task.id))} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-slate-700 transition-colors" title="Xóa">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {(task.subjectName || task.dueAt) && (
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            {task.subjectName && (
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300 flex items-center gap-1">
                <Tag className="w-3 h-3" /> {task.subjectName}
              </span>
            )}
            {task.dueAt && (
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-300 flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {new Date(task.dueAt).toLocaleDateString('vi-VN')}
              </span>
            )}
          </div>
        )}
      </div>

      <button disabled={pending === task.id} aria-label={`Đánh dấu quan trọng: ${task.title}`} onClick={() => runTask(task.id, () => onTaskUpdate(task.id, { priority: task.priority === 'HIGH' ? 'MEDIUM' : 'HIGH' }))} className="flex-shrink-0 ml-2" title="Đánh dấu quan trọng">
        <Star className={`w-5 h-5 transition-colors ${task.priority === 'HIGH' ? 'fill-blue-600 text-blue-600' : 'text-slate-600 dark:text-slate-300 hover:text-blue-500'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-64 bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
          Nhiệm vụ
        </h3>
        <div className="flex items-center gap-2">
          <select aria-label="Lọc nhiệm vụ"
            value={filter} 
            onChange={(e) => { setFilter(e.target.value); if(e.target.value!=='SUBJECT') setFilterSubjectId(''); }}
            className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl px-3 py-1.5 border-none outline-none"
          >
            <option value="ALL">Tất cả</option>
            <option value="TODAY">Hôm nay</option>
            <option value="SUBJECT">Theo môn</option>
          </select>
          {filter === 'SUBJECT' && (
            <select aria-label="Lọc nhiệm vụ theo môn học"
              value={filterSubjectId}
              onChange={(e) => setFilterSubjectId(e.target.value)}
              className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl px-3 py-1.5 border-none outline-none max-w-[120px]"
            >
              <option value="">Chọn môn</option>
              {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-4">
        {Object.values(groupedTasks).every(group => group.length === 0) ? (
          <div className="flex flex-col items-center justify-center text-center py-6">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Chưa có nhiệm vụ nào</p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">Thử thêm “Ôn tập bài hôm nay” hoặc điều chỉnh bộ lọc.</p>
          </div>
        ) : (
          <>
            {groupedTasks.OVERDUE.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-red-500 tracking-wide pl-1 mb-1">Quá hạn</h4>
                <div className="flex flex-col">{groupedTasks.OVERDUE.map(task => renderTask(task, true))}</div>
              </div>
            )}
            
            {groupedTasks.TODAY.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-blue-500 tracking-wide pl-1 mb-1">Hôm nay</h4>
                <div className="flex flex-col">{groupedTasks.TODAY.map(task => renderTask(task))}</div>
              </div>
            )}

            {groupedTasks.UPCOMING.length > 0 && (
              <div className="space-y-1">
                <h4 className="text-[11px] font-bold text-slate-500 tracking-wide pl-1 mb-1">Sắp tới</h4>
                <div className="flex flex-col">{groupedTasks.UPCOMING.map(task => renderTask(task))}</div>
              </div>
            )}

            {groupedTasks.DONE.length > 0 && (
              <div className="space-y-1 mt-4">
                <h4 className="text-[11px] font-bold text-slate-500 tracking-wide pl-1 mb-1">Đã xong</h4>
                <div className="flex flex-col">{groupedTasks.DONE.map(task => renderTask(task))}</div>
              </div>
            )}
          </>
        )}
      </div>

      <form onSubmit={handleAddSubmit} className="relative mt-auto">
        <div className="flex items-center bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 focus-within:bg-white dark:focus-within:bg-[#111C32] focus-within:border-blue-500 transition-all">
          <Plus className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
          <input 
            type="text" 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Thêm một việc cần làm…" aria-label="Tên nhiệm vụ mới"
            className="w-full bg-transparent border-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-0"
          />
          <button type="submit" disabled={isAdding || !newTaskTitle.trim()} className="font-semibold text-blue-700 dark:text-blue-300 text-sm pl-3 shrink-0">{isAdding ? 'Đang lưu…' : 'Thêm'}</button>
        </div>
      </form>
    </div>
  );
}
