import React, { useState } from 'react';
import { X, Sparkles, Brain, CheckSquare, FileSearch } from 'lucide-react';

export default function AiGenerateModal({ isOpen, onClose, type, docId, onGenerate }) {
  const [config, setConfig] = useState({
    numberOfQuestions: 5,
    difficulty: 'Trung bình',
    focusAreas: '',
    language: 'Tiếng Việt'
  });

  if (!isOpen) return null;

  const titles = {
    quiz: 'Tạo Trắc nghiệm AI',
    mindmap: 'Tạo Sơ đồ tư duy',
    summary: 'Tóm tắt nội dung'
  };

  const icons = {
    quiz: <CheckSquare className="w-5 h-5" />,
    mindmap: <Brain className="w-5 h-5" />,
    summary: <FileSearch className="w-5 h-5" />
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(type, docId, config);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111C32] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              {icons[type]}
            </div>
            <h3 className="font-['Be_Vietnam_Pro'] font-bold text-xl text-slate-900 dark:text-white">
              {titles[type]}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {type === 'quiz' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Số lượng câu hỏi</label>
              <div className="flex gap-3">
                {[5, 10, 20].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConfig({...config, numberOfQuestions: num})}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                      config.numberOfQuestions === num 
                        ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Độ khó</label>
            <div className="flex gap-3">
              {['Dễ', 'Trung bình', 'Khó'].map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setConfig({...config, difficulty: level})}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                    config.difficulty === level 
                      ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ngôn ngữ đích</label>
            <select 
              value={config.language}
              onChange={(e) => setConfig({...config, language: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A233A] text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="Tiếng Việt">Tiếng Việt</option>
              <option value="English">English</option>
              <option value="日本語">日本語 (Japanese)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tập trung vào (Tuỳ chọn)</label>
            <input 
              type="text"
              placeholder="Vd: Chỉ tập trung vào công thức, bỏ qua lý thuyết..."
              value={config.focusAreas}
              onChange={(e) => setConfig({...config, focusAreas: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1A233A] text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 placeholder-slate-400"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5" />
            <span>Bắt đầu tạo</span>
          </button>
        </form>
      </div>
    </div>
  );
}
