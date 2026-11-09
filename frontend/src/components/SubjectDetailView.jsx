import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, BookOpen, FileText, CheckSquare, BarChart2, Plus, 
  Download, Bot, Zap, MoreVertical, FileImage, FileCode2, File,
  Brain, FileSearch, HelpCircle, Eye, ArrowRight, Loader2, UploadCloud,
  Trash2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  getSubjectByIdApi, 
  getSubjectDocumentsApi, 
  getAiOutputsBySubjectApi,
  getNotesApi,
  uploadDocumentApi,
  deleteDocumentApi 
} from '../services/api';
import DocumentSplitViewerModal from './DocumentSplitViewerModal';
import UploadDocumentModal from './UploadDocumentModal';

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
  onBack
}) {
  const { t } = useTranslation('subjects');
  const initialSubject = subjects.find(s => String(s.id) === String(subjectId)) || null;
  const [subject, setSubject] = useState(initialSubject);
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [reviewError, setReviewError] = useState('');
  const [aiOutputs, setAiOutputs] = useState({ quizzes: [], mindmaps: [], summaries: [] });
  const [activeTab, setActiveTab] = useState('materials');
  const [loading, setLoading] = useState(true);
  const [selectedDocForViewer, setSelectedDocForViewer] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // File Upload State & Ref
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

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

      const [aiRes, noteRes] = await Promise.all([
        getAiOutputsBySubjectApi(subjectId), getNotesApi(subjectId)
      ]);
      setNotes(noteRes?.success && Array.isArray(noteRes.data) ? noteRes.data : []);
      setReviewError(aiRes?.success ? '' : 'Chưa tải được thư viện ôn tập.');
      setAiOutputs({
        quizzes: Array.isArray(aiRes?.data?.quizzes) ? aiRes.data.quizzes : [],
        mindmaps: Array.isArray(aiRes?.data?.mindmaps) ? aiRes.data.mindmaps : [],
        summaries: Array.isArray(aiRes?.data?.summaries) ? aiRes.data.summaries : [],
      });

    } catch (err) {
      console.error("[SubjectDetailView] Error loading subject data:", err);
    } finally {
      setLoading(false);
    }
  };

  function openDocument(documentId, tab = 'summary') {
    setActiveMenuId(null);
    setSelectedDocForViewer({ documentId, tab });
  }

  function addSavedOutput(type, saved) {
    const collection = { quiz: 'quizzes', mindmap: 'mindmaps', summary: 'summaries' }[type];
    setAiOutputs(current => ({
      ...current,
      [collection]: [saved, ...current[collection].filter(item => item.id !== saved.id)],
    }));
  }

  function sourceFor(item) {
    return item.sourceType === 'NOTE'
      ? notes.find(note => String(note.id) === String(item.sourceId))
      : documents.find(doc => String(doc.id) === String(item.sourceId));
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadSuccess('');
    setUploading(true);

    try {
      const res = await uploadDocumentApi(subjectId, file);
      if (res?.success) {
        setUploadSuccess(`Tải lên thành công: ${file.name}`);
        // Refresh documents list
        const docRes = await getSubjectDocumentsApi(subjectId).catch(() => null);
        if (docRes?.success && Array.isArray(docRes.data)) {
          setDocuments(docRes.data);
        }
      } else {
        setUploadError(res?.message || 'Tải tài liệu lên thất bại. Vui lòng thử lại!');
      }
    } catch (err) {
      console.error("[SubjectDetailView] Upload error:", err);
      setUploadError(err.response?.data?.message || err.message || 'Lỗi kết nối khi tải lên tài liệu.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteDoc = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc chắn muốn xóa tài liệu này không?')) return;
    setActiveMenuId(null);

    try {
      const res = await deleteDocumentApi(docId);
      if (res?.success) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
      } else {
        alert(res?.message || 'Xóa tài liệu thất bại');
      }
    } catch (err) {
      console.error("[SubjectDetailView] Delete error:", err);
      alert('Lỗi kết nối khi xóa tài liệu.');
    }
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
          <h2 className="select-none text-3xl font-['Be_Vietnam_Pro'] font-bold text-slate-900 dark:text-white">
            {subject ? subject.name : 'Chi tiết Môn học'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {subject?.description || 'Quản lý tài liệu và ôn tập bằng AI'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-5 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', icon: BookOpen, label: 'Tổng quan' },
          { id: 'materials', icon: FileText, label: 'Tài liệu & Ghi chú' },
          { id: 'review', icon: CheckSquare, label: 'Ôn tập' },
          { id: 'stats', icon: BarChart2, label: 'Thống kê' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 pb-4 border-b-2 transition-all font-['Inter'] font-semibold ${
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
            {/* Upload status feedback */}
            {uploadSuccess && (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <span className="font-medium">{uploadSuccess}</span>
                </div>
                <button onClick={() => setUploadSuccess('')} className="text-emerald-600 hover:text-emerald-800 font-bold ml-2">✕</button>
              </div>
            )}

            {uploadError && (
              <div className="flex items-center justify-between p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl text-red-800 dark:text-red-300 text-sm animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                  <span className="font-medium">{uploadError}</span>
                </div>
                <button onClick={() => setUploadError('')} className="text-red-600 hover:text-red-800 font-bold ml-2">✕</button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Tài liệu học tập</h3>

              <button 
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Tải lên tài liệu</span>
              </button>
            </div>
            
            {documents.length === 0 ? (
              <div 
                onClick={() => setIsUploadModalOpen(true)}
                className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-all group"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-semibold mb-1">Chưa có tài liệu nào</p>
                <p className="text-xs text-slate-500 font-medium">Bấm vào đây hoặc nhấn "Tải lên tài liệu" (Hỗ trợ PDF, DOCX, PPTX)</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map(doc => (
                  <div 
                    key={doc.id} 
                    className="bg-white dark:bg-[#111C32] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                          <FileIcon name={doc.fileName} />
                        </div>
                        
                        <div className="relative" ref={activeMenuId === doc.id ? menuRef : null}>
                          <button 
                            aria-expanded={activeMenuId === doc.id}
                            aria-label={`Tạo nội dung AI từ ${doc.fileName}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === doc.id ? null : doc.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors"
                          >
                            <Zap className="w-4 h-4" />
                            <span className="text-xs font-semibold">Tạo nội dung AI</span>
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === doc.id && (
                            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-[#1A233A] rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDocument(doc.id, 'quiz');
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                              >
                                <HelpCircle className="w-4 h-4 text-emerald-500" />
                                Tạo Trắc nghiệm
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDocument(doc.id, 'mindmap');
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                              >
                                <Brain className="w-4 h-4 text-purple-500" />
                                Tạo Sơ đồ tư duy
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDocument(doc.id, 'summary');
                                }}
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                              >
                                <FileSearch className="w-4 h-4 text-amber-500" />
                                Tóm tắt nội dung
                              </button>
                              <button 
                                onClick={(e) => handleDeleteDoc(e, doc.id)}
                                className="w-full px-4 py-2 text-left text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 mt-1 pt-2"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                                Xóa tài liệu
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="min-h-12 line-clamp-2 break-words font-semibold leading-6 text-slate-800 dark:text-slate-200" title={doc.fileName}>
                          {doc.fileName}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2">
                          {doc.uploadDate && <><span>{new Date(doc.uploadDate).toLocaleDateString('vi-VN')}</span><span>•</span></>}
                          <span className="uppercase">{doc.fileType}</span>
                        </p>
                      </div>
                    </div>

                    <button type="button" onClick={() => openDocument(doc.id)}
                      aria-label={`Mở tài liệu ${doc.fileName}`}
                      className="primary-button mt-4 w-full justify-center">
                      <Eye className="w-4 h-4" />Mở tài liệu
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'review' && (
          <section className="space-y-5">
            <div>
              <h3 className="text-lg font-bold">Thư viện ôn tập</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Mở lại trắc nghiệm, tóm tắt và sơ đồ tư duy đã lưu của môn này.</p>
            </div>
            {reviewError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{reviewError} <button className="underline" onClick={loadSubjectData}>Thử lại</button></p>}
            {!reviewError && Object.values(aiOutputs).every(items => items.length === 0) && (
              <div className="surface space-y-3 p-6 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">Chưa có nội dung đã lưu. Hãy mở tài liệu, tạo nội dung rồi chọn Lưu vào Ôn tập.</p>
                <button className="secondary-button" onClick={() => setActiveTab('materials')}>Đến tài liệu học tập</button>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[
                ['quiz', 'Trắc nghiệm', 'Làm bài', HelpCircle, aiOutputs.quizzes],
                ['summary', 'Tóm tắt', 'Đọc tóm tắt', FileSearch, aiOutputs.summaries],
                ['mindmap', 'Sơ đồ tư duy', 'Xem sơ đồ', Brain, aiOutputs.mindmaps],
              ].flatMap(([type, label, action, Icon, items]) => items.map(item => {
                const source = sourceFor(item);
                const isNote = item.sourceType === 'NOTE';
                return <article key={type + ':' + item.id} className="surface flex flex-col gap-3 p-5">
                  <p className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300"><Icon className="h-4 w-4" />{label}</p>
                  <h4 className="break-words font-bold">{item.title || label}</h4>
                  <p className="flex-1 break-words text-sm text-slate-600 dark:text-slate-300">
                    {isNote ? 'Ghi chú' : 'Tài liệu'} · {source?.title || source?.fileName || 'Nguồn không còn trong danh sách'}
                    {type === 'quiz' && <span className="mt-1 block">{item.totalQuestions ?? item.questions?.length ?? 0} câu hỏi</span>}
                  </p>
                  <button className="secondary-button self-start" onClick={() => setSelectedDocForViewer({
                    documentId: isNote ? null : item.sourceId,
                    note: isNote ? source : null,
                    tab: type,
                    savedItem: item,
                  })}>{action}</button>
                </article>;
              }))}
            </div>
          </section>
        )}
      </div>

      {selectedDocForViewer && <DocumentSplitViewerModal
        isOpen
        onClose={() => setSelectedDocForViewer(null)}
        documentId={selectedDocForViewer.documentId}
        initialTab={selectedDocForViewer.tab}
        savedItem={selectedDocForViewer.savedItem}
        note={selectedDocForViewer.note}
        onSaved={addSavedOutput}
        onOpenReview={() => { setSelectedDocForViewer(null); setActiveTab('review'); }}
      />}

      {/* Upload Document Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        subjectId={subjectId}
        subjectName={subject?.name || ''}
        onUploadSuccess={(newDoc) => {
          if (newDoc) {
            setDocuments(prev => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
          }
          loadSubjectData();
        }}
      />
    </div>
  );
}
