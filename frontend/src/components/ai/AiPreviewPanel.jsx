import { useState } from 'react';
import { 
  X, Save, RotateCcw, CheckCircle2, Brain, CheckSquare, FileSearch, Edit3
} from 'lucide-react';

export default function AiPreviewPanel({ onClose, data, type, onSave, onRegenerate, busy, error }) {
  const [editableData, setEditableData] = useState(data);

  function editQuestion(index, field, value) {
    setEditableData(current => ({
      ...current,
      questions: current.questions.map((question, position) =>
        position === index ? { ...question, [field]: value } : question
      ),
    }));
  }

  const titles = {
    quiz: 'Xem trước Trắc nghiệm',
    mindmap: 'Xem trước Sơ đồ tư duy',
    summary: 'Xem trước Tóm tắt'
  };

  const icons = {
    quiz: <CheckSquare className="w-5 h-5 text-emerald-600" />,
    mindmap: <Brain className="w-5 h-5 text-purple-600" />,
    summary: <FileSearch className="w-5 h-5 text-amber-600" />
  };

  const handleSave = () => {
    onSave(editableData);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ai-preview-title" className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111C32] p-3 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onClose} disabled={busy} aria-label="Đóng xem trước AI" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {icons[type]}
            <h2 id="ai-preview-title" className="font-['Be_Vietnam_Pro'] font-bold text-lg text-slate-900 dark:text-white">
              {titles[type]}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onRegenerate} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <RotateCcw className="w-4 h-4" />
            <span>Tạo lại</span>
          </button>
          <button onClick={handleSave} disabled={busy} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95">
            <Save className="w-4 h-4" />
            <span>{busy ? 'Đang lưu…' : 'Lưu vào Ôn tập'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        
        {/* Main Content Area (Left) */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="max-w-3xl mx-auto space-y-6">
            {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
            
            <div className="bg-white dark:bg-[#111C32] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <input 
                type="text" 
                value={editableData.title || ''} 
                onChange={(e) => setEditableData({...editableData, title: e.target.value})}
                className="text-2xl font-bold text-slate-900 dark:text-white bg-transparent border-none outline-none w-full mb-2 placeholder-slate-400"
                placeholder="Nhập tiêu đề..."
              />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Bạn có thể nhấp vào nội dung bên dưới để chỉnh sửa trước khi lưu.
              </p>
            </div>

            {/* QUIZ PREVIEW */}
            {type === 'quiz' && editableData.questions && (
              <div className="space-y-4">
                {editableData.questions.map((q, idx) => (
                  <div key={idx} className="bg-white dark:bg-[#111C32] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </span>
                        <input 
                          type="text"
                          value={q.questionText}
                          onChange={e => editQuestion(idx, 'questionText', e.target.value)}
                          className="font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-none outline-none flex-1"
                        />
                      </div>
                      <Edit3 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                      {['A', 'B', 'C', 'D'].map(opt => {
                        const optKey = `option${opt}`;
                        const isCorrect = q.correctOption === opt;
                        return (
                          <div key={opt} className={`flex items-center p-3 rounded-xl border ${
                            isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50'
                          }`}>
                            <span className={`font-bold mr-3 ${isCorrect ? 'text-emerald-600' : 'text-slate-500'}`}>{opt}.</span>
                            <input 
                              type="text"
                              value={q[optKey]}
                              onChange={e => editQuestion(idx, optKey, e.target.value)}
                              className={`bg-transparent border-none outline-none w-full text-sm ${isCorrect ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}
                            />
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-2" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MINDMAP PREVIEW */}
            {type === 'mindmap' && editableData.structure && (
              <div className="bg-white dark:bg-[#111C32] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[400px] flex items-center justify-center">
                {/* Simplified Tree Visualization for Preview */}
                <div className="text-center">
                  <div className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl font-bold mb-8 relative">
                    {editableData.structure.label ?? editableData.structure.title}
                    <div className="absolute w-px h-8 bg-slate-300 dark:bg-slate-700 left-1/2 -bottom-8"></div>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    {(editableData.structure.children || []).map((child, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className="w-full h-px bg-slate-300 dark:bg-slate-700"></div>
                        <div className="px-4 py-2 mt-4 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg text-sm font-semibold border border-purple-200 dark:border-purple-800">
                        {child.label ?? child.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUMMARY PREVIEW */}
            {type === 'summary' && editableData.summary && (
              <div className="bg-white dark:bg-[#111C32] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <textarea 
                  value={editableData.summary}
                  onChange={(e) => setEditableData({...editableData, summary: e.target.value})}
                  className="w-full min-h-[400px] bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 leading-relaxed resize-none"
                />
              </div>
            )}

          </div>
        </div>


      </div>
    </div>
  );
}
