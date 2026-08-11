import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import SubjectsView from './components/SubjectsView';
import ScheduleView from './components/ScheduleView';
import AiTutorView from './components/AiTutorView';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import ImportScheduleModal from './components/ImportScheduleModal';
import { 
  QuizModal, 
  SummaryModal, 
  MindmapModal, 
  CreateSubjectModal,
  CreateTaskModal,
  CreateScheduleModal,
  ConfirmDeleteModal
} from './components/Modals';
import { 
  getStoredUser, 
  getTodayDashboardApi, 
  getSubjectsApi, 
  getScheduleApi, 
  getTasksApi, 
  deleteSubjectApi,
  deleteScheduleSlotApi,
  logoutApi,
  getAuthToken,
  setStoredUser
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(() => getStoredUser() || null);

  // Toggle dark mode class on <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Real API state
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isMindmapModalOpen, setIsMindmapModalOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [isImportScheduleOpen, setIsImportScheduleOpen] = useState(false);
  const [activeNoteOrDoc, setActiveNoteOrDoc] = useState(null);

  // Edit & Delete state
  const [subjectToEdit, setSubjectToEdit] = useState(null);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [scheduleSlotToEdit, setScheduleSlotToEdit] = useState(null);
  const [scheduleSlotToDelete, setScheduleSlotToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Fetch Real Backend Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, subjectsRes, tasksRes, scheduleRes] = await Promise.all([
        getTodayDashboardApi(),
        getSubjectsApi(),
        getTasksApi(),
        getScheduleApi()
      ]);

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

    } catch (e) {
      console.warn("[App] Error loading data from API:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getAuthToken()) {
      loadData();
    }
  }, [loadData]);

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

  // Handlers for Schedule Edit & Delete
  const handleOpenNewSchedule = () => {
    setScheduleSlotToEdit(null);
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
      fullName: userData.fullName || userData.email,
      email: userData.email,
      role: "Member Student",
      avatar: userData.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      streak: 1,
      dailyGoalPercent: 0,
      hoursStudied: 0,
      goalHours: 6.0,
    };
    setUser(newUserObj);
    setStoredUser(newUserObj);
    loadData();
  };

  const handleLogout = async () => {
    await logoutApi();
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser(updatedUser);
    setStoredUser(updatedUser);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-['Inter',sans-serif] transition-colors">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenNewSession={handleOpenNewSubject}
      />

      {/* Main Body */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <Header 
          user={user} 
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Dynamic Views */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView 
              data={{
                user: user,
                subjects: subjects,
                todayData: todayData,
                tasks: tasks.map(t => ({
                  id: t.id,
                  title: t.title,
                  subject: t.subjectName || "Chung",
                  subjectColor: t.subjectColor || "#2563EB",
                  completed: t.status === "DONE",
                  priority: t.priority === "HIGH" ? "ƯU TIÊN CAO" : t.priority === "MEDIUM" ? "TRUNG BÌNH" : "BÌNH THƯỜNG",
                  priorityClass: t.priority === "HIGH" 
                    ? "bg-red-50 text-red-600" 
                    : t.priority === "MEDIUM" 
                    ? "bg-amber-50 text-amber-600" 
                    : "bg-blue-50 text-blue-600"
                }))
              }}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewSubject={() => setIsCreateTaskOpen(true)}
              onOpenAiTutor={() => setActiveTab('ai-tutor')}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView 
              subjects={subjects} 
              onOpenNewSubject={handleOpenNewSubject}
              onEditSubject={handleEditSubject}
              onDeleteSubject={handleDeleteSubject}
              onReload={() => loadData()}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView 
              schedule={schedule.map(s => ({
                id: s.id,
                subjectId: s.subjectId,
                subjectName: s.subjectName,
                date: s.date,          // ISO date string từ backend
                dayOfWeek: s.dayOfWeek,
                shift: s.shift,
                startTime: s.startTime,
                endTime: s.endTime,
                time: s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : undefined,
                room: s.room,
                teacher: s.teacherName,
                teacherName: s.teacherName,
                isRecurring: s.isRecurring,
                iconType: s.iconType,
              }))}
              tasks={tasks.map(t => ({
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
              onOpenImportSchedule={() => setIsImportScheduleOpen(true)}
              onOpenAiTutor={() => setActiveTab('ai-tutor')}
              onReload={() => loadData()}
            />
          )}

          {activeTab === 'ai-tutor' && (
            <AiTutorView 
              history={[]} 
              onOpenQuizModal={() => setIsQuizModalOpen(true)}
              onOpenMindmapModal={() => setIsMindmapModalOpen(true)}
              onOpenSummaryModal={(title) => {
                setActiveNoteOrDoc(title);
                setIsSummaryModalOpen(true);
              }}
              onReload={() => loadData()}
            />
          )}

          {(activeTab === 'profile' || activeTab === 'settings' || activeTab === 'help') && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white dark:bg-[#111C32] rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <img 
                      src={user?.avatar || user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"} 
                      alt={user?.fullName || 'User'} 
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20"
                    />
                    <div>
                      <h2 className="font-['Be_Vietnam_Pro'] font-bold text-3xl text-slate-900 dark:text-white">{user?.fullName || user?.email || 'Người dùng'}</h2>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm">{user?.email || user?.role || 'Học viên'}</p>
                      <p className="text-slate-400 dark:text-slate-400 text-xs mt-1">Chuỗi học tập: {user?.streak || 0} ngày liên tiếp ⚡</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-md"
                  >
                    Chỉnh sửa hồ sơ
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdateUser={handleUpdateUser}
      />
      <QuizModal 
        isOpen={isQuizModalOpen} 
        onClose={() => setIsQuizModalOpen(false)} 
      />
      <SummaryModal 
        isOpen={isSummaryModalOpen} 
        onClose={() => setIsSummaryModalOpen(false)} 
        title={activeNoteOrDoc || "Tài liệu học tập.pdf"}
      />
      <MindmapModal 
        isOpen={isMindmapModalOpen} 
        onClose={() => setIsMindmapModalOpen(false)} 
      />
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
      <CreateScheduleModal 
        isOpen={isCreateScheduleOpen} 
        onClose={() => {
          setIsCreateScheduleOpen(false);
          setScheduleSlotToEdit(null);
        }} 
        subjects={subjects}
        slotToEdit={scheduleSlotToEdit}
        onAddSlot={() => loadData()}
      />
      <ImportScheduleModal
        isOpen={isImportScheduleOpen}
        onClose={() => setIsImportScheduleOpen(false)}
        subjects={subjects}
        onImportSuccess={() => loadData()}
      />
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
