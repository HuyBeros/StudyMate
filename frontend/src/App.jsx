import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProfileView from './components/ProfileView';
import SettingsView from './components/SettingsView';
import useStudyData from './hooks/useStudyData';
import { displayMetrics, zonedDate } from './lib/studyClient';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import StudyRoomsView from './components/StudyRoomsView';
import DailyAssistant from './components/DailyAssistant';
import SubjectsView from './components/SubjectsView';
import ScheduleView from './components/ScheduleView';
import CreateScheduleModal from './components/CreateScheduleModal';
import StatisticsView from './components/StatisticsView';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import SubjectDetailView from './components/SubjectDetailView';
import { 
  CreateSubjectModal,
  CreateTaskModal,
  ConfirmDeleteModal
} from './components/Modals';
import { 
  getStoredUser, 
  getTodayDashboardApi, 
  getSubjectsApi, 
  getScheduleApi, 
  getTasksApi, 
  getWeeklyStatsApi,
  deleteSubjectApi,
  deleteScheduleSlotApi,
  logoutApi,
  getAuthToken,
  setStoredUser
} from './services/api';
import * as api from './services/api';

const defaultTimerMinutes = { focus: 25, short: 5, long: 15 };
const emptyList = [];

function loadTimerMinutes() {
  try {
    const saved = JSON.parse(localStorage.getItem('studymate:timer-minutes'));
    return Object.fromEntries(Object.entries(defaultTimerMinutes).map(([key, fallback]) => {
      const value = saved?.[key];
      return [key, Number.isInteger(value) && value >= 1 && value <= (key === 'focus' ? 240 : 60) ? value : fallback];
    }));
  } catch { return defaultTimerMinutes; }
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(location.search).has('room') ? 'study-rooms' : 'dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('studymate:theme') === 'dark'; } catch { return false; }
  });
  const [timerMinutes, setTimerMinutes] = useState(loadTimerMinutes);
  const [user, setUser] = useState(() => getStoredUser() || null);
  const [assistantOwner, setAssistantOwner] = useState(null);
  const [scheduleDate, setScheduleDate] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const url = new URL(location.href);
    if (activeTab !== 'study-rooms' && url.searchParams.has('room')) {
      url.searchParams.delete('room');
      history.replaceState(history.state, '', url);
    }
  }, [activeTab]);

  // Toggle dark mode class on <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try { localStorage.setItem('studymate:theme', darkMode ? 'dark' : 'light'); } catch { /* Browser storage is optional. */ }
  }, [darkMode]);
  useEffect(() => {
    try { localStorage.setItem('studymate:timer-minutes', JSON.stringify(timerMinutes)); } catch { /* Browser storage is optional. */ }
  }, [timerMinutes]);

  // Real API state
  const [loadedSubjects, setSubjects] = useState(null);
  const [loadedTasks, setTasks] = useState(null);
  const subjects = loadedSubjects ?? emptyList;
  const tasks = loadedTasks ?? emptyList;
  const [schedule, setSchedule] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const accountId = user?.id;
  const study = useStudyData(user);
  const refreshStudy = study.refresh;
  const preferences = study.data ? { ...study.data.preferences, weeklyGoal: study.data.preferences.weeklyGoalSeconds / 3600 } : null;
  const [notice, setNotice] = useState('');
  const [dataError, setDataError] = useState('');
  const metrics = study.data ? displayMetrics(study.data.metrics) : null;
  const loadSequence = useRef(0);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      if (!user || !preferences?.reminderEnabled) return;
      const today = zonedDate(now, preferences.timezone);
      const time = new Intl.DateTimeFormat('en-GB', { timeZone: preferences.timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
      const key = `studymate:reminder-seen:${user.id}`;
      let seen; try { seen = localStorage.getItem(key); } catch { return; }
      if (seen !== today && time >= preferences.reminderTime) {
        setNotice('Đến giờ học. Chọn một nhiệm vụ để bắt đầu.');
        try { localStorage.setItem(key, today); } catch { /* Only an in-app reminder receipt. */ }
      }
    };
    check();
    const timer = setInterval(check, 30000);
    return () => clearInterval(timer);
  }, [user, preferences?.reminderEnabled, preferences?.reminderTime, preferences?.timezone]);

  useEffect(() => {
    const clear = () => {
      setUser(null); setTasks(null); setSubjects(null); setSchedule([]); setTodayData(null); setWeeklyStats(null);
      setAssistantOwner(null); setScheduleDate(null);
      loadSequence.current++; setLoading(false); setNotice(''); setIsAuthModalOpen(true);
    };
    window.addEventListener('auth:unauthorized', clear);
    return () => window.removeEventListener('auth:unauthorized', clear);
  }, []);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const openAuth = () => { setIsLinkingGoogle(false); setIsAuthModalOpen(true); };
  const openAssistant = () => user ? setAssistantOwner(user.id) : openAuth();
  const navigateFromAssistant = (target, date) => {
    setAssistantOwner(null);
    if (target === 'schedule') {
      setScheduleDate(date || null);
      setActiveTab('schedule');
    } else if (target === 'tasks') {
      setActiveTab('dashboard');
      requestAnimationFrame(() => document.getElementById('dashboard-tasks')?.scrollIntoView({ block: 'start' }));
    }
  };
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState(null);

  // Edit & Delete state
  const [subjectToEdit, setSubjectToEdit] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [scheduleSlotToEdit, setScheduleSlotToEdit] = useState(null);
  const [scheduleSlotToDelete, setScheduleSlotToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Fetch Real Backend Data
  const loadBaseData = useCallback(async () => {
    const sequence = ++loadSequence.current;
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    setDataError('');
    try {
      const [todayRes, subjectsRes, tasksRes, scheduleRes] = await Promise.all([
        getTodayDashboardApi(),
        getSubjectsApi(),
        getTasksApi(),
        getScheduleApi()
      ]);

      if (sequence !== loadSequence.current || token !== getAuthToken()) return;
      if ([todayRes, subjectsRes, tasksRes, scheduleRes].some(res => !res?.success)) setDataError('Không tải được một phần dữ liệu. Hãy thử tải lại.');

      if (todayRes && todayRes.success) {
        setTodayData(todayRes.data);
      }

      if (subjectsRes && subjectsRes.success && Array.isArray(subjectsRes.data)) {
        setSubjects(subjectsRes.data);
      }

      if (tasksRes && tasksRes.success && Array.isArray(tasksRes.data)) {
        setTasks(tasksRes.data);
      }

      if (scheduleRes && scheduleRes.success && Array.isArray(scheduleRes.data)) {
        setSchedule(scheduleRes.data);
      }

    } catch {
      if (sequence === loadSequence.current && token === getAuthToken()) {
        setDataError("Không tải được dữ liệu. Hãy kiểm tra kết nối và thử lại.");
      }
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, []);

  const loadData = useCallback(() => Promise.all([loadBaseData(), refreshStudy()]), [loadBaseData, refreshStudy]);

  useEffect(() => {
    if (accountId != null) loadBaseData();
  }, [accountId, loadBaseData]);

  useEffect(() => {
    const token = getAuthToken();
    if (activeTab !== 'statistics' || accountId == null || !token) return;
    let cancelled = false;
    getWeeklyStatsApi().then(result => {
      if (!cancelled && token === getAuthToken()) {
        setWeeklyStats(result.success ? result.data : { unavailable: true });
      }
    });
    return () => { cancelled = true; };
  }, [activeTab, accountId]);

  // Handlers for Subject Edit & Delete
  const handleOpenNewSubject = () => {
    setSubjectToEdit(null);
    setIsCreateSubjectOpen(true);
  };

  const handleEditSubject = (subject) => {
    setSubjectToEdit(subject);
    setIsCreateSubjectOpen(true);
  };

  const handleDeleteSubject = (subject) => {
    setSubjectToDelete(subject);
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await deleteSubjectApi(subjectToDelete.id);
      if (res && res.success) {
        setSubjectToDelete(null);
        loadData();
      }
    } catch (e) {
      console.error("Delete subject error:", e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const [scheduleDefaultDay, setScheduleDefaultDay] = useState(null);
  const [scheduleDefaultDate, setScheduleDefaultDate] = useState(null);

  // Handlers for Schedule Edit & Delete
  const handleOpenNewSchedule = (defaultDay = null, defaultDate = null) => {
    setScheduleSlotToEdit(null);
    setScheduleDefaultDay(defaultDay);
    setScheduleDefaultDate(defaultDate);
    setIsCreateScheduleOpen(true);
  };

  const handleEditSchedule = (slot) => {
    setScheduleSlotToEdit(slot);
    setIsCreateScheduleOpen(true);
  };

  const handleDeleteSchedule = (slot) => {
    setScheduleSlotToDelete(slot);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleSlotToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await deleteScheduleSlotApi(scheduleSlotToDelete.id);
      if (res && res.success) {
        setScheduleSlotToDelete(null);
        loadData();
      }
    } catch (e) {
      console.error("Delete schedule slot error:", e);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle Auth success
  const handleAuthSuccess = (userData) => {
    const newUserObj = {
      id: userData.userId,
      fullName: userData.fullName || userData.username || userData.email,
      email: userData.email,
      username: userData.username,
      avatar: userData.avatarUrl || "",
    };
    setUser(newUserObj);
    setStoredUser(newUserObj);
    if (user && newUserObj.id === accountId) {
      if (newUserObj.email === user.email) loadData();
      else loadBaseData();
    }
  };

  const handleLogout = async () => {
    loadSequence.current++;
    await logoutApi();
    setUser(null);
    setAssistantOwner(null); setScheduleDate(null);
    setTasks(null); setSubjects(null); setSchedule([]); setTodayData(null); setWeeklyStats(null); setLoading(false); setNotice('');
    setIsAuthModalOpen(true);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  };

  const mutateTask = async (operation, successMessage = '') => {
    if (!user) { setIsAuthModalOpen(true); return false; }
    try {
      const res = await operation();
      if (!res?.success) throw new Error(res?.message || 'Không thể lưu nhiệm vụ.');
      if (successMessage) setNotice(typeof successMessage === 'function' ? successMessage(res) : successMessage);
      await loadData();
      return true;
    } catch (error) { setDataError(error.message); return false; }
  };

  const handleTaskUpdate = (id, updates) => {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    return mutateTask(() => updates.status
      ? api.updateTaskStatusApi(id, updates.status)
      : api.request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ subjectId: task.subjectId, title: task.title, description: task.description, dueAt: task.dueAt, status: task.status, priority: task.priority, ...updates }) }),
      updates.status === 'DONE' ? 'Đã hoàn thành nhiệm vụ. Thêm một bước tiến hôm nay.' : '');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-['Inter',sans-serif] transition-colors">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main Body */}
      <div className="app-body md:pl-64 flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <Header 
          user={user} 
          onOpenAuth={openAuth}
          onOpenProfile={() => setActiveTab('profile')}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          subjects={subjects}
          tasks={tasks}
          schedule={schedule}
          todayData={todayData}
          onNavigate={tab => tab === 'tasks' ? navigateFromAssistant('tasks') : setActiveTab(tab)}
        />

        {/* Dynamic Views */}
        <main id="main-content" className="flex-1 pb-24 md:pb-8" aria-busy={loading}>
          {loading && <p role="status" className="mx-4 mt-4 text-sm text-slate-600 dark:text-slate-300">Đang cập nhật dữ liệu…</p>}
          {dataError && <div role="alert" className="mx-4 mt-4 p-4 rounded-xl bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200 flex flex-wrap gap-3 items-center">{dataError}<button className="font-bold underline" onClick={loadData}>Tải lại</button></div>}
          {study.error && <div role="alert" className="mx-4 mt-4 p-4 rounded-xl bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 flex flex-wrap gap-3 items-center">{study.error}<button disabled={study.busy} className="font-bold underline" onClick={study.refresh}>Tải lại số liệu</button></div>}
          {study.pending && <div role="status" className="mx-4 mt-4 p-4 rounded-xl bg-blue-50 text-blue-900 flex flex-wrap gap-3 items-center">Một thao tác phiên học đang chờ xác nhận. Số liệu hiển thị là lần xác nhận gần nhất.<button disabled={study.busy} className="font-bold underline" onClick={study.retry}>Thử gửi lại</button></div>}
          {user && !study.data && activeTab !== 'dashboard' && !study.error && <p role="status" className="mx-4 mt-4 text-sm text-slate-600 dark:text-slate-300">Đang tải số liệu học tập từ tài khoản…</p>}
          {notice && <div role="status" className="success-notice mx-4 mt-2 px-3 py-2 text-sm rounded-xl bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100 flex justify-between gap-4"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Đóng thông báo" className="font-bold px-2">×</button></div>}
          <div hidden={activeTab !== 'dashboard'}>
            <DashboardView key={user?.id ?? 'guest'}
              data={{ user, subjects, tasks }}
              subjectsReady={!user || loadedSubjects != null} tasksReady={!user || loadedTasks != null} dataError={dataError}
              metrics={metrics} preferences={preferences} study={study} onLogin={openAuth}
              timerMinutes={timerMinutes}
              onNavigate={setActiveTab}
              onOpenAssistant={openAssistant}
              onOpenNewSubject={() => user ? setIsCreateTaskOpen(true) : setIsAuthModalOpen(true)}
              onTaskAdd={task => mutateTask(() => api.createTaskApi(task))}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={id => mutateTask(() => api.deleteTaskApi(id))}
              onSessionComplete={session => setNotice(`Đã lưu ${Math.floor(session.focusSeconds / 60)} phút ${session.focusSeconds % 60} giây tập trung vào tài khoản.`)}
            />
          </div>

          {activeTab === 'subjects' && (
            <SubjectsView 
              subjects={subjects} tasks={tasks} schedule={schedule}
              onOpenNewSubject={handleOpenNewSubject}
              onEditSubject={handleEditSubject}
              onDeleteSubject={handleDeleteSubject}
              onReload={() => loadData()}
              onSubjectClick={(id) => {
                setActiveSubjectId(id);
                setActiveTab('subject-detail');
              }}
            />
          )}

          {activeTab === 'subject-detail' && activeSubjectId != null && (
            <SubjectDetailView
              key={activeSubjectId}
              subjectId={activeSubjectId}
              subjects={subjects}
              onBack={() => {
                setActiveTab('subjects');
                setActiveSubjectId(null);
              }}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView 
              key={scheduleDate || 'current'}
              initialDate={scheduleDate}
              schedule={schedule.map(s => ({
                id: s.id,
                subjectId: s.subjectId,
                subjectName: s.subjectName,
                date: s.date,          // ISO date string từ backend
                dayOfWeek: s.dayOfWeek,
                shift: s.shift,
                startTime: s.startTime,
                endTime: s.endTime,
                time: s.startTime && s.endTime ? `${s.startTime.slice(0, 5)} – ${s.endTime.slice(0, 5)}` : undefined,
                room: s.room,
                teacher: s.teacherName,
                teacherName: s.teacherName,
                teacherPhone: s.teacherPhone,
                department: s.department,
                isRecurring: s.isRecurring,
                isOnline: s.isOnline,
                periods: s.periods,
                iconType: s.iconType,
              }))}
              tasks={tasks.map(t => ({
                ...t,
                id: t.id,
                title: t.title,
                status: t.status,
                completed: t.status === 'DONE',
                subjectName: t.subjectName,
                priority: t.priority,
                priorityClass: t.priority === 'HIGH'
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-600'
                  : t.priority === 'MEDIUM'
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600',
                deadlineTime: t.deadlineTime,
              }))}
              onOpenNewSession={() => setIsCreateTaskOpen(true)}
              onOpenNewSchedule={handleOpenNewSchedule}
              onEditSchedule={handleEditSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onReload={() => loadData()}
            />
          )}



          {activeTab === 'statistics' && study.data && (
            <StatisticsView 
              stats={user ? weeklyStats : {}}
              metrics={metrics} preferences={preferences} filters={study.filters} onFilterChange={study.setFilters}
              subjects={subjects}
              tasks={tasks}
              schedule={schedule}
            />
          )}
          {activeTab === 'study-rooms' && <StudyRoomsView key={user?.id ?? 'guest'}
            user={user} onLogin={openAuth} activeSession={study.data?.activeSession} />}

          {activeTab === 'profile' && study.data && (
            <ProfileView key={user?.id ?? 'guest'} user={user} metrics={metrics} preferences={preferences}
              onSavePreferences={study.savePreferences} onEditProfile={() => setIsProfileModalOpen(true)}
              onLogin={openAuth} onOpenSettings={() => setActiveTab('settings')} />
          )}
          {activeTab === 'settings' && study.data && (
            <SettingsView key={user?.id ?? 'guest'} user={user} preferences={preferences}
              darkMode={darkMode} setDarkMode={setDarkMode} timerMinutes={timerMinutes} setTimerMinutes={setTimerMinutes}
              onSavePreferences={study.savePreferences} onLogin={openAuth} onLogout={handleLogout}
              onLinkGoogle={() => { setIsLinkingGoogle(true); setIsAuthModalOpen(true); }}
              onImportLegacy={study.importLegacy} importNotice={study.importNotice} busy={study.busy}
              onNavigate={target => target === 'tasks' ? navigateFromAssistant('tasks') : setActiveTab(target)} />
          )}
          {activeTab === 'help' && <div className="page-shell"><section className="surface p-6 space-y-4"><h2 className="text-2xl font-bold">Hướng dẫn học tập</h2><p>Thêm môn học, tạo nhiệm vụ rồi dùng đồng hồ Pomodoro để tập trung trong 25 phút.</p><p>Một ngày được tính vào chuỗi khi hoàn thành ít nhất một nhiệm vụ hoặc tập trung từ 10 phút. Thống kê không tính lịch học dự kiến là giờ đã học.</p><button className="primary-button" onClick={() => setActiveTab('dashboard')}>Về bảng điều khiển</button></section></div>}
        </main>
      </div>

      {/* Modals */}
      {user && assistantOwner === user.id && <DailyAssistant key={user.id}
        onClose={() => setAssistantOwner(null)} onNavigate={navigateFromAssistant} />}
      <AuthModal 
        isOpen={isAuthModalOpen}
        linkGoogle={isLinkingGoogle && !!user}
        onClose={() => { setIsAuthModalOpen(false); setIsLinkingGoogle(false); }}
        onSuccess={handleAuthSuccess}
      />
      {isProfileModalOpen && user && <ProfileModal
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />}
      <CreateSubjectModal 
        isOpen={isCreateSubjectOpen} 
        onClose={() => {
          setIsCreateSubjectOpen(false);
          setSubjectToEdit(null);
        }} 
        subjectToEdit={subjectToEdit}
        onAddSubject={() => loadData()}
      />
      <CreateTaskModal 
        isOpen={isCreateTaskOpen} 
        onClose={() => setIsCreateTaskOpen(false)} 
        subjects={subjects}
        onAddTask={() => loadData()}
      />
      {isCreateScheduleOpen && <CreateScheduleModal
        onClose={() => {
          setIsCreateScheduleOpen(false);
          setScheduleSlotToEdit(null);
          setScheduleDefaultDay(null);
          setScheduleDefaultDate(null);
        }} 
        subjects={subjects}
        slotToEdit={scheduleSlotToEdit}
        defaultDay={scheduleDefaultDay}
        defaultDate={scheduleDefaultDate}
        onAddSlot={() => loadData()}
      />}
      <ConfirmDeleteModal
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={confirmDeleteSubject}
        title="Xóa môn học"
        message={`Bạn có chắc chắn muốn xóa môn học "${subjectToDelete?.name || ''}" không? Hành động này cũng sẽ xóa toàn bộ lịch học, ghi chú và tài liệu liên quan.`}
        loading={deleteLoading}
      />
      <ConfirmDeleteModal
        isOpen={!!scheduleSlotToDelete}
        onClose={() => setScheduleSlotToDelete(null)}
        onConfirm={confirmDeleteSchedule}
        title="Xóa lịch học"
        message={`Bạn có chắc chắn muốn xóa lịch học môn "${scheduleSlotToDelete?.subjectName || ''}" không?`}
        loading={deleteLoading}
      />
    </div>
  );
}
