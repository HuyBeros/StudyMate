import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Copy, Sparkles, Brain, Plus } from 'lucide-react';

export function QuizModal({ isOpen, onClose }) {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const questions = [
    {
      id: 1,
      text: "Trong bài toán Tích phân bội 2, công thức chuyển sang tọa độ cực là gì?",
      options: {
        A: "dx dy = r dr dθ",
        B: "dx dy = dr dθ",
        C: "dx dy = r^2 dr dθ",
        D: "dx dy = 2r dr dθ"
      },
      correct: "A",
      explanation: "Trong tọa độ cực, Jacobi J = r, nên vi phân diện tích dx dy = r dr dθ."
    },
    {
      id: 2,
      text: "Điều kiện cần để chuỗi số ∑ a_n hội tụ là gì?",
      options: {
        A: "lim (n->∞) a_n = 1",
        B: "lim (n->∞) a_n = 0",
        C: "lim (n->∞) a_n = ∞",
        D: "a_n > 0 với mọi n"
      },
      correct: "B",
      explanation: "Nếu chuỗi ∑ a_n hội tụ thì giới hạn của số hạng tổng quát a_n khi n tiến ra vô cùng phải bằng 0."
    },
    {
      id: 3,
      text: "Đạo hàm của hàm số f(x) = ln(x^2 + 1) bằng bao nhiêu?",
      options: {
        A: "1 / (x^2 + 1)",
        B: "2x / (x^2 + 1)",
        C: "x / (x^2 + 1)",
        D: "2 / (x^2 + 1)"
      },
      correct: "B",
      explanation: "(ln u)' = u' / u. Ở đây u = x^2 + 1 => u' = 2x."
    }
  ];

  const handleSelect = (qId, optionKey) => {
    if (submitted) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optionKey }));
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correct) score++;
    });
    return score;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-200/80 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
                AI Quiz: Trắc nghiệm Giải tích
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {questions.length} câu hỏi • Tự động chấm điểm bởi AI
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question List */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#172136] border border-slate-200/60 dark:border-slate-800">
              <h4 className="font-['Be_Vietnam_Pro'] font-bold text-sm text-slate-900 dark:text-white">
                Câu {idx + 1}: {q.text}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {Object.entries(q.options).map(([key, val]) => {
                  const isSelected = selectedAnswers[q.id] === key;
                  const isCorrect = q.correct === key;

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
                      onClick={() => handleSelect(q.id, key)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span><strong>{key}.</strong> {val}</span>
                      {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </button>
                  );
                })}
              </div>

              {submitted && (
                <div className="p-3 bg-blue-50/80 dark:bg-blue-950/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 leading-relaxed border border-blue-100 dark:border-blue-900/50">
                  <strong>💡 Giải thích AI:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer / Score Breakdown */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {submitted ? (
            <div className="flex items-center gap-3">
              <span className="font-['Manrope'] font-extrabold text-2xl text-blue-600 dark:text-blue-400">
                {calculateScore()} / {questions.length} điểm
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                ({Math.round((calculateScore() / questions.length) * 100)}% chính xác)
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Vui lòng chọn đáp án cho tất cả các câu trước khi nộp bài.
            </span>
          )}

          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md"
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

export function SummaryModal({ isOpen, onClose, title = "Tài liệu học tập.pdf" }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const summaryContent = `
# 📌 Tóm tắt bài giảng: Tích phân bội và ứng dụng

## 1. Tóm tắt các khái niệm cốt lõi:
- **Tích phân kép (Double Integral):** Dùng để tính thể tích hình trụ cong bên dưới mặt phẳng $z = f(x,y)$ trên miền phẳng $D$.
- **Đổi biến sang Tọa độ cực:** Sử dụng khi miền $D$ có dạng hình tròn hoặc hình quạt tròn ($x = r \\cos\\theta, y = r \\sin\\theta$). Vi phân $dx dy = r dr d\\theta$.

## 2. Các dạng bài tập hay gặp trong đề thi:
- **Dạng 1:** Đổi thứ tự lấy tích phân $\\int dx \\int dy \\rightarrow \\int dy \\int dx$.
- **Dạng 2:** Tính diện tích miền phẳng $D = \\iint_D dx dy$.

## 3. Gợi ý từ AI Tutor:
Nên ôn kỹ lại bài tập trang 45 trước kỳ thi giữa kỳ!
  `;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summaryContent);
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
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#172136] border border-slate-200/60 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed space-y-3 font-mono whitespace-pre-wrap">
          {summaryContent}
        </div>

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

export function MindmapModal({ isOpen, onClose }) {
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
                AI Mindmap: Sơ đồ tư duy môn Giải tích
              </h3>
              <p className="text-xs text-slate-400 font-medium">Cấu trúc cây tự động được vẽ bởi AI</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tree Mindmap Visual Mockup */}
        <div className="p-6 bg-slate-50 dark:bg-[#172136] rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="p-3 bg-blue-600 text-white rounded-xl font-bold text-sm text-center shadow-md max-w-xs mx-auto">
            Toán Giải Tích 1
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="space-y-2">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 font-bold text-xs rounded-lg text-center">
                1. Giới hạn & Liên tục
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pl-2">
                <li>• Khái niệm giới hạn</li>
                <li>• Quy tắc L'Hôpital</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 font-bold text-xs rounded-lg text-center">
                2. Đạo hàm & Vi phân
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pl-2">
                <li>• Công thức cơ bản</li>
                <li>• Cực trị hàm số</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-bold text-xs rounded-lg text-center">
                3. Tích phân bội
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 pl-2">
                <li>• Tích phân kép</li>
                <li>• Đổi tọa độ cực</li>
              </ul>
            </div>
          </div>
        </div>

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

export function CreateSubjectModal({ isOpen, onClose, onAddSubject }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563EB');
  const [type, setType] = useState('SCHOOL');
  const [classCode, setClassCode] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    onAddSubject({
      id: Date.now(),
      name,
      color,
      type,
      classCode,
      progress: 0,
      totalDocuments: 0,
      totalNotes: 0,
      description: "Môn học mới được khởi tạo.",
      icon: "BookOpen",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80"
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
            Thêm môn học mới
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tên môn học</label>
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
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Mã lớp / Môn</label>
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="VD: INT1332"
                className="w-full bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:border-blue-500 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Màu nhận diện</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-[#172136] border border-slate-200 dark:border-slate-700 rounded-xl p-1 cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-sm">Hủy</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md">Tạo môn học</button>
          </div>
        </form>
      </div>
    </div>
  );
}
