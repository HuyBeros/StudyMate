import { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Calendar, Clock, MapPin, Plus, X } from 'lucide-react';
import { checkScheduleConflictApi, createScheduleSlotApi, createSubjectApi, updateScheduleSlotApi } from '../services/api';
import { dateKey } from '../lib/studyMetrics';

const days = [
  ['THU_2', 'Thứ 2', 'T2'], ['THU_3', 'Thứ 3', 'T3'], ['THU_4', 'Thứ 4', 'T4'],
  ['THU_5', 'Thứ 5', 'T5'], ['THU_6', 'Thứ 6', 'T6'], ['THU_7', 'Thứ 7', 'T7'],
  ['CHU_NHAT', 'Chủ nhật', 'CN'],
];
const dayLabels = Object.fromEntries(days);
const presets = {
  SANG: [['07:00-09:25', '1–3'], ['09:30-12:00', '4–6']],
  CHIEU: [['12:30-14:55', '7–9'], ['15:05-17:30', '10–12']],
  TOI: [['18:00-20:30', '13–15']],
};
const newSubject = 'NEW_SUBJECT';
const inputClass = 'field w-full font-normal focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:[color-scheme:dark]';
const sectionClass = 'min-w-0 space-y-3 rounded-2xl border border-slate-200 p-3.5 sm:p-4 dark:border-slate-700';
const choiceClass = selected => selected
  ? 'border-blue-600 bg-blue-50 text-blue-800 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-100'
  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800';

export default function CreateScheduleModal({ onClose, subjects, onAddSlot, slotToEdit, defaultDay, defaultDate }) {
  const dialog = useRef(null);
  const [subjectId, setSubjectId] = useState(String(slotToEdit?.subjectId ?? subjects[0]?.id ?? newSubject));
  const [addedSubject, setAddedSubject] = useState(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectType, setSubjectType] = useState('SCHOOL');
  const [subjectColor, setSubjectColor] = useState('#2563EB');
  const [subjectCode, setSubjectCode] = useState('');
  const [isRecurring, setIsRecurring] = useState(slotToEdit?.isRecurring ?? true);
  const [selectedDays, setSelectedDays] = useState([slotToEdit?.dayOfWeek ?? defaultDay ?? 'THU_2']);
  const [date, setDate] = useState(slotToEdit?.date?.slice(0, 10) || defaultDate || dateKey());
  const [shift, setShift] = useState(slotToEdit?.shift ?? 'SANG');
  const [period, setPeriod] = useState('');
  const [startTime, setStartTime] = useState(slotToEdit ? slotToEdit.startTime?.slice(0, 5) || '' : '08:00');
  const [endTime, setEndTime] = useState(slotToEdit ? slotToEdit.endTime?.slice(0, 5) || '' : '10:30');
  const [room, setRoom] = useState(slotToEdit?.room || '');
  const [teacher, setTeacher] = useState(slotToEdit?.teacherName || slotToEdit?.teacher || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (!dialog.current.open) dialog.current.showModal(); }, []);

  const singleDay = date ? days[(new Date(date + 'T12:00:00').getDay() + 6) % 7]?.[0] : null;
  const timeError = Boolean(startTime) !== Boolean(endTime)
    ? 'Điền cả giờ bắt đầu và kết thúc, hoặc để trống cả hai.'
    : startTime && startTime >= endTime ? 'Giờ kết thúc phải sau giờ bắt đầu.' : '';
  const daySummary = isRecurring
    ? days.filter(([key]) => selectedDays.includes(key)).map(([, , short]) => short).join(', ') || 'Chưa chọn thứ'
    : date ? date.split('-').reverse().join('/') : 'Chưa chọn ngày';

  function selectDay(day) {
    setSelectedDays(current => {
      if (slotToEdit) return [day];
      return current.includes(day) ? current.filter(value => value !== day) : [...current, day];
    });
    setError('');
  }

  async function save(event) {
    event.preventDefault();
    if (loading) return;
    const selected = isRecurring ? days.map(([day]) => day).filter(day => selectedDays.includes(day)) : [singleDay];
    if (!selected.length || !selected[0]) { setError('Hãy chọn ngày học trước khi lưu.'); return; }
    if (timeError) { setError(timeError); return; }
    if (subjectId === newSubject && !subjectName.trim()) { setError('Hãy nhập tên môn học.'); return; }
    setError('');
    setLoading(true);
    let savedCount = 0;
    let subjectCreated = false;
    const failedDays = [];
    let failureMessage = '';
    try {
      const times = { startTime: startTime ? startTime + ':00' : null, endTime: endTime ? endTime + ':00' : null };
      if (isRecurring && startTime) {
        for (const dayOfWeek of selected) {
          const result = await checkScheduleConflictApi({ id: slotToEdit?.id ?? null, dayOfWeek, isRecurring, ...times });
          if (result.success && result.data?.conflictType === 'HARD_CONFLICT') {
            setError(dayLabels[dayOfWeek] + ' · ' + result.data.message);
            return;
          }
        }
      }

      let chosenSubject = subjectId;
      if (subjectId === newSubject) {
        const result = await createSubjectApi({
          name: subjectName.trim(), type: subjectType, color: subjectColor, classCode: subjectCode.trim(),
        });
        if (!result.success || !result.data?.id) {
          setError(result.message || 'Chưa tạo được môn học.');
          return;
        }
        chosenSubject = String(result.data.id);
        setAddedSubject(result.data);
        setSubjectId(chosenSubject);
        subjectCreated = true;
      }

      const payload = {
        subjectId: Number(chosenSubject),
        date: isRecurring ? null : date,
        shift, isRecurring, ...times,
        room: room.trim(), teacherName: teacher.trim(),
        periods: presets[shift].find(([value]) => value === period)?.[1] ?? slotToEdit?.periods ?? null,
        isOnline: slotToEdit?.isOnline ?? false,
        teacherPhone: slotToEdit?.teacherPhone ?? null,
        department: slotToEdit?.department ?? null,
      };

      for (const dayOfWeek of selected) {
        const request = { ...payload, dayOfWeek };
        const result = slotToEdit
          ? await updateScheduleSlotApi(slotToEdit.id, request)
          : await createScheduleSlotApi(request);
        if (result.success) savedCount++;
        else {
          failedDays.push(dayOfWeek);
          failureMessage ||= result.message;
        }
      }
      if (!failedDays.length) {
        onClose();
      } else {
        if (savedCount && isRecurring) setSelectedDays(failedDays);
        setError(savedCount
          ? 'Đã lưu ' + savedCount + ' buổi. Hãy thử lại cho ' + failedDays.map(day => dayLabels[day]).join(', ') + '.'
          : failureMessage || 'Chưa lưu được lịch học. Hãy thử lại.');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ. Hãy thử lại.');
    } finally {
      if (savedCount || subjectCreated) onAddSlot();
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialog} aria-labelledby="schedule-form-title" aria-describedby="schedule-form-description"
      onCancel={event => { event.preventDefault(); if (!loading) onClose(); }}
      className="m-auto w-[calc(100%-1rem)] max-w-3xl max-h-[calc(100dvh-1rem)] overflow-hidden rounded-2xl bg-white p-0 text-slate-900 shadow-2xl ring-1 ring-slate-200 backdrop:bg-slate-950/60 dark:bg-[#111C32] dark:text-slate-100 dark:ring-slate-700 sm:max-h-[calc(100dvh-2rem)]">
      <form onSubmit={save} aria-busy={loading} className="flex max-h-[inherit] flex-col">
        <header className="flex shrink-0 items-start gap-3 border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-slate-700">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Calendar className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="schedule-form-title" className="text-lg font-bold sm:text-xl">{slotToEdit ? 'Chỉnh sửa lịch học' : 'Thêm lịch học'}</h2>
            <p id="schedule-form-description" className="text-sm text-slate-600 dark:text-slate-300">Chọn môn và thời gian học.</p>
          </div>
          <button type="button" onClick={onClose} disabled={loading} aria-label="Đóng form lịch học"
            className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">
            <X className="size-5" />
          </button>
        </header>

        <div data-schedule-fields className="grid min-h-0 flex-1 content-start items-start gap-3 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <fieldset disabled={loading} className={sectionClass + ' md:col-start-1 md:row-start-1'} aria-labelledby="schedule-subject-title">
            <h3 id="schedule-subject-title" className="flex items-center gap-2 text-sm font-bold"><BookOpen className="size-4 text-blue-600 dark:text-blue-300" />Môn học</h3>
            <label className="form-label"><span className="sr-only">Môn học</span>
              <select className={inputClass} value={subjectId} onChange={event => { setSubjectId(event.target.value); setError(''); }} required>
                {subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                {addedSubject && !subjects.some(subject => subject.id === addedSubject.id) && <option value={addedSubject.id}>{addedSubject.name}</option>}
                <option value={newSubject}>+ Tạo môn học mới</option>
              </select>
            </label>
            {subjectId === newSubject && <div className="space-y-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
              <label className="form-label">Tên môn học
                <input className={inputClass} value={subjectName} onChange={event => setSubjectName(event.target.value)}
                  required maxLength={255} placeholder="Ví dụ: Kiểm thử phần mềm" />
              </label>
              <details>
                <summary className="cursor-pointer py-1 text-sm font-semibold text-blue-700 dark:text-blue-300">Tùy chọn môn học</summary>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="form-label">Loại môn học
                    <select className={inputClass} value={subjectType} onChange={event => setSubjectType(event.target.value)}>
                      <option value="SCHOOL">Trường học</option><option value="SELF_STUDY">Tự học</option><option value="LANGUAGE">Ngoại ngữ</option>
                    </select>
                  </label>
                  <label className="form-label">Mã lớp
                    <input className={inputClass} value={subjectCode} onChange={event => setSubjectCode(event.target.value)} placeholder="Ví dụ: INT1332" />
                  </label>
                  <label className="form-label">Màu đại diện
                    <input type="color" className="field w-20 cursor-pointer p-1" value={subjectColor} onChange={event => setSubjectColor(event.target.value)} />
                  </label>
                </div>
              </details>
            </div>}
          </fieldset>

          <fieldset disabled={loading} className={sectionClass + ' md:col-start-2 md:row-span-2 md:row-start-1'} aria-labelledby="schedule-time-title">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id="schedule-time-title" className="flex items-center gap-2 text-sm font-bold"><Clock className="size-4 text-blue-600 dark:text-blue-300" />Thời gian học</h3>
              <div role="group" aria-label="Kiểu lặp" className="grid w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 sm:w-auto dark:bg-slate-800">
                {[[true, 'Hằng tuần'], [false, 'Một lần']].map(([value, label]) => <button key={label} type="button"
                  aria-pressed={isRecurring === value} onClick={() => { setIsRecurring(value); setError(''); }}
                  className={'min-h-9 rounded-lg border px-3 text-sm font-semibold ' + (isRecurring === value ? choiceClass(true) : 'border-transparent text-slate-700 dark:text-slate-200')}>{label}</button>)}
              </div>
            </div>
            {isRecurring ? <div className="space-y-1.5">
              <p id="schedule-weekdays-label" className="text-sm font-semibold">Thứ trong tuần <span className="font-normal text-slate-600 dark:text-slate-300">· {slotToEdit ? 'chọn một thứ' : 'có thể chọn nhiều'}</span></p>
              <div role="group" aria-labelledby="schedule-weekdays-label" className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
                {days.map(([day, name, short]) => <button key={day} type="button" aria-label={name}
                  aria-pressed={selectedDays.includes(day)} onClick={() => selectDay(day)}
                  className={'min-h-11 rounded-xl border text-sm font-semibold ' + choiceClass(selectedDays.includes(day))}>{short}</button>)}
              </div>
            </div> : <label className="form-label">Ngày học
              <input type="date" required className={inputClass} value={date} onChange={event => setDate(event.target.value)} />
            </label>}

            <div className="grid gap-3 min-[420px]:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <label className="form-label">Ca học
                <select className={inputClass} value={shift} onChange={event => { setShift(event.target.value); setPeriod(''); }}>
                  <option value="SANG">Sáng</option><option value="CHIEU">Chiều</option><option value="TOI">Tối</option>
                </select>
              </label>
              <label className="form-label">Tiết học chuẩn
                <select className={inputClass} value={period} onChange={event => {
                  const value = event.target.value;
                  setPeriod(value);
                  if (value) { const [start, end] = value.split('-'); setStartTime(start); setEndTime(end); }
                }}>
                  <option value="">Tự chọn giờ</option>
                  {presets[shift].map(([value, label]) => <option key={value} value={value}>{'Tiết ' + label + ' · ' + value.replace('-', ' – ')}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-3 min-[360px]:grid-cols-2">
              <label className="form-label">Giờ bắt đầu
                <input type="time" className={inputClass} value={startTime} aria-invalid={!!timeError}
                  onChange={event => { setStartTime(event.target.value); setPeriod(''); setError(''); }} />
              </label>
              <label className="form-label">Giờ kết thúc
                <input type="time" className={inputClass} value={endTime} aria-invalid={!!timeError}
                  onChange={event => { setEndTime(event.target.value); setPeriod(''); setError(''); }} />
              </label>
            </div>
            {timeError && <p className="text-sm text-red-700 dark:text-red-300">{timeError}</p>}
          </fieldset>

          <fieldset disabled={loading} className={sectionClass + ' md:col-start-1 md:row-start-2'} aria-labelledby="schedule-details-title">
            <h3 id="schedule-details-title" className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <MapPin className="size-4 text-blue-600 dark:text-blue-300" />Phòng học và giảng viên <span className="font-normal text-slate-600 dark:text-slate-300">· Tùy chọn</span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <label className="form-label">Phòng học<input className={inputClass} value={room} onChange={event => setRoom(event.target.value)} placeholder="Ví dụ: 321 – A7" /></label>
              <label className="form-label">Giảng viên<input className={inputClass} value={teacher} onChange={event => setTeacher(event.target.value)} placeholder="Tên giảng viên" /></label>
            </div>
          </fieldset>
        </div>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-6 dark:border-slate-700 dark:bg-[#111C32]">
          {error && <p role="alert" className="mb-2 flex max-h-[20dvh] items-start gap-2 overflow-y-auto rounded-lg bg-red-50 p-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            <AlertCircle className="mt-0.5 size-4 shrink-0" /><span className="break-words">{error}</span>
          </p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{daySummary} · {startTime && endTime ? startTime + ' – ' + endTime : 'Chưa có giờ'}</p>
            <div className="ml-auto flex flex-wrap justify-end gap-2">
              <button type="button" className="secondary-button" onClick={onClose} disabled={loading}>Hủy</button>
              <button type="submit" className="primary-button disabled:opacity-60" disabled={loading}>
                {!slotToEdit && <Plus className="size-4" />}
                {loading ? 'Đang lưu…' : slotToEdit ? 'Lưu thay đổi' : 'Lưu lịch học'}
              </button>
            </div>
          </div>
        </footer>
      </form>
    </dialog>
  );
}
