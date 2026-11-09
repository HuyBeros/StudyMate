import { useCallback, useEffect, useRef, useState } from 'react';
import { request, getAuthToken } from '../services/api';
import { accountKey, beginCommand, sendCommand, readJson, pendingKey, deviceId, legacyBatch, acknowledgeLegacy, emptyOverview } from '../lib/studyClient';

export default function useStudyData(user) {
  const account = accountKey(user);
  const currentAccount = useRef(account); currentAccount.current = account;
  const [stored, setStored] = useState(null);
  const [filters, setFilters] = useState({});
  const [error, setError] = useState('');
  const [importNotice, setImportNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const mutex = useRef(false), sequence = useRef(0);
  const valid = useCallback(token => account && currentAccount.current === account && getAuthToken() === token, [account]);
  const refresh = useCallback(async () => {
    const token = getAuthToken(), order = ++sequence.current;
    if (!account || !token) return;
    const query = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
    const result = await request(`/study/overview?${query}`);
    if (!valid(token) || order !== sequence.current) return;
    if (!result.success) { setError(result.message || 'Không thể tải số liệu học tập.'); return; }
    setStored({ account, data: { ...result.data, receivedAt: performance.now() } }); setError('');
    return result.data;
  }, [account, filters, valid]);

  useEffect(() => {
    setError(''); setImportNotice(''); setBusy(false); mutex.current = false;
    // Never expose the previous account's snapshot while a new request is pending.
    setStored(null);
    setFilters({});
  }, [account]);
  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 30000);
    const focus = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus);
    // Delayed requests are also guarded by their account/token and sequence at refresh().
    return () => { clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); };
  }, [refresh]);

  const importLegacy = useCallback(async () => {
    if (!account || mutex.current) return;
    if (!user?.email) {
      setImportNotice('Tài khoản này chưa có dữ liệu cũ trên trình duyệt.');
      return;
    }
    const token = getAuthToken(); mutex.current = true; setBusy(true);
    try {
      const snapshot = await refresh();
      if (!snapshot || !valid(token)) return;
      for (;;) {
        const batch = legacyBatch(localStorage, user.email, snapshot.preferences);
        if (!batch) { setImportNotice('Không có dữ liệu cũ trên trình duyệt này.'); break; }
        if (!batch.sessions.length && !batch.preferences) { setImportNotice(batch.invalid ? `Đã nhập dữ liệu hợp lệ. Còn ${batch.invalid} bản ghi cần kiểm tra trong bản lưu cũ.` : 'Dữ liệu cũ đã được nhập đầy đủ.'); break; }
        if (!valid(token)) return;
        const result = await request('/study/import/legacy', { method: 'POST', headers: { 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ deviceId: deviceId(localStorage), sessions: batch.sessions, preferences: batch.preferences }) });
        if (!valid(token)) return;
        if (!result.success) throw new Error(result.message || 'Chưa nhập được dữ liệu cũ. Bản gốc vẫn được giữ nguyên.');
        acknowledgeLegacy(localStorage, user.email, result.data);
      }
      await refresh();
    } catch (e) { if (valid(token)) setError(e.message); }
    finally { if (currentAccount.current === account) { mutex.current = false; setBusy(false); } }
  }, [account, refresh, user?.email, valid]);

  const mutateSession = useCallback(async (endpoint, payload, retry = false) => {
    if (!account || mutex.current) return;
    const token = getAuthToken(); mutex.current = true; setBusy(true); setError('');
    try {
      const command = retry ? readJson(localStorage, pendingKey(account)) : beginCommand(localStorage, account, endpoint, payload);
      const data = await sendCommand(localStorage, account, command, (path, body, key) => request(path, { method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body) }));
      if (!valid(token)) return;
      await refresh(); return data;
    } catch (e) { if (valid(token)) { setError(e.message); if (e.httpStatus === 409) await refresh(); } }
    finally { if (currentAccount.current === account) { mutex.current = false; setBusy(false); } }
  }, [account, refresh, valid]);

  const savePreferences = useCallback(async payload => {
    const token = getAuthToken();
    if (!account || !token) throw new Error('Hãy đăng nhập để lưu thông tin học tập.');
    const result = await request('/study/preferences', { method: 'PUT', body: JSON.stringify(payload) });
    if (!valid(token)) throw new Error('Tài khoản đã thay đổi. Hãy tải lại hồ sơ.');
    if (!result.success) { if (result.httpStatus === 409) await refresh(); throw new Error(result.message || 'Không thể lưu thông tin học tập.'); }
    await refresh(); return result.data;
  }, [account, refresh, valid]);

  const data = !account ? emptyOverview() : stored?.account === account ? stored.data : null;
  return { data, refresh, filters, setFilters, error, busy, importNotice, importLegacy, savePreferences,
    pending: account && !!readJson(localStorage, pendingKey(account)),
    retry: () => mutateSession(null, null, true),
    createSession: async payload => {
      try { return await mutateSession('/study/sessions', { ...payload, publicId: crypto.randomUUID(), deviceId: deviceId(localStorage) }); }
      catch { setError('Trình duyệt không cho phép lưu mã gửi lại. Hãy bật lưu trữ trước khi bắt đầu phiên.'); }
    },
    transitionSession: (id, action, baseVersion) => mutateSession(`/study/sessions/${id}/transitions`, { action, baseVersion }),
  };
}
