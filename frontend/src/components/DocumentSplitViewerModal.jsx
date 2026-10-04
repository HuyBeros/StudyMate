import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Maximize2, Minimize2, Sparkles, BookOpen, FileText, 
  HelpCircle, Brain, MessageSquare, Send, CheckCircle2, Circle, 
  Copy, Loader2, ArrowRight, RefreshCw, AlertCircle, Eye, FileCode2, FileImage
} from 'lucide-react';
import { 
  getDocumentByIdApi, 
  summarizeDocumentApi, 
  generateQuizFromDocApi, 
  generateMindmapFromDocApi,
  attemptQuizApi, 
  askDocumentApi
} from '../services/api';

const FileIcon = ({ name }) => {
  const ext = (name || '').split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return <FileImage className="w-5 h-5 text-purple-500" />;
  if (['pdf'].includes(ext)) return <FileText className="w-5 h-5 text-red-500" />;
  if (['ppt', 'pptx'].includes(ext)) return <FileCode2 className="w-5 h-5 text-orange-500" />;
  return <FileText className="w-5 h-5 text-blue-500" />;
};

export default function DocumentSplitViewerModal({ isOpen, onClose, documentId }) {
  const [doc, setDoc] = useState(null);
  const [loadingDoc, setLoadingDoc] = useState(true);
  const [docViewMode, setDocViewMode] = useState('pdf'); // 'pdf' | 'text'
  const [isFullScreen, setIsFullScreen] = useState(false);

  // AI Panel State
  const [activeAiTab, setActiveAiTab] = useState('summary'); // 'summary' | 'quiz' | 'mindmap' | 'chat'
  
  // Summary Tab State
  const [summaryText, setSummaryText] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Quiz Tab State
  const [quizData, setQuizData] = useState(null);
  const [quizError, setQuizError] = useState('');
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // Mindmap Tab State
  const [mindmapData, setMindmapData] = useState(null);
  const [mindmapError, setMindmapError] = useState('');
  const [loadingMindmap, setLoadingMindmap] = useState(false);

  // Q&A Chat Tab State
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: 'Xin chào! Tôi là Trợ lý Gia sư AI. Bạn có thể hỏi bất kỳ câu hỏi nào về nội dung tài liệu này, tôi sẽ giải đáp chi tiết dựa trên bài học!'
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const chatEndRef = useRef(null);

  // Load document details
  useEffect(() => {
    if (isOpen && documentId) {
      loadDocumentDetails(documentId);
      // Reset AI tabs
      setSummaryText('');
      setSummaryError('');
      setQuizData(null);
      setQuizError('');
      setSelectedAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      setMindmapData(null);
      setMindmapError('');
      setChatMessages([
        {
          sender: 'ai',
          text: 'Xin chào! Tôi là Trợ lý Gia sư AI. Bạn có thể hỏi bất kỳ câu hỏi nào về nội dung tài liệu này, tôi sẽ giải đáp chi tiết dựa trên bài học!'
        }
      ]);
    }
  }, [isOpen, documentId]);

  const loadDocumentDetails = async (id) => {
    setLoadingDoc(true);
    try {
      const res = await getDocumentByIdApi(id);
      if (res && res.success && res.data) {
        setDoc(res.data);
        // If not PDF, default to extracted text view
        const isPdf = (res.data.fileName || '').toLowerCase().endsWith('.pdf');
        setDocViewMode(isPdf ? 'pdf' : 'text');
      }
    } catch (e) {
      console.error("Error loading document:", e);
    } finally {
      setLoadingDoc(false);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (activeAiTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeAiTab]);

  // Handle Summary Generation
  const handleGenerateSummary = async () => {
    if (!documentId) return;
    setLoadingSummary(true);
    setSummaryError('');
    try {
      const res = await summarizeDocumentApi(documentId);
      if (res && res.success && res.data != null) {
        // Backend trả ApiResponse<String> → res.data là string thuần
        // Job polling trả { success, data } → data có thể là string hoặc object
        const text = typeof res.data === 'string'
          ? res.data
          : (res.data?.summary || res.data?.summaryText || JSON.stringify(res.data));
        setSummaryText(text);
      } else {
        setSummaryError(res?.message || 'Không thể tạo tóm tắt lúc này. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('[Summary] Error:', err);
      setSummaryError('Lỗi kết nối đến dịch vụ AI. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Handle Quiz Generation
  const handleGenerateQuiz = async () => {
    if (!documentId) return;
    setLoadingQuiz(true);
    setQuizError('');
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    try {
      const res = await generateQuizFromDocApi(documentId, 5);
      if (res && res.success && res.data) {
        // Job polling returns parsed resultJson which is QuizResponse
        // Ensure questions array exists
        const quizResult = res.data;
        if (quizResult.questions && quizResult.questions.length > 0) {
          setQuizData(quizResult);
        } else {
          setQuizError('AI không thể tạo câu hỏi từ tài liệu này. Vui lòng thử lại.');
        }
      } else {
        setQuizError(res?.message || 'Không thể tạo bài trắc nghiệm lúc này.');
      }
    } catch (e) {
      console.error('[Quiz] Generation error:', e);
      setQuizError('Lỗi kết nối đến dịch vụ AI.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Handle Quiz Option Select
  const handleSelectQuizOption = (qId, optionKey) => {
    if (quizSubmitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionKey }));
  };

  // Handle Quiz Submission — correctOption is the backend field name (enum A/B/C/D)
  const handleSubmitQuiz = async () => {
    setQuizSubmitted(true);
    const questions = quizData?.questions || [];
    const correct = questions.filter(q => selectedAnswers[q.id] === q.correctOption).length;
    setQuizScore(correct);

    if (quizData?.id) {
      try {
        const payload = Object.entries(selectedAnswers).map(([qId, ans]) => ({
          questionId: Number(qId),
          selectedOption: ans
        }));
        await attemptQuizApi(quizData.id, payload);
      } catch (e) {
        console.warn('[Quiz] Attempt save error:', e);
      }
    }
  };

  // Handle Mindmap Generation
  const handleGenerateMindmap = async () => {
    if (!documentId) return;
    setLoadingMindmap(true);
    setMindmapError('');
    try {
      const res = await generateMindmapFromDocApi(documentId);
      if (res && res.success && res.data) {
        // Job polling returns MindmapResponse: { id, title, structure: { id, label, children: [...] } }
        setMindmapData(res.data);
      } else {
        setMindmapError(res?.message || 'Không thể tạo sơ đồ tư duy lúc này.');
      }
    } catch (e) {
      console.error('[Mindmap] Error:', e);
      setMindmapError('Lỗi kết nối đến dịch vụ AI.');
    } finally {
      setLoadingMindmap(false);
    }
  };

  // Recursive Mindmap Tree Renderer
  const renderMindmapNode = (node, depth = 0) => {
    if (!node) return null;
    const children = node.children || [];
    const isRoot = depth === 0;
    
    return (
      <div key={node.id || `node-${depth}`} className={isRoot ? '' : 'ml-4 mt-1.5'}>
        <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
          isRoot
            ? 'bg-purple-600 text-white shadow-md'
            : depth === 1
              ? 'bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 text-purple-900 dark:text-purple-200'
              : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
        }`}>
          {!isRoot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${depth === 1 ? 'bg-purple-500' : 'bg-slate-400'}`} />}
          <span>{node.label || node.title || ''}</span>
        </div>
        {children.length > 0 && (
          <div className={`border-l-2 ${isRoot ? 'border-purple-300 dark:border-purple-700' : 'border-slate-200 dark:border-slate-700'} ml-3 pl-1 space-y-0.5`}>
            {children.map((child, idx) => renderMindmapNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Simple markdown-like text renderer for AI responses
  const renderMarkdownText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Bold: **text**
      let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      const isBullet = /^\s*[-•]\s/.test(line);
      if (isBullet) {
        processed = processed.replace(/^\s*[-•]\s/, '');
        return <li key={i} className="ml-3 list-disc" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  // Handle Q&A Question Send
  const handleSendQuestion = async (e) => {
    e?.preventDefault();
    if (!inputQuestion.trim() || sendingQuestion || !documentId) return;

    const userText = inputQuestion.trim();
    setInputQuestion('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setSendingQuestion(true);

    try {
      const res = await askDocumentApi(documentId, userText);
      if (res && res.success && res.data) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: res.data }]);
      } else {
        setChatMessages(prev => [
          ...prev, 
          { sender: 'ai', text: `❌ ${res?.message || 'Không thể tạo câu trả lời lúc này.'}` }
        ]);
      }
    } catch (err) {
      setChatMessages(prev => [
        ...prev, 
        { sender: 'ai', text: '❌ Lỗi kết nối đến máy chủ AI.' }
      ]);
    } finally {
      setSendingQuestion(false);
    }
  };

  if (!isOpen) return null;

  const pdfUrl = doc?.fileUrl 
    ? (doc.fileUrl.startsWith('http') ? doc.fileUrl : `http://localhost:8080${doc.fileUrl}`)
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-[#0B132B] rounded-3xl w-full flex flex-col shadow-2xl border border-slate-200/80 dark:border-slate-800 transition-all duration-300 ${
        isFullScreen ? 'h-[98vh] max-w-[99vw]' : 'h-[92vh] max-w-7xl'
      }`}>
        
        {/* ── 1. Top Bar Header ────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-[#0E1738]/60 backdrop-blur-md rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl shrink-0">
              <FileIcon name={doc?.fileName} />
            </div>
            <div className="min-w-0">
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md" title={doc?.fileName}>
                {doc?.fileName || 'Chi tiết tài liệu'}
              </h3>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-2">
                <span>{doc?.fileType?.toUpperCase() || 'FILE'}</span>
                <span>•</span>
                <span>{doc?.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('vi-VN') : 'Hôm nay'}</span>
              </p>
            </div>
          </div>

          {/* Center: View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl">
            <button
              onClick={() => setDocViewMode('pdf')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                docViewMode === 'pdf'
                  ? 'bg-white dark:bg-[#1C274C] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem PDF gốc</span>
            </button>
            <button
              onClick={() => setDocViewMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                docViewMode === 'text'
                  ? 'bg-white dark:bg-[#1C274C] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Văn bản trích xuất</span>
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noreferrer"
                title="Tải về tài liệu"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              title={isFullScreen ? "Thu nhỏ" : "Phóng to toàn màn hình"}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-red-50 hover:text-red-500 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. Split-View Body ────────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800/80">
          
          {/* ── LEFT PANE: Document Reader (7 / 12 cols = ~58%) ────────── */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-100/50 dark:bg-[#070D1F]/50 relative">
            {loadingDoc ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-semibold text-slate-400">Đang tải tài liệu...</p>
              </div>
            ) : docViewMode === 'pdf' && pdfUrl ? (
              <div className="w-full h-full p-2">
                <iframe
                  src={pdfUrl}
                  title={doc?.fileName}
                  className="w-full h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-inner"
                />
              </div>
            ) : (
              /* Extracted Text View */
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-400 font-medium">
                  <span>📄 Chế độ đọc văn bản trích xuất</span>
                  <span>{doc?.extractedText?.length || 0} ký tự</span>
                </div>
                {doc?.extractedText ? (
                  <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-200 text-sm leading-relaxed font-['Inter'] whitespace-pre-wrap selection:bg-blue-100 dark:selection:bg-blue-900/60">
                    {doc.extractedText}
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-3">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-500">Chưa có văn bản trích xuất cho tài liệu này.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT PANE: Split-View AI Assistant (5 / 12 cols = ~42%) ── */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-white dark:bg-[#0B132B]">
            
            {/* AI Action Tabs */}
            <div className="flex items-center gap-1 p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0E1738]/50 overflow-x-auto">
              {[
                { id: 'summary', icon: Sparkles, label: 'Tóm tắt', color: 'text-amber-500' },
                { id: 'quiz', icon: HelpCircle, label: 'Làm Quiz', color: 'text-emerald-500' },
                { id: 'mindmap', icon: Brain, label: 'Sơ đồ tư duy', color: 'text-purple-500' },
                { id: 'chat', icon: MessageSquare, label: 'Hỏi đáp AI', color: 'text-blue-500' },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeAiTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveAiTab(tab.id);
                      if (tab.id === 'summary' && !summaryText && !loadingSummary) handleGenerateSummary();
                      if (tab.id === 'quiz' && !quizData && !loadingQuiz) handleGenerateQuiz();
                      if (tab.id === 'mindmap' && !mindmapData && !loadingMindmap) handleGenerateMindmap();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Panel Body */}
            <div className="flex-1 overflow-y-auto p-5 min-h-0">
              
              {/* TAB 1: SUMMARY */}
              {activeAiTab === 'summary' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tóm tắt nội dung chính</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGenerateSummary}
                        disabled={loadingSummary}
                        title="Tạo lại tóm tắt"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
                      >
                        <RefreshCw className={`w-4 h-4 ${loadingSummary ? 'animate-spin' : ''}`} />
                      </button>
                      {summaryText && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(summaryText);
                            setCopiedSummary(true);
                            setTimeout(() => setCopiedSummary(false), 2000);
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedSummary ? 'Đã chép!' : 'Sao chép'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {loadingSummary ? (
                    <div className="py-16 text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-slate-500">AI Gemini đang đọc và chắt lọc ý chính...</p>
                    </div>
                  ) : summaryError ? (
                    <div className="py-12 text-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                      <p className="text-xs text-red-500 font-medium">{summaryError}</p>
                      <button
                        onClick={handleGenerateSummary}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : summaryText ? (
                    <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-['Inter']">
                      {renderMarkdownText(summaryText)}
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <Sparkles className="w-10 h-10 text-amber-400 mx-auto" />
                      <p className="text-xs text-slate-400">Bấm nút bên dưới để tạo bản tóm tắt tự động bằng AI</p>
                      <button
                        onClick={handleGenerateSummary}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Tạo Tóm Tắt Ngay
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INTERACTIVE QUIZ (Vừa đọc vừa làm test) */}
              {activeAiTab === 'quiz' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {quizSubmitted ? `Kết quả: ${quizScore}/${quizData?.questions?.length || 0} điểm` : 'Kiểm tra độ hiểu bài'}
                    </span>
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={loadingQuiz}
                      title="Sinh bộ câu hỏi mới"
                      className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingQuiz ? 'animate-spin' : ''}`} />
                      <span>Đổi đề mới</span>
                    </button>
                  </div>

                  {loadingQuiz ? (
                    <div className="py-16 text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-slate-500">AI đang sinh bộ câu hỏi trắc nghiệm...</p>
                    </div>
                  ) : quizData?.questions?.length > 0 ? (
                    <div className="space-y-4">
                      {quizData.questions.map((q, idx) => {
                        const options = [
                          { key: 'A', text: q.optionA },
                          { key: 'B', text: q.optionB },
                          { key: 'C', text: q.optionC },
                          { key: 'D', text: q.optionD },
                        ].filter(o => o.text);
                        const correctKey = q.correctOption;

                        return (
                          <div key={q.id || idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#131E3D] border border-slate-100 dark:border-slate-800 space-y-3">
                            <p className="font-['Be_Vietnam_Pro'] font-bold text-xs text-slate-900 dark:text-white">
                              Câu {idx + 1}: {q.questionText || q.text}
                            </p>

                            <div className="space-y-1.5">
                              {options.map(({ key, text }) => {
                                const isSelected = selectedAnswers[q.id] === key;
                                const isCorrect = correctKey === key;
                                let btnClass = "bg-white dark:bg-[#1A2548] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-400";

                                if (quizSubmitted) {
                                  if (isCorrect) btnClass = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold";
                                  else if (isSelected && !isCorrect) btnClass = "bg-red-50 dark:bg-red-950/60 border-red-400 text-red-700 dark:text-red-300";
                                } else if (isSelected) {
                                  btnClass = "bg-blue-600 border-blue-600 text-white font-bold shadow-xs";
                                }

                                return (
                                  <button
                                    key={key}
                                    onClick={() => handleSelectQuizOption(q.id, key)}
                                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnClass}`}
                                  >
                                    <span><strong>{key}.</strong> {text}</span>
                                    {quizSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>

                            {quizSubmitted && q.explanation && (
                              <p className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed border border-blue-100 dark:border-blue-900/40">
                                💡 <strong>Giải thích:</strong> {q.explanation}
                              </p>
                            )}
                          </div>
                        );
                      })}

                      {!quizSubmitted && (
                        <button
                          onClick={handleSubmitQuiz}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                        >
                          Nộp bài & Chấm điểm tức thì
                        </button>
                      )}
                    </div>
                  ) : quizError ? (
                    <div className="py-12 text-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                      <p className="text-xs text-red-500 font-medium">{quizError}</p>
                      <button
                        onClick={handleGenerateQuiz}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <HelpCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                      <p className="text-xs text-slate-400">Kiểm tra khả năng ghi nhớ nội dung bài giảng vừa đọc</p>
                      <button
                        onClick={handleGenerateQuiz}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Tạo Bài Trắc Nghiệm (5 câu)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MINDMAP */}
              {activeAiTab === 'mindmap' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cây sơ đồ tư duy</span>
                    <button
                      onClick={handleGenerateMindmap}
                      disabled={loadingMindmap}
                      title="Vẽ lại sơ đồ"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingMindmap ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  {loadingMindmap ? (
                    <div className="py-16 text-center space-y-3">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                      <p className="text-xs font-semibold text-slate-500">AI đang liên kết các nhánh kiến thức...</p>
                    </div>
                  ) : mindmapData?.structure ? (
                    <div className="space-y-2">
                      {renderMindmapNode(mindmapData.structure)}
                    </div>
                  ) : mindmapError ? (
                    <div className="py-12 text-center space-y-3">
                      <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
                      <p className="text-xs text-red-500 font-medium">{mindmapError}</p>
                      <button
                        onClick={handleGenerateMindmap}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <Brain className="w-10 h-10 text-purple-400 mx-auto" />
                      <p className="text-xs text-slate-400">Phác họa trực quan cấu trúc chương mục và định lý</p>
                      <button
                        onClick={handleGenerateMindmap}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                      >
                        Vẽ Sơ Đồ Tư Duy
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CHAT WITH DOCUMENT (Q&A) */}
              {activeAiTab === 'chat' && (
                <div className="flex flex-col h-full space-y-3">
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[88%] p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white font-medium rounded-tr-xs shadow-xs'
                            : 'bg-slate-100 dark:bg-[#172136] text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/60 dark:border-slate-800'
                        }`}>
                          {msg.sender === 'ai' ? renderMarkdownText(msg.text) : msg.text}
                        </div>
                      </div>
                    ))}
                    {sendingQuestion && (
                      <div className="flex justify-start">
                        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-[#172136] text-xs text-slate-500 flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                          <span>AI đang đọc tài liệu và phân tích câu trả lời...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5">
                    {[
                      "Tóm tắt 3 công thức then chốt",
                      "Giải thích thuật ngữ chính",
                      "Định lý này ứng dụng ở đâu?"
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputQuestion(chip);
                        }}
                        className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] text-slate-500 transition-colors font-medium"
                      >
                        💡 {chip}
                      </button>
                    ))}
                  </div>

                  {/* Question Input Form */}
                  <form onSubmit={handleSendQuestion} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      value={inputQuestion}
                      onChange={(e) => setInputQuestion(e.target.value)}
                      placeholder="Hỏi bất kỳ điều gì về tài liệu..."
                      className="flex-1 bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!inputQuestion.trim() || sendingQuestion}
                      className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition-all shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
