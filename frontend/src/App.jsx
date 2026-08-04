import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import SubjectsView from './components/SubjectsView';
import ScheduleView from './components/ScheduleView';
import AiTutorView from './components/AiTutorView';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { 
  QuizModal, 
  SummaryModal, 
  MindmapModal, 
  CreateSubjectModal 
} from './components/Modals';
import { 
  getStoredUser, 
  getTodayDashboardApi, 
  getSubjectsApi, 
  getScheduleApi, 
  getTasksApi, 
  logoutApi,
  getAuthToken,
  setStoredUser
} from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(() => getStoredUser() || {
    fullName: "Minh Anh",
    email: "user@example.com",
    role: "Premium Student",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
    streak: 14,
    dailyGoalPercent: 75,
    hoursStudied: 4.5,
    goalHours: 6.0,
  });

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
  const [activeNoteOrDoc, setActiveNoteOrDoc] = useState(null);

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
        onOpenNewSession={() => setIsCreateSubjectOpen(true)}
      />

      {/* Main Body */}
      <div className="pl-64 flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <Header 
          user={user || { fullName: "Đăng nhập", role: "Ghé thăm", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" }} 
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
                subjects: subjects.length > 0 ? subjects : [
                  { id: 1, name: "Toán giải tích", color: "#2563EB", progress: 80, totalDocuments: 12, totalNotes: 45, image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80" },
                  { id: 2, name: "Vật lý nguyên tử", color: "#0284C7", progress: 45, totalDocuments: 8, totalNotes: 22, image: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=400&q=80" },
                  { id: 3, name: "Tiếng Anh chuyên ngành", color: "#D97706", progress: 90, totalDocuments: 25, totalNotes: 115, image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80" }
                ],
                tasks: tasks.length > 0 ? tasks.map(t => ({
                  id: t.id,
                  title: t.title,
                  subject: t.subjectName || "Chung",
                  subjectColor: t.subjectColor || "#2563EB",
                  completed: t.status === "DONE",
                  priority: "BÌNH THƯỜNG",
                  priorityClass: "bg-blue-50 text-blue-600"
                })) : [
                  { id: 1, title: "Làm bài tập Vật lý chương 3", subject: "Vật Lý", subjectColor: "#0284C7", completed: true, priority: "LƯU TIÊN CAO", priorityClass: "bg-red-50 text-red-600" },
                  { id: 2, title: "Học 20 từ vựng Tiếng Anh mới", subject: "Tiếng Anh", subjectColor: "#D97706", completed: false, priority: "TRUNG BÌNH", priorityClass: "bg-amber-50 text-amber-600" },
                  { id: 3, title: "Ôn tập công thức đạo hàm", subject: "Toán học", subjectColor: "#2563EB", completed: false, priority: "BÌNH THƯỜNG", priorityClass: "bg-blue-50 text-blue-600" }
                ]
              }}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewSubject={() => setIsCreateSubjectOpen(true)}
              onOpenAiTutor={() => setActiveTab('ai-tutor')}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView 
              subjects={subjects.length > 0 ? subjects : [
                { id: 1, name: "Toán giải tích", color: "#2563EB", description: "Ôn tập về tích phân bội, phương trình vi phân.", progress: 80, totalDocuments: 12, totalNotes: 45, icon: "Sigma" },
                { id: 2, name: "Vật lý nguyên tử", color: "#0284C7", description: "Cơ học lượng tử cơ bản, cấu tạo hạt nhân.", progress: 45, totalDocuments: 8, totalNotes: 22, icon: "Atom" },
                { id: 3, name: "Tiếng Anh chuyên ngành", color: "#D97706", description: "Từ vựng chuyên môn kỹ thuật.", progress: 90, totalDocuments: 25, totalNotes: 115, icon: "Languages" }
              ]} 
              onOpenNewSubject={() => setIsCreateSubjectOpen(true)}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView 
              schedule={schedule.map(s => ({
                id: s.id,
                subjectName: s.subjectName,
                date: s.date,          // ISO date string từ backend
                time: s.startTime && s.endTime ? `${s.startTime} - ${s.endTime}` : undefined,
                startTime: s.startTime,
                endTime: s.endTime,
                room: s.room,
                teacher: s.teacherName,
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
              onOpenNewSession={() => setIsCreateSubjectOpen(true)}
              onOpenAiTutor={() => setActiveTab('ai-tutor')}
            />
          )}

          {activeTab === 'ai-tutor' && (
            <AiTutorView 
              history={[
                { id: 1, title: "Giải tích 1 - Bài tập chương 3.pdf", action: "Đã tóm tắt", timeAgo: "2 giờ trước" },
                { id: 2, title: "Kinh tế học vĩ mô - Ghi chú buổi 12.docx", action: "Đã vẽ Mindmap", timeAgo: "5 giờ trước" }
              ]} 
              onOpenQuizModal={() => setIsQuizModalOpen(true)}
              onOpenMindmapModal={() => setIsMindmapModalOpen(true)}
              onOpenSummaryModal={(title) => {
                setActiveNoteOrDoc(title);
                setIsSummaryModalOpen(true);
              }}
            />
          )}

          {(activeTab === 'profile' || activeTab === 'settings' || activeTab === 'help') && (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
              <div className="bg-white dark:bg-[#111C32] rounded-3xl p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <img 
                      src={user?.avatar || user?.avatarUrl || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"} 
                      alt={user?.fullName || 'User'} 
                      className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500/20"
                    />
                    <div>
                      <h2 className="font-['Be_Vietnam_Pro'] font-bold text-3xl text-slate-900 dark:text-white">{user?.fullName || 'Minh Anh'}</h2>
                      <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm">{user?.email || user?.role || 'Premium Student'}</p>
                      <p className="text-slate-400 dark:text-slate-400 text-xs mt-1">Học sinh tích cực với {user?.streak || 14} ngày streak liên tiếp ⚡</p>
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
        onClose={() => setIsCreateSubjectOpen(false)} 
        onAddSubject={() => loadData()}
      />
    </div>
  );
}
