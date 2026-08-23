import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, BookOpen, FileText, CheckSquare, BarChart2, Plus, 
  Download, Bot, Zap, MoreVertical, FileImage, FileCode2, File,
  Brain, FileSearch, HelpCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSubjectByIdApi, getSubjectDocumentsApi, getAiOutputsBySubjectApi } from '../services/api';

const FileIcon = ({ name }) => {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage className="w-5 h-5 text-purple-500" />;
  if (['pdf'].includes(ext)) return <FileText className="w-5 h-5 text-red-500" />;
  if (['ppt', 'pptx'].includes(ext)) return <FileCode2 className="w-5 h-5 text-orange-500" />;
  return <File className="w-5 h-5 text-blue-500" />;
};

export default function SubjectDetailView({ 
  subjectId, 
  subjects = [],
  onBack, 
  onOpenQuizModal,
  onOpenMindmapModal,
  onOpenSummaryModal
}) {
  const { t } = useTranslation('subjects');
  const initialSubject = subjects.find(s => String(s.id) === String(subjectId)) || null;
  const [subject, setSubject] = useState(initialSubject);
  const [documents, setDocuments] = useState([]);
  const [aiOutputs, setAiOutputs] = useState({ quizzes: [], mindmaps: [], summaries: [] });
  const [activeTab, setActiveTab] = useState('materials');
  const [loading, setLoading] = useState(true);

  // Dropdown states
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    loadSubjectData();

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [subjectId]);

  const loadSubjectData = async () => {
    setLoading(true);
    try {
      const subRes = await getSubjectByIdApi(subjectId).catch(() => null);
      if (subRes?.success && subRes.data) {
        setSubject(subRes.data);
      } else if (!subject) {
        const found = subjects.find(s => String(s.id) === String(subjectId));
        if (found) setSubject(found);
      }

      // Fetch Documents
      const docRes = await getSubjectDocumentsApi(subjectId).catch(() => null);
      if (docRes?.success && Array.isArray(docRes.data)) {
        setDocuments(docRes.data);
      } else {
        setDocuments([]);
      }

      // Fetch AI Outputs
      const aiRes = await getAiOutputsBySubjectApi(subjectId).catch(() => null);
      if (aiRes?.success && aiRes.data) {
        setAiOutputs({
          quizzes: Array.isArray(aiRes.data.quizzes) ? aiRes.data.quizzes : [],
          mindmaps: Array.isArray(aiRes.data.mindmaps) ? aiRes.data.mindmaps : [],
          summaries: Array.isArray(aiRes.data.summaries) ? aiRes.data.summaries : []
        });
      } else {
        setAiOutputs({ quizzes: [], mindmaps: [], summaries: [] });
      }

    } catch (err) {
      console.error("[SubjectDetailView] Error loading subject data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAiAction = (action, docId) => {
    setActiveMenuId(null);
    if (action === 'quiz') onOpenQuizModal(docId);
    if (action === 'mindmap') onOpenMindmapModal(docId);
    if (action === 'summary') onOpenSummaryModal(docId);
  };

  if (loading) return (
    <div className="p-8 flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
        </button>
        <div>
          <h2 className="text-3xl font-['Be_Vietnam_Pro'] font-bold text-slate-900 dark:text-white">
            {subject ? subject.name : 'Chi tiết Môn học'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {subject?.description || 'Quản lý tài liệu và ôn tập bằng AI'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', icon: BookOpen, label: 'Tổng quan' },
          { id: 'materials', icon: FileText, label: 'Tài liệu & Ghi chú' },
          { id: 'review', icon: CheckSquare, label: 'Ôn tập (AI)' },
          { id: 'stats', icon: BarChart2, label: 'Thống kê' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-4 border-b-2 transition-all font-['Inter'] font-semibold ${
                isActive 
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="bg-white dark:bg-[#111C32] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-xl font-bold mb-4">Thông tin môn học</h3>
            <p className="text-slate-600 dark:text-slate-400">
              {subject?.description || 'Chưa có mô tả.'}
            </p>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Tài liệu học tập</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors">
                <Plus className="w-4 h-4" />
                <span>Tải lên tài liệu</span>
              </button>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Chưa có tài liệu nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map(doc => (
                  <div key={doc.id} className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <FileIcon name={doc.fileName} />
                      </div>
                      
                      <div className="relative" ref={activeMenuId === doc.id ? menuRef : null}>
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <Zap className="w-4 h-4" />
                          <span className="text-xs font-bold">AI Actions</span>
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === doc.id && (
                          <div className="absolute right-0 top-10 w-48 bg-white dark:bg-[#1A233A] rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95">
                            <button 
                              onClick={() => handleAiAction('quiz', doc.id)}
                              className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <HelpCircle className="w-4 h-4 text-emerald-500" />
                              Tạo Trắc nghiệm
                            </button>
                            <button 
                              onClick={() => handleAiAction('mindmap', doc.id)}
                              className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Brain className="w-4 h-4 text-purple-500" />
                              Tạo Sơ đồ tư duy
                            </button>
                            <button 
                              onClick={() => handleAiAction('summary', doc.id)}
                              className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 mt-1 pt-2"
                            >
                              <FileSearch className="w-4 h-4 text-amber-500" />
                              Tóm tắt nội dung
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1" title={doc.fileName}>
                        {doc.fileName}
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>{new Date(doc.uploadDate).toLocaleDateString('vi-VN')}</span>
                        <span>•</span>
                        <span className="uppercase">{doc.fileType}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEW TAB (AI) */}
        {activeTab === 'review' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Thư viện ôn tập AI</h3>
            </div>

            {(aiOutputs?.quizzes?.length || 0) === 0 && (aiOutputs?.mindmaps?.length || 0) === 0 && (aiOutputs?.summaries?.length || 0) === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Bot className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Bạn chưa tạo nội dung ôn tập nào bằng AI.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quizzes */}
                {(aiOutputs?.quizzes || []).map(q => (
                  <div key={`q-${q.id}`} className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-5 border border-emerald-100 dark:border-emerald-900/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                        <HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold text-emerald-600 uppercase">Trắc nghiệm</span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{q.title}</h4>
                    <p className="text-sm text-slate-500">{q.questions?.length || 0} câu hỏi</p>
                  </div>
                ))}

                {/* Mindmaps */}
                {aiOutputs.mindmaps.map(m => (
                  <div key={`m-${m.id}`} className="bg-purple-50 dark:bg-purple-950/20 rounded-2xl p-5 border border-purple-100 dark:border-purple-900/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-xs font-bold text-purple-600 uppercase">Sơ đồ tư duy</span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{m.title}</h4>
                  </div>
                ))}

                {/* Summaries */}
                {aiOutputs.summaries.map(s => (
                  <div key={`s-${s.id}`} className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                        <FileSearch className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-xs font-bold text-amber-600 uppercase">Tóm tắt</span>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{s.title}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
