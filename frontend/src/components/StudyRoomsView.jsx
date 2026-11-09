import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ImagePlus, Link2, Maximize, MessageCircle, Minimize, Plus, Send, Timer, Users, X } from 'lucide-react';
import { request } from '../services/api';
import { inviteUrl, phaseLabels, roomCommand, roomIdPattern, roomImage, roomPath, roomsPath, timerText } from '../lib/studyRoom';
import useRoomConnection from '../hooks/useRoomConnection';

const messageError = 'Chưa thực hiện được. Hãy thử lại.';
const localTime = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });
const phaseText = value => value.paused ? phaseLabels[value.phase] + ' · Đã tạm dừng' : phaseLabels[value.phase];

function ChatImage({ room, id }) {
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!open) return;
    const abort = new AbortController();
    let url;
    roomImage(room, id, abort.signal).then(blob => {
      if (abort.signal.aborted) return;
      url = URL.createObjectURL(blob);
      setSrc(url);
    }).catch(() => { if (!abort.signal.aborted) setError('Chưa tải được ảnh.'); });
    return () => { abort.abort(); if (url) URL.revokeObjectURL(url); };
  }, [open, room, id]);
  return <>
    {src && <img src={src} alt="Ảnh đính kèm trong phòng học" className="mt-2 max-h-72 max-w-full rounded-xl object-contain" />}
    {open && !src && !error && <p className="mt-2 text-sm">Đang tải ảnh…</p>}
    {error && <p role="alert" className="mt-2 text-sm">{error}</p>}
    {(!open || src || error) && <button type="button" className="mt-2 text-sm font-semibold underline" onClick={() => {
      setOpen(!open); setSrc(''); setError('');
    }}>{open ? 'Ẩn ảnh' : 'Xem ảnh'}</button>}
  </>;
}

const RoomChat = memo(function RoomChat({ snapshot, refresh, fullscreen }) {
  const [open, setOpen] = useState(snapshot.phase !== 'FOCUS');
  const [readThrough, setReadThrough] = useState(snapshot.messages.at(-1)?.id ?? 0);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messageKey = useRef(null);
  const list = useRef(null);
  const latestId = snapshot.messages.at(-1)?.id ?? 0;
  const unread = snapshot.messages.filter(message => message.id > readThrough).length;
  const visible = fullscreen || open;

  useEffect(() => { if (snapshot.phase === 'FOCUS' && !snapshot.paused) setOpen(false); }, [snapshot.phase, snapshot.paused]);
  useEffect(() => {
    if (visible) {
      setReadThrough(latestId);
      if (list.current) list.current.scrollTop = list.current.scrollHeight;
    }
  }, [visible, fullscreen, latestId]);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function send(event) {
    event.preventDefault();
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    setError('');
    messageKey.current ??= crypto.randomUUID();
    const body = new FormData();
    body.set('clientId', messageKey.current);
    body.set('text', text);
    if (file) body.set('file', file);
    const result = await request(roomPath(snapshot.id) + '/messages', { method: 'POST', body });
    setSending(false);
    if (!result.success) { setError(result.message || messageError); return; }
    setText('');
    setFile(null);
    messageKey.current = null;
    refresh();
  }

  return <section className={fullscreen ? 'surface flex h-full min-w-0 flex-col overflow-hidden' : 'surface min-w-0 overflow-hidden'}>
    {fullscreen ? <h3 className="flex min-h-14 shrink-0 items-center gap-2 px-4 py-3 font-bold">
      <MessageCircle className="size-5 text-blue-600 dark:text-blue-300" />Trao đổi
    </h3> : <button type="button" aria-expanded={open} aria-controls="room-chat-content" onClick={() => setOpen(!open)}
      className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left font-bold">
      <span className="flex items-center gap-2"><MessageCircle className="size-5 text-blue-600 dark:text-blue-300" />Trao đổi</span>
      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{open ? 'Thu gọn' : unread ? 'Mở chat · ' + unread + ' tin mới' : 'Mở chat'}</span>
    </button>}
    <div id="room-chat-content" hidden={!visible} className={fullscreen ? 'flex min-h-0 flex-1 flex-col' : undefined}>
      <div ref={list} role="log" aria-label="Tin nhắn trong phòng"
        className={'space-y-3 overflow-y-auto border-t border-slate-200 p-4 dark:border-slate-700 ' + (fullscreen ? 'max-h-64 min-h-28 flex-1 lg:max-h-none lg:min-h-0' : 'max-h-80')}>
        {!snapshot.messages.length && <p className="text-sm text-slate-600 dark:text-slate-300">Chưa có tin nhắn. Bạn có thể gửi câu hỏi hoặc ảnh bài tập.</p>}
        {snapshot.messages.map(message => <article key={message.id} className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
          <div className="flex flex-wrap justify-between gap-2"><strong className="break-all text-sm">{message.sender}</strong><time className="text-xs text-slate-600 dark:text-slate-300" dateTime={message.sentAt}>{localTime.format(new Date(message.sentAt))}</time></div>
          {message.text && <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.text}</p>}
          {message.image && <ChatImage room={snapshot.id} id={message.id} />}
        </article>)}
      </div>
      <form onSubmit={send} className="shrink-0 space-y-2 border-t border-slate-200 p-4 dark:border-slate-700">
        {file && <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          {preview && <img src={preview} alt="Ảnh xem trước" className="size-12 rounded object-cover" />}
          <p className="min-w-0 flex-1 truncate text-sm">{file.name}</p>
          <button type="button" className="secondary-button" aria-label="Bỏ ảnh đính kèm" disabled={sending}
            onClick={() => { setFile(null); messageKey.current = null; }}><X className="size-4" /></button>
        </div>}
        <label className="form-label"><span className="sr-only">Tin nhắn hoặc chú thích ảnh</span>
          <textarea className={fullscreen ? 'field w-full resize-none' : 'field w-full resize-y'} rows={2} maxLength={1000} value={text} disabled={sending}
            onChange={event => { setText(event.target.value); messageKey.current = null; }}
            placeholder={file ? 'Thêm chú thích (tùy chọn)' : 'Nhập tin nhắn…'} />
        </label>
        <div className="flex flex-wrap justify-between gap-2">
          <label className="secondary-button cursor-pointer focus-within:ring-2 focus-within:ring-blue-600">
            <ImagePlus className="size-4" />Chọn ảnh
            <input type="file" className="sr-only" accept="image/png,image/jpeg" disabled={sending} onChange={event => {
              const next = event.target.files?.[0];
              event.target.value = '';
              if (!next) return;
              if (!['image/png', 'image/jpeg'].includes(next.type) || next.size > 2 * 1024 * 1024) {
                setError('Hãy chọn JPG hoặc PNG tối đa 2 MB.');
                return;
              }
              setError(''); setPreview(''); setFile(next); messageKey.current = null;
            }} />
          </label>
          <button className="primary-button" disabled={sending || (!text.trim() && !file)}><Send className="size-4" />{sending ? 'Đang gửi…' : 'Gửi'}</button>
        </div>
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      </form>
    </div>
  </section>;
});

function Room({ initial, onExit, activeSession }) {
  const [view, setView] = useState(() => ({ snapshot: initial, received: performance.now() }));
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const sequence = useRef(0);
  const active = useRef(true);
  const expired = useRef(null);
  const focusDialog = useRef(null);
  const focusScreen = useRef(null);
  const roomChatSlot = useRef(null);
  const focusChatSlot = useRef(null);
  const [chatMount] = useState(() => document.createElement('div'));
  const [focusOpen, setFocusOpen] = useState(false);
  const nativeFullscreen = useRef(false);
  const { snapshot, received } = view;
  const path = roomPath(snapshot.id);
  const exit = useRef(onExit);
  useEffect(() => { exit.current = onExit; }, [onExit]);
  useEffect(() => { active.current = true; return () => { active.current = false; sequence.current++; }; }, []);

  const refresh = useCallback(async () => {
    const seq = ++sequence.current;
    const result = await request(path, { cache: 'no-store' });
    if (!active.current || seq !== sequence.current) return;
    if (result.success) {
      setView({ snapshot: result.data, received: performance.now() });
      setElapsed(0);
    } else if (result.httpStatus === 404) {
      exit.current('Phòng đã đóng, hết hạn hoặc bạn đã rời phòng.');
    }
  }, [path]);
  const connected = useRoomConnection(snapshot.id, refresh);

  // Move the same chat so drafts, attachments, and in-flight messages survive the layout change.
  useLayoutEffect(() => {
    const slot = focusOpen ? focusChatSlot.current : roomChatSlot.current;
    slot.appendChild(chatMount);
  }, [chatMount, focusOpen]);

  const closeFocus = useCallback(() => {
    const screen = focusScreen.current;
    nativeFullscreen.current = false;
    if (screen && document.fullscreenElement === screen) {
      document.exitFullscreen?.().catch(() => {});
    }
    if (focusDialog.current?.open) focusDialog.current.close();
    setFocusOpen(false);
  }, []);

  useEffect(() => {
    function syncFullscreen() {
      if (focusScreen.current && document.fullscreenElement === focusScreen.current) {
        nativeFullscreen.current = true;
      } else if (nativeFullscreen.current) {
        nativeFullscreen.current = false;
        closeFocus();
      }
    }
    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => document.removeEventListener('fullscreenchange', syncFullscreen);
  }, [closeFocus]);

  useEffect(() => {
    if (snapshot.phase === 'WAITING') closeFocus();
  }, [snapshot.phase, closeFocus]);

  function openFocus() {
    const dialog = focusDialog.current;
    const screen = focusScreen.current;
    if (!dialog || !screen || dialog.open) return;
    dialog.showModal();
    setFocusOpen(true);
    // Request browser fullscreen within the click, before the timer API returns.
    if (!document.fullscreenElement && screen.requestFullscreen) {
      screen.requestFullscreen().then(() => {
        if (!dialog.open && document.fullscreenElement === screen) document.exitFullscreen?.().catch(() => {});
      }).catch(() => {
        // The dialog itself fills the viewport when native fullscreen is unavailable.
      });
    }
  }

  useEffect(() => {
    if (!snapshot.deadline) return;
    function tick() { setElapsed(Math.max(0, performance.now() - received)); }
    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [received, snapshot.deadline]);
  const remaining = snapshot.remainingMs - (snapshot.deadline ? elapsed : 0);
  useEffect(() => {
    if (remaining <= 0 && snapshot.deadline && expired.current !== snapshot.deadline) {
      expired.current = snapshot.deadline;
      refresh();
    }
  }, [remaining, snapshot.deadline, refresh]);

  async function control(action) {
    setError(''); setBusy(true);
    const result = await roomCommand(path + '/timer', { action, revision: snapshot.revision });
    if (!active.current) return false;
    if (result.success) {
      sequence.current++;
      setView({ snapshot: result.data, received: performance.now() });
      setElapsed(0);
    } else setError(result.message || messageError);
    refresh();
    setBusy(false);
    return result.success;
  }

  async function startFocus() {
    openFocus();
    if (!(await control('START'))) closeFocus();
  }

  const controls = snapshot.host && snapshot.phase !== 'WAITING' && <>
    <button className="primary-button" disabled={busy} onClick={() => control(snapshot.paused ? 'RESUME' : 'PAUSE')}>
      {snapshot.paused ? 'Tiếp tục' : 'Tạm dừng'}
    </button>
    <button className="secondary-button" disabled={busy} onClick={() => control('RESET')}>Đặt lại</button>
  </>;

  async function leave() {
    setError(''); setBusy(true);
    const result = snapshot.host ? await request(path, { method: 'DELETE' }) : await roomCommand(path + '/leave');
    if (!active.current) return;
    if (result.success || result.httpStatus === 404) exit.current(snapshot.host ? 'Đã đóng phòng.' : 'Đã rời phòng.');
    else setError(result.message || messageError);
    setBusy(false);
  }

  return <div className="page-shell space-y-5">
    <button className="secondary-button" onClick={() => onExit()}><ArrowLeft className="size-4" />Danh sách phòng</button>
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><h2 className="break-words text-2xl font-bold sm:text-3xl">{snapshot.name}</h2>
        <p role="status" className="mt-1 text-sm text-slate-600 dark:text-slate-300">{connected ? 'Đã kết nối trực tiếp' : 'Đang kết nối lại · trạng thái được tải định kỳ'}</p></div>
      <button className="secondary-button" onClick={async () => {
        try { await navigator.clipboard.writeText(inviteUrl(snapshot.id)); setCopyStatus('Đã sao chép liên kết.'); }
        catch { setCopyStatus(inviteUrl(snapshot.id)); }
      }}><Link2 className="size-4" />Sao chép liên kết mời</button>
    </header>
    {copyStatus && <p role="status" className="select-text break-all text-sm text-blue-700 dark:text-blue-300">{copyStatus}</p>}
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <section className="surface space-y-4 p-5 text-center sm:p-7">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            <Timer className="size-4" />{phaseText(snapshot)}
          </div>
          <p role="timer" aria-label="Thời gian còn lại" className="text-5xl font-bold tabular-nums sm:text-7xl">{timerText(remaining)}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">25 phút học · 5 phút nghỉ</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">Thống kê cá nhân hiện tính các phiên từ Pomodoro trên Bảng điều khiển.</p>
          {!snapshot.host && <p className="text-sm text-slate-600 dark:text-slate-300">Chủ phòng điều khiển đồng hồ chung.</p>}
          <div className="flex flex-wrap justify-center gap-2">
            {snapshot.host && snapshot.phase === 'WAITING' && <button className="primary-button" disabled={busy} onClick={startFocus}>Bắt đầu tập trung</button>}
            {controls}
            {snapshot.phase !== 'WAITING' && <button className="secondary-button" onClick={openFocus}><Maximize className="size-4" />Toàn màn hình</button>}
          </div>
          {activeSession && <p className="text-sm text-slate-700 dark:text-slate-200">Bạn đang có một phiên Pomodoro cá nhân. Quản lý phiên đó trên Bảng điều khiển.</p>}
        </section>
        <section className="surface space-y-3 p-4 sm:p-5">
          <h3 className="flex items-center gap-2 font-bold"><Users className="size-5 text-blue-600 dark:text-blue-300" />Thành viên · {snapshot.members.length}/6</h3>
          <ul className="flex flex-wrap gap-2">{snapshot.members.map(member =>
            <li key={member.id} className="max-w-full break-all rounded-full bg-slate-100 px-3 py-1 text-sm dark:bg-slate-800">{member.name}</li>)}</ul>
        </section>
      </div>
      <div ref={roomChatSlot} className="min-w-0" />
    </div>
    {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
    <dialog ref={focusDialog} aria-labelledby="room-focus-title"
      onCancel={event => { event.preventDefault(); closeFocus(); }}
      className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-slate-50 p-0 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div ref={focusScreen} className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain bg-slate-50 dark:bg-slate-950">
        <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950 sm:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Phòng học Pomodoro</p>
            <h2 id="room-focus-title" className="break-words text-lg font-bold sm:text-xl">{snapshot.name}</h2>
          </div>
          <button className="secondary-button" onClick={closeFocus}><Minimize className="size-4" />Thoát toàn màn hình</button>
        </header>
        <div className="grid flex-1 gap-4 px-4 py-4 sm:px-8 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,25rem)] lg:grid-rows-[minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col items-center justify-center gap-4 py-3 text-center sm:gap-5 sm:py-6">
          <p role="status" className="flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            <Timer className="size-4" />{snapshot.phase === 'WAITING' && busy ? 'Đang bắt đầu…' : phaseText(snapshot)}
          </p>
          <p role="timer" aria-label="Thời gian còn lại" className="text-[clamp(3.5rem,13vw,9rem)] leading-none font-bold tabular-nums lg:text-[clamp(4rem,11vw,10rem)]">{timerText(remaining)}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">25 phút học · 5 phút nghỉ</p>
          {controls && <div className="flex flex-wrap justify-center gap-2">{controls}</div>}
          {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        </div>
          <div ref={focusChatSlot} className="min-w-0 lg:min-h-0 lg:[&>div]:h-full" />
        </div>
      </div>
    </dialog>
    {createPortal(<RoomChat snapshot={snapshot} refresh={refresh} fullscreen={focusOpen} />, chatMount)}
    {confirmClose ? <div className="surface flex flex-wrap items-center gap-3 p-4 text-sm">
      <p className="flex-1">Đóng phòng sẽ xóa tin nhắn và ảnh trong phòng.</p>
      <button className="secondary-button" disabled={busy} onClick={() => setConfirmClose(false)}>Hủy</button>
      <button className="primary-button" disabled={busy} onClick={leave}>Xác nhận đóng phòng</button>
    </div> : <button className="secondary-button" disabled={busy} onClick={() => snapshot.host ? setConfirmClose(true) : leave()}>{snapshot.host ? 'Đóng phòng' : 'Rời phòng'}</button>}
  </div>;
}

export default function StudyRoomsView({ user, onLogin, activeSession }) {
  const userId = user?.id;
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [code, setCode] = useState(() => new URLSearchParams(location.search).get('room') || '');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const loadRooms = useCallback(async () => {
    const result = await request(roomsPath, { cache: 'no-store' });
    if (result.success) setRooms(result.data);
    else setError(result.message || messageError);
  }, []);

  const openRoom = useCallback(async id => {
    setBusy(true); setError(''); setPreview(null);
    try {
      const existing = await request(roomPath(id), { cache: 'no-store' });
      if (existing.success) {
        history.replaceState(history.state, '', inviteUrl(id));
        setSelected(existing.data);
        return;
      }
      if (existing.httpStatus !== 404) throw new Error(existing.message || messageError);
      const result = await request(roomPath(id) + '/preview', { cache: 'no-store' });
      if (!result.success) throw new Error(result.message || messageError);
      setPreview({ id, ...result.data });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadRooms();
    const invited = new URLSearchParams(location.search).get('room');
    if (invited && roomIdPattern.test(invited)) openRoom(invited);
  }, [userId, loadRooms, openRoom]);

  async function create(event) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true); setError(''); setNotice('');
    const result = await roomCommand(roomsPath, { name: name.trim() });
    if (result.success) { setName(''); await openRoom(result.data); }
    else setError(result.message || messageError);
    setBusy(false);
  }

  function find(event) {
    event.preventDefault();
    let id = code.trim();
    try { id = new URL(id).searchParams.get('room') || ''; } catch { /* A code is valid too. */ }
    if (!roomIdPattern.test(id)) { setError('Hãy dán liên kết mời hoặc nhập mã phòng hợp lệ.'); return; }
    setNotice('');
    openRoom(id);
  }

  async function join() {
    setBusy(true); setError('');
    const result = await roomCommand(roomPath(preview.id) + '/join');
    if (result.success) {
      history.replaceState(history.state, '', inviteUrl(preview.id));
      setSelected(result.data);
      setPreview(null);
    } else setError(result.message || messageError);
    setBusy(false);
  }

  function exit(message = '') {
    const url = new URL(location.href);
    url.searchParams.delete('room');
    history.replaceState(history.state, '', url);
    setNotice(message);
    setError('');
    setSelected(null);
    setCode('');
    loadRooms();
  }

  if (selected && user) return <Room key={selected.id} initial={selected} onExit={exit} activeSession={activeSession} />;
  return <div className="page-shell space-y-5">
    <header><h2 className="text-2xl font-bold sm:text-3xl">Phòng học</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Cùng tập trung theo một đồng hồ Pomodoro và trao đổi khi cần.</p></header>
    {!user ? <section className="surface p-5"><button className="primary-button" onClick={onLogin}>Đăng nhập để vào phòng</button></section> : <>
      {notice && <p role="status" className="text-sm text-blue-700 dark:text-blue-300">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <form onSubmit={create} className="surface space-y-3 p-5">
          <h3 className="font-bold">Tạo phòng riêng</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Tối đa 6 người. Phòng có hiệu lực trong 7 ngày.</p>
          <label className="form-label">Tên phòng<input className="field" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Ví dụ: Ôn thi cùng nhóm" /></label>
          <button className="primary-button" disabled={busy || !name.trim()}><Plus className="size-4" />Tạo phòng</button>
        </form>
        <form onSubmit={find} className="surface space-y-3 p-5">
          <h3 className="font-bold">Tham gia bằng lời mời</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">Mở liên kết được chia sẻ hoặc dán vào ô bên dưới.</p>
          <label className="form-label">Liên kết hoặc mã phòng<input className="field" required maxLength={2048} value={code} onChange={event => { setCode(event.target.value); setPreview(null); }} placeholder="Dán lời mời…" /></label>
          <button className="secondary-button" disabled={busy || !code.trim()}>Xem phòng</button>
        </form>
      </div>
      {preview && <section className="surface flex flex-wrap items-center justify-between gap-3 p-5">
        <div><h3 className="break-words font-bold">{preview.name}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{phaseLabels[preview.phase]} · {timerText(preview.remainingMs)} · {preview.members}/{preview.capacity} thành viên</p></div>
        <button className="primary-button" disabled={busy || preview.members >= preview.capacity} onClick={join}>{preview.members >= preview.capacity ? 'Phòng đã đầy' : 'Vào phòng'}</button>
      </section>}
      <section className="surface space-y-3 p-5">
        <h3 className="font-bold">Phòng của bạn</h3>
        {rooms.length ? <ul className="grid gap-2 sm:grid-cols-2">{rooms.map(room => <li key={room.id}>
          <button className="secondary-button w-full justify-between gap-3 text-left" disabled={busy} onClick={() => openRoom(room.id)}>
            <span className="min-w-0 break-words">{room.name}</span><span className="shrink-0 text-xs">{room.host ? 'Chủ phòng' : 'Thành viên'}</span>
          </button>
        </li>)}</ul> : <p className="text-sm text-slate-600 dark:text-slate-300">Bạn chưa tham gia phòng nào.</p>}
      </section>
    </>}
  </div>;
}
