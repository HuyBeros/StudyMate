import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import SubjectsView from './components/SubjectsView';
import ScheduleView from './components/ScheduleView';
import StatisticsView from './components/StatisticsView';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import ImportScheduleModal from './components/ImportScheduleModal';
import SubjectDetailView from './components/SubjectDetailView';
import AiGenerateModal from './components/ai/AiGenerateModal';
import AiLoadingState from './components/ai/AiLoadingState';
import AiPreviewPanel from './components/ai/AiPreviewPanel';
import { 
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
  getWeeklyStatsApi,
  deleteSubjectApi,
  deleteScheduleSlotApi,
  logoutApi,
  getAuthToken,
  setStoredUser
} from './services/api';
import * as api from './services/api';

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
  const [weeklyStats, setWeeklyStats] = useState(null);

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAiGenerateModalOpen, setIsAiGenerateModalOpen] = useState(false);
  const [aiGenerateType, setAiGenerateType] = useState(null);
  
  const [isAiLoadingOpen, setIsAiLoadingOpen] = useState(false);
  const [isAiPreviewOpen, setIsAiPreviewOpen] = useState(false);
  const [aiPreviewData, setAiPreviewData] = useState(null);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [isImportScheduleOpen, setIsImportScheduleOpen] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState(null);
  const [activeNoteOrDoc, setActiveNoteOrDoc] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [activeDocId, setActiveDocId] = useState(null);

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
      const [todayRes, subjectsRes, tasksRes, scheduleRes, statsRes] = await Promise.all([
        getTodayDashboardApi(),
        getSubjectsApi(),
        getTasksApi(),
        getScheduleApi(),
        getWeeklyStatsApi()
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

      if (statsRes && statsRes.success) {
        setWeeklyStats(statsRes.data);
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

  const [scheduleDefaultDay, setScheduleDefaultDay] = useState(null);

  // Handlers for Schedule Edit & Delete
  const handleOpenNewSchedule = (defaultDay = null) => {
    setScheduleSlotToEdit(null);
    setScheduleDefaultDay(defaultDay);
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
          subjects={subjects}
          tasks={tasks}
          schedule={schedule}
          todayData={todayData}
          onNavigate={(tab) => setActiveTab(tab)}
        />

        {/* Dynamic Views */}
        <main className="flex-1 pb-16">
          {activeTab === 'dashboard' && (
            <DashboardView 
              data={{
                user: user,
                subjects: subjects,
                todayData: todayData,
                schedule: schedule,
                tasks: tasks.map(t => ({
                  id: t.id,
                  title: t.title,
                  subject: t.subjectName || "Chung",
                  subjectColor: t.subjectColor || "#2563EB",
                  completed: t.status === "DONE",
                  status: t.status,
                  deadline: t.deadline,
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
              onSubjectClick={(id) => {
                setActiveSubjectId(id);
                setActiveTab('subject-detail');
              }}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView 
              subjects={subjects} 
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
              subjectId={activeSubjectId}
              subjects={subjects}
              onBack={() => {
                setActiveTab('subjects');
                setActiveSubjectId(null);
              }}
              onOpenQuizModal={(docId) => {
                setActiveNoteOrDoc('doc');
                setActiveDocId(docId);
                setAiGenerateType('quiz');
                setIsAiGenerateModalOpen(true);
              }}
              onOpenMindmapModal={(docId) => {
                setActiveNoteOrDoc('doc');
                setActiveDocId(docId);
                setAiGenerateType('mindmap');
                setIsAiGenerateModalOpen(true);
              }}
              onOpenSummaryModal={(docId) => {
                setActiveNoteOrDoc('doc');
                setActiveDocId(docId);
                setAiGenerateType('summary');
                setIsAiGenerateModalOpen(true);
              }}
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
              onReload={() => loadData()}
            />
          )}



          {activeTab === 'statistics' && (
            <StatisticsView 
              stats={weeklyStats}
              subjects={subjects}
              tasks={tasks}
              schedule={schedule}
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
      <AiGenerateModal 
        isOpen={isAiGenerateModalOpen}
        onClose={() => setIsAiGenerateModalOpen(false)}
        type={aiGenerateType}
        docId={activeDocId}
        onGenerate={async (type, docId, config) => {
          setIsAiGenerateModalOpen(false);
          setIsAiLoadingOpen(true);
          try {
            let res;
            if (activeNoteOrDoc === 'note') {
              if (type === 'quiz') res = await api.generateQuizFromNoteApi(activeNoteId, config);
              if (type === 'mindmap') res = await api.generateMindmapFromNoteApi(activeNoteId, config);
              if (type === 'summary') res = await api.summarizeNoteApi(activeNoteId, config);
            } else {
              if (type === 'quiz') res = await api.generateQuizFromDocApi(docId, config);
              if (type === 'mindmap') res = await api.generateMindmapFromDocApi(docId, config);
              if (type === 'summary') res = await api.summarizeDocumentApi(docId, config);
            }

            if (res && res.success) {
              setAiPreviewData(res.data);
              setIsAiPreviewOpen(true);
            } else {
              alert(res?.message || 'Có lỗi xảy ra khi tạo nội dung AI.');
            }
          } catch (e) {
            alert('Lỗi kết nối AI.');
          } finally {
            setIsAiLoadingOpen(false);
          }
        }}
      />

      <AiLoadingState 
        isVisible={isAiLoadingOpen}
        type={aiGenerateType}
      />

      <AiPreviewPanel 
        isOpen={isAiPreviewOpen}
        onClose={() => setIsAiPreviewOpen(false)}
        data={aiPreviewData}
        type={aiGenerateType}
        onSave={async (updatedData) => {
          try {
            const payload = {
              sourceType: activeNoteOrDoc === 'note' ? 'NOTE' : 'DOCUMENT',
              sourceId: activeNoteOrDoc === 'note' ? activeNoteId : activeDocId,
              title: updatedData.title,
            };
            if (aiGenerateType === 'quiz') payload.questions = updatedData.questions;
            if (aiGenerateType === 'mindmap') payload.structure = updatedData.structure;
            if (aiGenerateType === 'summary') payload.summary = updatedData.summary;

            const res = await api.saveAiOutputApi(aiGenerateType, payload);
            if (res?.success) {
              alert('Lưu thành công!');
              setIsAiPreviewOpen(false);
              // Force reload subjects or subject details if needed
            } else {
              alert('Lưu thất bại.');
            }
          } catch(e) {
            alert('Lỗi khi lưu.');
          }
        }}
        onRegenerate={() => {
          setIsAiPreviewOpen(false);
          setIsAiGenerateModalOpen(true);
        }}
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
          setScheduleDefaultDay(null);
        }} 
        subjects={subjects}
        slotToEdit={scheduleSlotToEdit}
        defaultDay={scheduleDefaultDay}
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
