import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, AlertCircle, Copy, Sparkles, Brain, Plus, Clock, BookOpen, User, MapPin, Loader2, Award, Trash2, Edit3
} from 'lucide-react';
import { 
  createSubjectApi, 
  updateSubjectApi,
  createTaskApi, 
  generateQuizFromNoteApi, 
  generateQuizFromDocApi, 
  attemptQuizApi, 
  summarizeNoteApi, 
  summarizeDocumentApi, 
  generateMindmapFromNoteApi, 
  generateMindmapFromDocApi
} from '../services/api';

// ── 1. QUIZ MODAL (Real AI Quiz Generation & Interactive Attempt) ─────────────
export function QuizModal({ isOpen, onClose, noteId, docId }) {
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes default

  useEffect(() => {
    if (isOpen) {
      setSelectedAnswers({});
      setSubmitted(false);
      setAttemptResult(null);
      setError('');
      setTimeLeft(300);
      fetchQuiz();
    }
  }, [isOpen, noteId, docId]);

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || submitted || loading || !quizData) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitAttempt();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, submitted, loading, quizData]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      let res;
      if (noteId) {
        res = await generateQuizFromNoteApi(noteId, 5);
      } else if (docId) {
        res = await generateQuizFromDocApi(docId, 5);
      } else {
        // Sample quiz placeholder structure for generic preview
        setQuizData({
          id: 999,
          title: "AI Quiz: Giải tích & Ứng dụng",
          questions: [
            {
              id: 1,
              questionText: "Trong bài toán Tích phân bội 2, công thức chuyển sang tọa độ cực là gì?",
              optionA: "dx dy = r dr dθ",
              optionB: "dx dy = dr dθ",
              optionC: "dx dy = r^2 dr dθ",
              optionD: "dx dy = 2r dr dθ",
              correctAnswer: "A",
              explanation: "Trong tọa độ cực, Jacobi J = r, nên vi phân diện tích dx dy = r dr dθ."
            },
            {
              id: 2,
              questionText: "Điều kiện cần để chuỗi số ∑ a_n hội tụ là gì?",
              optionA: "lim (n->∞) a_n = 1",
              optionB: "lim (n->∞) a_n = 0",
              optionC: "lim (n->∞) a_n = ∞",
              optionD: "a_n > 0 với mọi n",
              correctAnswer: "B",
              explanation: "Nếu chuỗi ∑ a_n hội tụ thì giới hạn của số hạng tổng quát a_n khi n tiến ra vô cùng phải bằng 0."
            }
          ]
        });
        setLoading(false);
        return;
      }

      if (res && res.success && res.data) {
        setQuizData(res.data);
      } else {
        setError(res?.message || 'Không thể tạo Quiz AI lúc này.');
      }
    } catch (e) {
      setError('Lỗi khi tạo bộ câu hỏi AI.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSelect = (questionIndex, optionKey) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: optionKey }));
  };

  const handleSubmitAttempt = async () => {
    setSubmitted(true);
    if (quizData?.id && quizData.id !== 999) {
      try {
        const answersArray = questions
          .map((question, index) => ({ questionId: question.id, selectedOption: selectedAnswers[index] }))
          .filter(answer => answer.questionId != null && answer.selectedOption);
        const res = await attemptQuizApi(quizData.id, answersArray);
        if (res && res.success) {
          setAttemptResult(res.data);
        }
      } catch (e) {
        console.error("Attempt error:", e);
      }
    }
  };

  const questions = quizData?.questions || [];
  const correctCount = questions.filter((question, index) =>
    selectedAnswers[index] && selectedAnswers[index] === (question.correctOption || question.correctAnswer || question.correct)
  ).length;
  const qMin = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const qSec = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
        
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
                {quizData?.title || 'AI Quiz: Trắc nghiệm kiến thức'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {questions.length} câu hỏi • Tự động chấm điểm bởi AI Gemini 2.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!submitted && !loading && questions.length > 0 && (
              <div 
                title="Thời gian làm bài còn lại"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border transition-colors ${
                  timeLeft <= 60 
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 animate-pulse' 
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{qMin}:{qSec}</span>
              </div>
            )}
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              AI Gemini đang phân tích nội dung và tạo bộ câu hỏi...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const options = [
                { key: 'A', text: q.optionA },
                { key: 'B', text: q.optionB },
                { key: 'C', text: q.optionC },
                { key: 'D', text: q.optionD },
              ].filter(o => o.text);

              const correctKey = q.correctOption || q.correctAnswer || q.correct;

              return (
                <div key={idx} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#172136] border border-slate-200/60 dark:border-slate-800">
                  <h4 className="font-['Be_Vietnam_Pro'] font-bold text-sm text-slate-900 dark:text-white">
                    Câu {idx + 1}: {q.questionText || q.text}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {options.map(({ key, text }) => {
                      const isSelected = selectedAnswers[idx] === key;
                      const isCorrect = correctKey === key;

                      let btnStyle = "bg-white dark:bg-[#111C32] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800";
                      if (submitted) {
                        if (isCorrect) btnStyle = "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-800 dark:text-emerald-300 font-bold";
                        else if (isSelected && !isCorrect) btnStyle = "bg-red-50 dark:bg-red-950/50 border-red-300 text-red-700 dark:text-red-300";
                      } else if (isSelected) {
                        btnStyle = "bg-blue-600 border-blue-600 text-white font-bold shadow-sm";
                      }

                      return (
                        <button
                          key={key}
                          onClick={() => handleSelect(idx, key)}
                          aria-pressed={isSelected}
                          className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                        >
                          <span><strong>{key}.</strong> {text}</span>
                          {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && q.explanation && (
                    <div className="p-3 bg-blue-50/80 dark:bg-blue-950/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed border border-blue-100 dark:border-blue-900/50">
                      <strong>💡 Giải thích AI:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {submitted ? (
            <div className="flex items-center gap-3">
              <span className="font-['Manrope'] font-extrabold text-2xl text-blue-600 dark:text-blue-400">
                {attemptResult?.score ?? correctCount} / {questions.length} điểm
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ({questions.length > 0 ? Math.round(((attemptResult?.score ?? correctCount) / questions.length) * 100) : 0}% chính xác)
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Vui lòng chọn đáp án trước khi nộp bài.
            </span>
          )}

          {!submitted ? (
            <button
              onClick={handleSubmitAttempt}
              disabled={loading || questions.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md"
            >
              Nộp bài & Chấm điểm
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-sm shadow-md"
            >
              Hoàn thành
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

// ── 2. SUMMARY MODAL (AI Summary Generation) ──────────────────────────────────
export function SummaryModal({ isOpen, onClose, title = "Tài liệu học tập.pdf", noteId, docId }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (noteId) {
        fetchNoteSummary();
      } else if (docId) {
        fetchDocSummary();
      } else {
        setSummaryText(`
# 📌 Tóm tắt bài giảng: ${title}

## 1. Các khái niệm cốt lõi:
- Nắm vững định lý chính và phương pháp giải bài tập.
- Đọc kỹ phần ví dụ minh họa trước khi bắt đầu bài thực hành.

## 2. Gợi ý từ AI Tutor:
- Hãy làm thử bộ AI Quiz tương ứng để kiểm tra độ hiểu bài!
        `);
      }
    }
  }, [isOpen, noteId, docId, title]);

  const fetchNoteSummary = async () => {
    setLoading(true);
    setSummaryText('');
    try {
      const res = await summarizeNoteApi(noteId);
      if (res && res.success && res.data) {
        // res.data = { summary: '...' } from async job polling
        const text = res.data.summary || res.data.summaryText || (typeof res.data === 'string' ? res.data : '');
        setSummaryText(text || 'Không có nội dung tóm tắt.');
      } else {
        setSummaryText(`❌ ${res?.message || 'Không thể tạo tóm tắt từ AI.'}`);
      }
    } catch (e) {
      setSummaryText('Không thể lấy tóm tắt từ AI.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocSummary = async () => {
    setLoading(true);
    setSummaryText('');
    try {
      const res = await summarizeDocumentApi(docId);
      if (res && res.success && res.data) {
        const text = res.data.summary || res.data.summaryText || (typeof res.data === 'string' ? res.data : '');
        setSummaryText(text || 'Không có nội dung tóm tắt.');
      } else {
        setSummaryText(`❌ ${res?.message || 'Không thể tạo tóm tắt từ AI.'}`);
      }
    } catch (e) {
      setSummaryText('Không thể lấy tóm tắt từ AI.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
                AI Summary: {title}
              </h3>
              <p className="text-xs text-slate-400 font-medium">Tóm tắt ý chính tự động bởi Gemini 2.0 Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              AI Gemini đang tóm tắt tài liệu...
            </p>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#172136] border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed space-y-3 font-mono whitespace-pre-wrap">
            {summaryText}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#172136] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? "Đã sao chép!" : "Sao chép tóm tắt"}</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 3. MINDMAP MODAL (AI Mindmap Generation) ──────────────────────────────────
export function MindmapModal({ isOpen, onClose, noteId, docId }) {
  const [loading, setLoading] = useState(false);
  const [mindmapData, setMindmapData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (noteId) {
        fetchNoteMindmap();
      } else if (docId) {
        fetchDocMindmap();
      } else {
        setMindmapData({
          title: "Sơ đồ tư duy kiến thức",
          nodes: [
            { label: "1. Khái niệm chính", subnodes: ["Khái niệm cơ bản", "Ví dụ minh họa"] },
            { label: "2. Định lý & Vi phân", subnodes: ["Công thức đạo hàm", "Ứng dụng thực tế"] },
            { label: "3. Tóm tắt tổng quan", subnodes: ["Bài tập mẫu", "Đề thi năm trước"] }
          ]
        });
      }
    }
  }, [isOpen, noteId, docId]);

  const fetchNoteMindmap = async () => {
    setLoading(true);
    try {
      const res = await generateMindmapFromNoteApi(noteId);
      if (res && res.success && res.data) {
        setMindmapData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocMindmap = async () => {
    setLoading(true);
    try {
      const res = await generateMindmapFromDocApi(docId);
      if (res && res.success && res.data) {
        setMindmapData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
                {mindmapData?.title || 'AI Mindmap: Sơ đồ tư duy môn học'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">Cấu trúc cây tự động được vẽ bởi AI</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              AI Gemini đang vẽ sơ đồ tư duy...
            </p>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 dark:bg-[#172136] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="p-3 bg-blue-600 text-white rounded-xl font-bold text-sm text-center shadow-md max-w-xs mx-auto">
              {mindmapData?.title || 'Môn học'}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              {(mindmapData?.nodes || []).map((node, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold text-xs rounded-lg text-center">
                    {node.label || node.title}
                  </div>
                  <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pl-2">
                    {(node.subnodes || node.children || []).map((sub, sIdx) => (
                      <li key={sIdx}>• {typeof sub === 'string' ? sub : sub.title}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 4. CREATE SUBJECT MODAL (Real API Call) ───────────────────────────────────
export function CreateSubjectModal({ isOpen, onClose, onAddSubject, subjectToEdit = null }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [type, setType] = useState('SCHOOL');
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (subjectToEdit) {
        setName(subjectToEdit.name || '');
        setColor(subjectToEdit.color || '#2563EB');
        setType(subjectToEdit.type || 'SCHOOL');
        setClassCode(subjectToEdit.classCode || '');
      } else {
        setName('');
        setColor('#2563EB');
        setType('SCHOOL');
        setClassCode('');
      }
      setError('');
    }
  }, [isOpen, subjectToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    setError('');

    try {
      let res;
      if (subjectToEdit) {
        res = await updateSubjectApi(subjectToEdit.id, { name, color, type, classCode });
      } else {
        res = await createSubjectApi({ name, color, type, classCode });
      }

      if (res && res.success) {
        onAddSubject();
        onClose();
        setName('');
        setClassCode('');
      } else {
        setError(res?.message || (subjectToEdit ? 'Cập nhật môn học thất bại.' : 'Tạo môn học thất bại.'));
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>{subjectToEdit ? 'Chỉnh sửa môn học' : 'Thêm môn học mới'}</span>
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên môn học *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Cấu trúc dữ liệu & Giải thuật"
              className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Loại môn học</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              >
                <option value="SCHOOL">Trường học</option>
                <option value="SELF_STUDY">Tự học</option>
                <option value="LANGUAGE">Ngoại ngữ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã lớp / Môn</label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="VD: INT1332"
                className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Màu đại diện</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-10 bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-1 cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400">{color}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm">Hủy</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md disabled:opacity-60">
              {subjectToEdit ? (loading ? 'Đang lưu...' : 'Lưu thay đổi') : (loading ? 'Đang tạo...' : 'Tạo môn học')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 5. CREATE TASK MODAL (Real API Call) ──────────────────────────────────────
export function CreateTaskModal({ isOpen, onClose, subjects = [], onAddTask }) {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError('');

    let deadlineIso = null;
    if (deadlineDate) {
      const timeStr = deadlineTime || '23:59';
      deadlineIso = `${deadlineDate}T${timeStr}:00`;
    }

    try {
      const res = await createTaskApi({
        subjectId: subjectId ? Number(subjectId) : null,
        title: title.trim(),
        priority,
        status: 'TODO',
        dueAt: deadlineIso
      });
      if (res && res.success) {
        onAddTask();
        onClose();
        setTitle('');
        setDeadlineDate('');
        setDeadlineTime('');
      } else {
        setError(res?.message || 'Tạo nhiệm vụ thất bại.');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <span>Thêm nhiệm vụ mới</span>
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="form-label">Mức ưu tiên<select className="field" value={priority} onChange={e => setPriority(e.target.value)}><option value="LOW">Bình thường</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option></select></label>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên nhiệm vụ *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Ôn tập 20 câu hỏi trắc nghiệm"
              className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Môn học liên quan (tùy chọn)</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
            >
              <option value="">Nhiệm vụ chung</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Hạn chót (ngày)</label>
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Giờ (tùy chọn)</label>
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm">Hủy</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md disabled:opacity-60">
              {loading ? 'Đang tạo...' : 'Tạo nhiệm vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── 7. CONFIRM DELETE MODAL ───────────────────────────────────────────────────
export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title = "Xác nhận xóa", message = "Bạn có chắc chắn muốn xóa không?", loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-6 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-['Inter']">
          {message}
        </p>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm">
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xác nhận xóa</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
