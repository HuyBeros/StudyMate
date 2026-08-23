import React, { useState, useEffect } from 'react';
import {
  Sparkles, HelpCircle, Network, FileText, UploadCloud,
  ArrowRight, Bot, Brain, BookOpen, Loader2, AlertCircle,
  ChevronRight, File, FileImage, FileCode2, X, Plus, Search
} from 'lucide-react';
import {
  getNotesApi,
  getSubjectsApi,
  getSubjectDocumentsApi,
  uploadDocumentApi,
} from '../services/api';

const FileIcon = ({ name }) => {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <FileImage className="w-5 h-5 text-purple-500" />;
  if (['pdf'].includes(ext)) return <FileText className="w-5 h-5 text-red-500" />;
  if (['ppt', 'pptx'].includes(ext)) return <FileCode2 className="w-5 h-5 text-orange-500" />;
  return <File className="w-5 h-5 text-blue-500" />;
};

export default function AiTutorView({
  onOpenQuizModal,
  onOpenMindmapModal,
  onOpenSummaryModal,
}) {
  const [subjects, setSubjects] = useState([]);
  const [notes, setNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadSubjectId, setUploadSubjectId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  // Search/filter
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('docs'); // 'notes' | 'docs'

  // Load data
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [subRes, noteRes] = await Promise.all([
        getSubjectsApi(),
        getNotesApi(),
      ]);

      const subList = subRes?.success ? subRes.data : [];
      setSubjects(subList);

      if (noteRes?.success) {
        setNotes(noteRes.data || []);
      }

      // Load docs from all subjects
      if (subList.length > 0) {
        const docResults = await Promise.all(subList.map(s => getSubjectDocumentsApi(s.id)));
        const allDocs = docResults.flatMap((r, i) =>
          (r?.success ? r.data : []).map(d => ({ ...d, subjectName: subList[i].name }))
        );
        setDocuments(allDocs);
      }
    } catch (e) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Upload handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setUploadFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) setUploadFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadSubjectId) {
      setUploadMsg('Vui lòng chọn môn học và file trước khi tải lên.');
      return;
    }
    setUploading(true);
    setUploadMsg('');
    try {
      const res = await uploadDocumentApi(uploadSubjectId, uploadFile);
      if (res?.success) {
        setUploadMsg('✅ Tải lên thành công! Tài liệu đã sẵn sàng để phân tích AI.');
        setUploadFile(null);
        setActiveTab('docs');
        await loadAll();
      } else {
        setUploadMsg(`❌ ${res?.message || 'Tải lên thất bại'}`);
      }
    } catch {
      setUploadMsg('❌ Lỗi kết nối khi tải file.');
    } finally {
      setUploading(false);
    }
  };

  // Filter items
  const filteredNotes = notes.filter(n =>
    (n.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDocs = documents.filter(d =>
    (d.fileName || d.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">

      {/* 1. Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="max-w-2xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold text-blue-100 border border-white/20">
            <Bot className="w-4 h-4" /> AI Tutor Workspace
          </div>
          <h2 className="font-['Be_Vietnam_Pro'] font-extrabold text-3xl sm:text-4xl leading-tight">
            Chọn tài liệu để AI phân tích
          </h2>
          <p className="text-blue-100 text-sm font-medium leading-relaxed">
            Chọn ghi chú hoặc tài liệu đã tải lên, rồi bấm vào công cụ AI để tạo Quiz, Mindmap, hoặc Tóm tắt ngay lập tức.
          </p>
        </div>
      </div>

      {/* 2. AI Tools Quick Access (no selection needed from here) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: <HelpCircle className="w-6 h-6" />, title: 'AI Quiz', desc: 'Tạo bộ câu hỏi trắc nghiệm từ tài liệu', color: 'blue', action: () => onOpenQuizModal(null, null) },
          { icon: <Network className="w-6 h-6" />, title: 'Mindmap AI', desc: 'Tự động vẽ sơ đồ tư duy từ nội dung', color: 'violet', action: () => onOpenMindmapModal(null, null) },
          { icon: <Brain className="w-6 h-6" />, title: 'Tóm tắt AI', desc: 'Tóm tắt thông minh các điểm cốt lõi', color: 'emerald', action: () => onOpenSummaryModal(null, null) },
        ].map(({ icon, title, desc, color, action }) => (
          <div
            key={title}
            onClick={action}
            className={`bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col justify-between space-y-6`}
          >
            <div className="space-y-3">
              <div className={`w-12 h-12 rounded-2xl bg-${color}-50 dark:bg-${color}-950/60 text-${color}-600 dark:text-${color}-400 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                {icon}
              </div>
              <div>
                <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mt-1">{desc}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-[#172136] group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Upload Section */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
        <h3 className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-500" />
          Tải lên tài liệu mới
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Subject selector */}
          <select
            value={uploadSubjectId}
            onChange={e => setUploadSubjectId(e.target.value)}
            className="col-span-1 bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 rounded-xl px-3 py-2.5 outline-none focus:border-blue-500 transition-all"
          >
            <option value="">-- Chọn môn học --</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Drop zone */}
          <div
            className={`col-span-2 border-2 border-dashed rounded-2xl p-4 flex items-center justify-between gap-3 transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-[#172136]/50'
            }`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {uploadFile ? (
              <div className="flex items-center gap-3 flex-1">
                <FileIcon name={uploadFile.name} />
                <span className="text-sm text-slate-700 dark:text-slate-200 truncate flex-1">{uploadFile.name}</span>
                <button onClick={() => setUploadFile(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <UploadCloud className="w-5 h-5" />
                <span>Kéo thả file vào đây, hoặc</span>
                <label className="text-blue-600 font-semibold cursor-pointer hover:underline">
                  chọn file
                  <input type="file" className="hidden" accept=".pdf,.docx,.pptx,.txt,.jpg,.jpeg,.png" onChange={handleFileInput} />
                </label>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadSubjectId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {uploading ? 'Đang tải...' : 'Tải lên'}
            </button>
          </div>
        </div>

        {uploadMsg && (
          <p className={`text-sm font-medium ${uploadMsg.startsWith('✅') ? 'text-emerald-600' : 'text-red-600'}`}>
            {uploadMsg}
          </p>
        )}
      </div>

      {/* 4. Notes & Docs List */}
      <div className="bg-white dark:bg-[#111C32] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs overflow-hidden">
        {/* Tabs + Search */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 flex-wrap">
          <div className="flex gap-1 bg-slate-100 dark:bg-[#172136] p-1 rounded-xl">
            {[
              { key: 'docs', label: `Tài liệu (${documents.length})`, icon: <FileText className="w-3.5 h-3.5" /> },
              { key: 'notes', label: `Ghi chú (${notes.length})`, icon: <BookOpen className="w-3.5 h-3.5" /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === key
                    ? 'bg-white dark:bg-[#111C32] text-blue-600 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 transition-all dark:text-slate-100 w-56"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-sm">Đang tải tài liệu...</p>
            </div>
          ) : error ? (
            <div className="py-10 flex items-center justify-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-5 h-5" /> {error}
            </div>
          ) : activeTab === 'docs' ? (
            filteredDocs.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <UploadCloud className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có tài liệu nào</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">Tải lên PDF, DOCX hoặc PPTX ở trên để bắt đầu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onQuiz={() => onOpenQuizModal(null, doc.id)}
                    onMindmap={() => onOpenMindmapModal(null, doc.id)}
                    onSummary={() => onOpenSummaryModal(null, doc.id)}
                  />
                ))}
              </div>
            )
          ) : (
            filteredNotes.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có ghi chú nào</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs">Tạo ghi chú trong phần Môn học để bắt đầu</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onQuiz={() => onOpenQuizModal(note.id, null)}
                    onMindmap={() => onOpenMindmapModal(note.id, null)}
                    onSummary={() => onOpenSummaryModal(note.id, null)}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ── Document Card ────────────────────────────────────────
function DocumentCard({ doc, onQuiz, onMindmap, onSummary }) {
  const name = doc.fileName || doc.title || 'Tài liệu';
  return (
    <div className="bg-slate-50 dark:bg-[#172136] rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-3 hover:border-blue-400 dark:hover:border-blue-600 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#111C32] border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
          <FileIcon name={name} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-white truncate" title={name}>{name}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.subjectName || ''}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <AiActionBtn label="Quiz" color="blue" onClick={onQuiz} />
        <AiActionBtn label="Mindmap" color="violet" onClick={onMindmap} />
        <AiActionBtn label="Tóm tắt" color="emerald" onClick={onSummary} />
      </div>
    </div>
  );
}

// ── Note Card ───────────────────────────────────────────
function NoteCard({ note, onQuiz, onMindmap, onSummary }) {
  const title = note.title || 'Ghi chú';
  const preview = (note.content || note.aiSummary || '').slice(0, 80);
  return (
    <div className="bg-slate-50 dark:bg-[#172136] rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800 space-y-3 hover:border-blue-400 dark:hover:border-blue-600 transition-all group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 dark:text-white truncate" title={title}>{title}</p>
          {preview && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{preview}...</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <AiActionBtn label="Quiz" color="blue" onClick={onQuiz} />
        <AiActionBtn label="Mindmap" color="violet" onClick={onMindmap} />
        <AiActionBtn label="Tóm tắt" color="emerald" onClick={onSummary} />
      </div>
    </div>
  );
}

// ── AI Action Button ─────────────────────────────────────
function AiActionBtn({ label, color, onClick }) {
  const colorMap = {
    blue:   'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white',
    violet: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white',
    emerald:'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${colorMap[color]}`}
    >
      <Sparkles className="w-3 h-3" />
      {label}
    </button>
  );
}
