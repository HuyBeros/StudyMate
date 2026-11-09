import { useState } from 'react';

export default function usePreferencesDraft(preferences, onSave) {
  const [draft, setDraft] = useState(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const current = draft || preferences;

  function edit(patch) {
    setDraft(old => ({ ...(old || preferences), ...patch }));
    setStatus('');
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true); setStatus('');
    const { school, major, timezone, weeklyGoalSeconds, reminderEnabled, reminderTime, version } = current;
    try {
      await onSave({ school, major, timezone, weeklyGoalSeconds, reminderEnabled, reminderTime, version });
      setDraft(null);
      setStatus('Đã lưu trên tài khoản.');
    } catch (error) { setStatus(error.message); }
    finally { setSaving(false); }
  }

  return { current, edit, save, saving, status, dirty: !!draft,
    conflict: !!draft && draft.version !== preferences.version,
    reset: () => { setDraft(null); setStatus(''); } };
}
